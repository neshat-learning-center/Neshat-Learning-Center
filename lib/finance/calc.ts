import type {
  Ledger, SalaryMethod, StatementRec, PaymentRec, EnrollmentInfo, ExpenseCategory, PayMethod,
} from "./types";
import { type Calendar, type Month, type Range, inRange, monthKey, monthRange, monthsInRange } from "./periods";

/**
 * Pure accounting calculations — no I/O, no floats. Every amount is an integer
 * number of Toman. Keeping this free of database code is what lets the rules
 * be tested exhaustively (see scripts/finance-selftest).
 */

// ---- salary -----------------------------------------------------------------

export function computeSalary(
  method: SalaryMethod,
  rate: number,
  f: { sessions: number; minutes: number; revenue: number },
): number {
  switch (method) {
    case "hourly":
      return Math.round((f.minutes * rate) / 60); // minutes × (rate per hour) / 60
    case "per_class":
      return f.sessions * rate;
    case "percentage":
      return Math.round((Math.max(f.revenue, 0) * rate) / 10000); // rate in basis points
  }
}

export function effectiveRate(l: Ledger, teacherId: string): { method: SalaryMethod; rate: number; custom: boolean } {
  const r = l.rates.find((x) => x.teacher_id === teacherId);
  return r
    ? { method: r.method, rate: r.rate, custom: true }
    : { method: l.settings.default_salary_method, rate: l.settings.default_salary_rate, custom: false };
}

export const activePayments = (l: Ledger) => l.payments.filter((p) => !p.voided_at && p.status === "completed");

/** net cash (payments − refunds) received in `range` for classes this teacher teaches */
export function teacherRevenue(l: Ledger, teacherId: string, range: Range): number {
  const mine = new Set(l.classes.filter((c) => c.teacherId === teacherId).map((c) => c.id));
  let sum = 0;
  for (const p of activePayments(l)) {
    if (!p.class_id || !mine.has(p.class_id) || !inRange(p.paid_at, range)) continue;
    sum += p.kind === "payment" ? p.amount : -p.amount;
  }
  return sum;
}

export function teacherSessions(l: Ledger, teacherId: string, range: Range) {
  let sessions = 0;
  let minutes = 0;
  for (const s of l.sessions) {
    if (s.teacherId === teacherId && inRange(s.date, range)) {
      sessions += 1;
      minutes += s.minutes;
    }
  }
  return { sessions, minutes };
}

export interface SalaryCalc {
  method: SalaryMethod;
  rate: number;
  sessions: number;
  minutes: number;
  revenue: number;
  amount: number;
}

/** salary a teacher has earned over `range`, from completed (attendance-recorded) sessions */
export function estimateSalary(l: Ledger, teacherId: string, range: Range): SalaryCalc {
  const { method, rate } = effectiveRate(l, teacherId);
  const { sessions, minutes } = teacherSessions(l, teacherId, range);
  const revenue = teacherRevenue(l, teacherId, range);
  return { method, rate, sessions, minutes, revenue, amount: computeSalary(method, rate, { sessions, minutes, revenue }) };
}

export const statementFor = (l: Ledger, teacherId: string, key: string) =>
  l.statements.find((s) => s.teacher_id === teacherId && s.period_key === key);

export const paidAgainst = (l: Ledger, statementId: string) =>
  l.salaryPayments.filter((p) => p.statement_id === statementId && !p.voided_at).reduce((a, p) => a + p.amount, 0);

export interface SalaryEntry {
  teacherId: string;
  teacherName: string;
  monthKey: string;
  amount: number;
  source: "statement" | "estimate";
  statementId?: string;
}

/**
 * Salary INCURRED in `range`, per teacher per month. A month that lies fully
 * inside the range uses its frozen statement when one exists (so a salary is
 * never counted twice, and finalised numbers never move); otherwise — and for
 * partially covered months — the live estimate over the overlap is used.
 */
export function salaryEntries(l: Ledger, cal: Calendar, range: Range): SalaryEntry[] {
  const out: SalaryEntry[] = [];
  for (const mo of monthsInRange(cal, range)) {
    const mr = monthRange(cal, mo);
    const full = mr.from >= range.from && mr.to <= range.to;
    const key = monthKey(mo);
    const overlap: Range = { from: mr.from < range.from ? range.from : mr.from, to: mr.to > range.to ? range.to : mr.to };
    for (const t of l.teachers) {
      const st = full ? statementFor(l, t.id, key) : undefined;
      if (st) {
        out.push({ teacherId: t.id, teacherName: t.name, monthKey: key, amount: st.gross_amount, source: "statement", statementId: st.id });
        continue;
      }
      const est = estimateSalary(l, t.id, overlap);
      if (est.amount > 0) out.push({ teacherId: t.id, teacherName: t.name, monthKey: key, amount: est.amount, source: "estimate" });
    }
  }
  return out;
}

export interface SalaryRow {
  teacherId: string;
  name: string;
  method: SalaryMethod;
  rate: number;
  customRate: boolean;
  sessions: number;
  minutes: number;
  revenue: number;
  calculated: number; // live calculation for the month
  statement?: StatementRec;
  salary: number; // statement amount when generated, else the live calculation
  paid: number;
  remaining: number;
  stale: boolean; // statement exists but the live numbers have since changed
}

export function salaryTable(l: Ledger, cal: Calendar, mo: Month): SalaryRow[] {
  const range = monthRange(cal, mo);
  const key = monthKey(mo);
  return l.teachers.map((t) => {
    const e = estimateSalary(l, t.id, range);
    const st = statementFor(l, t.id, key);
    const paid = st ? paidAgainst(l, st.id) : 0;
    const salary = st ? st.gross_amount : e.amount;
    return {
      teacherId: t.id,
      name: t.name,
      method: st ? st.method : e.method,
      rate: st ? st.rate : e.rate,
      customRate: effectiveRate(l, t.id).custom,
      sessions: st ? st.sessions : e.sessions,
      minutes: st ? st.minutes : e.minutes,
      revenue: st ? st.revenue_base : e.revenue,
      calculated: e.amount,
      statement: st,
      salary,
      paid,
      remaining: salary - paid,
      stale: !!st && st.gross_amount !== e.amount,
    };
  });
}

// ---- student payments ---------------------------------------------------------

export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";

export interface EnrollmentBalance extends EnrollmentInfo {
  paid: number; // completed payments
  refunded: number; // completed refunds
  net: number; // paid − refunded: the cash actually kept
  pendingAmount: number; // promised but not yet received — NOT cash
  remaining: number;
  status: PaymentStatus;
  lastPaidAt: string | null;
  lastMethod: PayMethod | null;
}

export function paymentStatus(fee: number, paid: number, refunded: number): PaymentStatus {
  const net = paid - refunded;
  if (refunded > 0 && net <= 0) return "refunded";
  if (fee > 0 && net >= fee) return "paid";
  if (net > 0) return "partial";
  return "pending";
}

export function enrollmentBalances(l: Ledger): EnrollmentBalance[] {
  const byEnr = new Map<string, PaymentRec[]>();
  for (const p of l.payments) {
    if (p.voided_at || !p.enrollment_id) continue;
    (byEnr.get(p.enrollment_id) ?? byEnr.set(p.enrollment_id, []).get(p.enrollment_id)!).push(p);
  }
  return l.enrollments.map((e) => {
    const rows = byEnr.get(e.id) ?? [];
    const done = rows.filter((r) => r.status === "completed");
    const paid = done.filter((r) => r.kind === "payment").reduce((a, r) => a + r.amount, 0);
    const refunded = done.filter((r) => r.kind === "refund").reduce((a, r) => a + r.amount, 0);
    const pendingAmount = rows.filter((r) => r.status === "pending").reduce((a, r) => a + r.amount, 0);
    const last = [...done].filter((r) => r.kind === "payment").sort((a, b) => (a.paid_at < b.paid_at ? 1 : -1))[0];
    const net = paid - refunded;
    return {
      ...e,
      paid, refunded, net, pendingAmount,
      remaining: Math.max(e.fee - net, 0),
      status: paymentStatus(e.fee, paid, refunded),
      lastPaidAt: last?.paid_at ?? null,
      lastMethod: last?.method ?? null,
    };
  });
}

/** What students still owe — never counted as cash. A fully refunded enrollment owes nothing. */
export const outstandingStudentPayments = (l: Ledger) =>
  enrollmentBalances(l).reduce((a, e) => a + (e.status === "refunded" ? 0 : e.remaining), 0);

// ---- period report (profit & loss + cash flow) -----------------------------------

export interface Report {
  range: Range;
  income: { coursePaymentsGross: number; refunds: number; coursePayments: number; bookSales: number; otherIncome: number; total: number };
  expenses: {
    teacherSalaries: number; staffSalaries: number; rent: number; utilities: number; internet: number;
    marketing: number; officeSupplies: number; maintenance: number; other: number; booksCogs: number; total: number;
  };
  grossProfit: number; // income − direct costs (cost of books sold + teacher salaries)
  netProfit: number; // income − all expenses
  cash: { inflow: number; salaryPaid: number; expensesPaid: number; bookPurchases: number; outflow: number; net: number };
  outstandingStudentPayments: number;
  unpaidSalaries: number; // incurred in this period, not yet paid
}

const sumExpense = (l: Ledger, range: Range, cat: ExpenseCategory) =>
  l.expenses.filter((e) => !e.voided_at && e.category === cat && inRange(e.expense_date, range)).reduce((a, e) => a + e.amount, 0);

export function buildReport(l: Ledger, cal: Calendar, range: Range): Report {
  const done = activePayments(l).filter((p) => inRange(p.paid_at, range));
  const gross = done.filter((p) => p.kind === "payment").reduce((a, p) => a + p.amount, 0);
  const refunds = done.filter((p) => p.kind === "refund").reduce((a, p) => a + p.amount, 0);
  const sales = l.sales.filter((s) => !s.voided_at && inRange(s.sold_at, range));
  const bookSales = sales.reduce((a, s) => a + s.revenue, 0);
  const booksCogs = sales.reduce((a, s) => a + s.cogs, 0);
  const otherIncome = l.otherIncome.filter((i) => !i.voided_at && inRange(i.income_date, range)).reduce((a, i) => a + i.amount, 0);
  const coursePayments = gross - refunds; // refunds are deducted from revenue
  const totalIncome = coursePayments + bookSales + otherIncome;

  const entries = salaryEntries(l, cal, range);
  const teacherSalaries = entries.reduce((a, e) => a + e.amount, 0);
  const unpaidSalaries = entries.reduce(
    (a, e) => a + (e.statementId ? e.amount - paidAgainst(l, e.statementId) : e.amount),
    0,
  );

  const x = (c: ExpenseCategory) => sumExpense(l, range, c);
  const expenses = {
    teacherSalaries,
    staffSalaries: x("staff_salaries"),
    rent: x("rent"),
    utilities: x("utilities"),
    internet: x("internet"),
    marketing: x("marketing"),
    officeSupplies: x("office_supplies"),
    maintenance: x("maintenance"),
    other: x("other"),
    booksCogs, // cost of books SOLD — purchases are inventory, not expense (no double count)
    total: 0,
  };
  expenses.total = Object.values(expenses).reduce((a, v) => a + v, 0);

  const salaryPaid = l.salaryPayments.filter((p) => !p.voided_at && inRange(p.paid_at, range)).reduce((a, p) => a + p.amount, 0);
  const expensesPaid = l.expenses.filter((e) => !e.voided_at && inRange(e.expense_date, range)).reduce((a, e) => a + e.amount, 0);
  const bookPurchases = l.purchases.filter((p) => !p.voided_at && inRange(p.purchased_at, range)).reduce((a, p) => a + p.total, 0);
  const outflow = salaryPaid + expensesPaid + bookPurchases;

  return {
    range,
    income: { coursePaymentsGross: gross, refunds, coursePayments, bookSales, otherIncome, total: totalIncome },
    expenses,
    grossProfit: totalIncome - booksCogs - teacherSalaries,
    netProfit: totalIncome - expenses.total,
    cash: { inflow: totalIncome, salaryPaid, expensesPaid, bookPurchases, outflow, net: totalIncome - outflow },
    outstandingStudentPayments: outstandingStudentPayments(l),
    unpaidSalaries,
  };
}

/** every salary statement's unpaid balance, regardless of period — what is genuinely owed today */
export const unpaidSalariesAllTime = (l: Ledger) =>
  l.statements.reduce((a, s) => a + (s.gross_amount - paidAgainst(l, s.id)), 0);

// ---- series for charts ----------------------------------------------------------

export function monthlySeries(l: Ledger, cal: Calendar, months: Month[]) {
  return months.map((mo) => {
    const r = buildReport(l, cal, monthRange(cal, mo));
    return { key: monthKey(mo), mo, income: r.income.total, expenses: r.expenses.total, net: r.netProfit };
  });
}

export function courseRevenue(l: Ledger, range: Range) {
  const course = new Map(l.classes.map((c) => [c.id, c.courseTitle]));
  const m = new Map<string, number>();
  for (const p of activePayments(l)) {
    if (!inRange(p.paid_at, range)) continue;
    const title = (p.class_id && course.get(p.class_id)) || p.class_title || "—";
    m.set(title, (m.get(title) ?? 0) + (p.kind === "payment" ? p.amount : -p.amount));
  }
  return [...m.entries()].map(([title, revenue]) => ({ title, revenue })).sort((a, b) => b.revenue - a.revenue);
}

export interface BookRow {
  id: string;
  title: string;
  sellingPrice: number;
  avgCost: number; // current weighted-average unit cost (last cost when out of stock)
  purchased: number;
  sold: number;
  stock: number;
  profitPerBook: number;
  totalProfit: number;
  revenue: number;
  low: boolean;
}

export function bookTable(l: Ledger, range?: Range): BookRow[] {
  return l.inventory.map((i) => {
    const purchased = l.purchases.filter((p) => p.inventory_id === i.id && !p.voided_at).reduce((a, p) => a + p.quantity, 0);
    const sales = l.sales.filter((s) => s.inventory_id === i.id && !s.voided_at && (!range || inRange(s.sold_at, range)));
    const soldAll = l.sales.filter((s) => s.inventory_id === i.id && !s.voided_at).reduce((a, s) => a + s.quantity, 0);
    const avgCost = i.stock_qty > 0 ? Math.round(i.stock_value / i.stock_qty) : i.last_unit_cost;
    const revenue = sales.reduce((a, s) => a + s.revenue, 0);
    const profit = sales.reduce((a, s) => a + s.revenue - s.cogs, 0);
    return {
      id: i.id, title: i.title_snapshot, sellingPrice: i.selling_price, avgCost,
      purchased, sold: range ? sales.reduce((a, s) => a + s.quantity, 0) : soldAll, stock: i.stock_qty,
      profitPerBook: i.selling_price - avgCost, totalProfit: profit, revenue,
      low: i.stock_qty <= l.settings.low_stock_threshold,
    };
  });
}

// ---- unified transaction history ----------------------------------------------------

export type TxnType = "student_payment" | "refund" | "book_sale" | "salary_payment" | "staff_payment" | "expense" | "other_income" | "book_purchase";

export interface Txn {
  id: string;
  date: string;
  type: TxnType;
  direction: "in" | "out";
  amount: number;
  category: string; // expense category, or the type for non-expenses
  description: string;
  studentId?: string | null;
  studentName?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  method: PayMethod;
  pending?: boolean;
  voided: boolean;
}

export function transactions(l: Ledger): Txn[] {
  const tName = new Map(l.teachers.map((t) => [t.id, t.name]));
  const stmt = new Map(l.statements.map((s) => [s.id, s]));
  const out: Txn[] = [];
  for (const p of l.payments) {
    out.push({
      id: p.id, date: p.paid_at, type: p.kind === "refund" ? "refund" : "student_payment",
      direction: p.kind === "refund" ? "out" : "in", amount: p.amount, category: p.kind === "refund" ? "refund" : "course_payment",
      description: p.class_title ?? "", studentId: p.student_id, studentName: p.student_name, method: p.method,
      pending: p.status === "pending", voided: !!p.voided_at,
    });
  }
  for (const s of l.sales) {
    out.push({
      id: s.id, date: s.sold_at, type: "book_sale", direction: "in", amount: s.revenue, category: "book_sale",
      description: `${s.title} × ${s.quantity}`, studentId: s.student_id, studentName: s.buyer_name, method: s.method, voided: !!s.voided_at,
    });
  }
  for (const p of l.salaryPayments) {
    const st = stmt.get(p.statement_id);
    out.push({
      id: p.id, date: p.paid_at, type: "salary_payment", direction: "out", amount: p.amount, category: "teacher_salaries",
      description: st?.period_key ?? "", teacherId: p.teacher_id, teacherName: (p.teacher_id && tName.get(p.teacher_id)) || st?.teacher_name,
      method: p.method, voided: !!p.voided_at,
    });
  }
  for (const e of l.expenses) {
    out.push({
      id: e.id, date: e.expense_date, type: e.category === "staff_salaries" ? "staff_payment" : "expense", direction: "out",
      amount: e.amount, category: e.category, description: e.description ?? "", method: e.method, voided: !!e.voided_at,
    });
  }
  for (const i of l.otherIncome) {
    out.push({
      id: i.id, date: i.income_date, type: "other_income", direction: "in", amount: i.amount, category: "other_income",
      description: i.source, method: i.method, voided: !!i.voided_at,
    });
  }
  const inv = new Map(l.inventory.map((i) => [i.id, i.title_snapshot]));
  for (const p of l.purchases) {
    out.push({
      id: p.id, date: p.purchased_at, type: "book_purchase", direction: "out", amount: p.total, category: "book_purchases",
      description: `${inv.get(p.inventory_id) ?? ""} × ${p.quantity}`, method: p.method, voided: !!p.voided_at,
    });
  }
  return out.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}
