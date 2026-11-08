/**
 * Self-test for the accounting maths. Run: npx tsx scripts/finance-selftest.ts
 * (the SQL-side rules — overpayment, stock, immutability — are covered by the
 * PGlite test described in the PR notes.)
 */
import { parseToman, formatToman, parsePercentToBp, formatBp } from "../lib/finance/money";
import { monthRange, presetRange, rangeFromParams, monthOf, monthKey, addMonths, monthsInRange, monthLabel } from "../lib/finance/periods";
import {
  computeSalary, buildReport, salaryTable, enrollmentBalances, outstandingStudentPayments,
  paymentStatus, unpaidSalariesAllTime, bookTable, transactions, courseRevenue,
} from "../lib/finance/calc";
import { DEFAULT_SETTINGS, type Ledger } from "../lib/finance/types";

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.log(`FAIL ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

// money
eq("parse persian", parseToman("۴٬۵۰۰٬۰۰۰"), 4500000);
eq("parse latin commas", parseToman("4,500,000"), 4500000);
eq("parse arabic-indic", parseToman("٤٥٠٠"), 4500);
eq("reject decimal", parseToman("12.5"), null);
eq("reject negative", parseToman("-5"), null);
eq("reject text", parseToman("abc"), null);
eq("reject empty", parseToman("  "), null);
eq("fmt fa", formatToman(4500000, "fa"), "۴٬۵۰۰٬۰۰۰ تومان");
eq("fmt en", formatToman(4500000, "en"), "4,500,000 Toman");
eq("fmt negative", formatToman(-1200, "en"), "−1,200 Toman");
eq("percent parse", parsePercentToBp("25.5"), 2550);
eq("percent parse fa", parsePercentToBp("۲۵"), 2500);
eq("percent >100 rejected", parsePercentToBp("101"), null);
eq("bp format", formatBp(2550, "en"), "25.5%");

// salary formulas
eq("hourly 9 sessions × 90min @ 200k/h", computeSalary("hourly", 200000, { sessions: 9, minutes: 810, revenue: 0 }), 2700000);
eq("hourly rounds to integer", computeSalary("hourly", 100000, { sessions: 1, minutes: 50, revenue: 0 }), 83333);
eq("per class", computeSalary("per_class", 350000, { sessions: 8, minutes: 0, revenue: 0 }), 2800000);
eq("percentage 25% of 10M", computeSalary("percentage", 2500, { sessions: 0, minutes: 0, revenue: 10000000 }), 2500000);
eq("percentage of negative revenue is 0", computeSalary("percentage", 2500, { sessions: 0, minutes: 0, revenue: -500 }), 0);
eq("percentage 33.33% rounds", computeSalary("percentage", 3333, { sessions: 0, minutes: 0, revenue: 1000 }), 333);

// calendar
eq("Mehr 1405", monthRange("jalali", { y: 1405, m: 7 }), { from: "2026-09-23", to: "2026-10-22" });
eq("Esfand 1403 is leap (30 days)", monthRange("jalali", { y: 1403, m: 12 }), { from: "2025-02-19", to: "2025-03-20" });
eq("Esfand 1404 has 29 days", monthRange("jalali", { y: 1404, m: 12 }), { from: "2026-02-20", to: "2026-03-20" });
eq("gregorian Feb 2028 leap", monthRange("gregorian", { y: 2028, m: 2 }), { from: "2028-02-01", to: "2028-02-29" });
eq("monthOf 2026-10-22 = Mehr 1405 (last day)", monthOf("2026-10-22", "jalali"), { y: 1405, m: 7 });
eq("monthOf 2026-10-23 = Aban 1405", monthOf("2026-10-23", "jalali"), { y: 1405, m: 8 });
eq("addMonths wraps year", addMonths({ y: 1405, m: 12 }, 1), { y: 1406, m: 1 });
eq("addMonths back", addMonths({ y: 1405, m: 1 }, -1), { y: 1404, m: 12 });
eq("this_month preset", presetRange("this_month", "2026-10-10", "jalali"), { from: "2026-09-23", to: "2026-10-22" });
eq("last_month preset", presetRange("last_month", "2026-10-10", "jalali"), { from: "2026-08-23", to: "2026-09-22" });
eq("last_3_months preset", presetRange("last_3_months", "2026-10-10", "jalali"), { from: "2026-07-23", to: "2026-10-22" });
eq("this_year preset starts Farvardin 1", presetRange("this_year", "2026-10-10", "jalali").from, "2026-03-21");
eq("custom range swaps reversed dates", rangeFromParams({ range: "custom", from: "2026-05-02", to: "2026-05-01" }, "2026-10-10", "jalali").range, { from: "2026-05-01", to: "2026-05-02" });
eq("bad params fall back", rangeFromParams({ range: "zzz" }, "2026-10-10", "jalali", "last_month").preset, "last_month");
eq("months in range", monthsInRange("jalali", { from: "2026-07-23", to: "2026-10-22" }).map(monthKey), ["1405-05", "1405-06", "1405-07"]);
eq("month label fa", monthLabel("jalali", { y: 1405, m: 7 }, "fa"), "مهر ۱۴۰۵");

// payment status
eq("status pending", paymentStatus(4000000, 0, 0), "pending");
eq("status partial", paymentStatus(4000000, 1500000, 0), "partial");
eq("status paid", paymentStatus(4000000, 4000000, 0), "paid");
eq("status refunded", paymentStatus(4000000, 4000000, 4000000), "refunded");
eq("partial refund stays partial", paymentStatus(4000000, 4000000, 1000000), "partial");

// ---- a full scenario ---------------------------------------------------------------------
const MEHR = { from: "2026-09-23", to: "2026-10-22" };
const L: Ledger = {
  settings: { ...DEFAULT_SETTINGS, default_salary_method: "per_class", default_salary_rate: 100000, low_stock_threshold: 3 },
  rates: [{ teacher_id: "t2", method: "percentage", rate: 2000 }],
  teachers: [{ id: "t1", name: "Reza" }, { id: "t2", name: "Maryam" }],
  classes: [
    { id: "c1", title: "Step 3 Sat/Wed", teacherId: "t1", courseId: "k1", courseTitle: "Step 3" },
    { id: "c2", title: "NSE 5", teacherId: "t2", courseId: "k2", courseTitle: "NSE 5" },
  ],
  enrollments: [
    { id: "e1", studentId: "s1", studentName: "Sara", classId: "c1", classTitle: "Step 3", courseTitle: "Step 3", teacherId: "t1", teacherName: "Reza", fee: 4000000 },
    { id: "e2", studentId: "s2", studentName: "Ali", classId: "c2", classTitle: "NSE 5", courseTitle: "NSE 5", teacherId: "t2", teacherName: "Maryam", fee: 5000000 },
    { id: "e3", studentId: "s3", studentName: "Nima", classId: "c1", classTitle: "Step 3", courseTitle: "Step 3", teacherId: "t1", teacherName: "Reza", fee: 4000000 },
  ],
  payments: [
    // Sara pays in two parts
    p("p1", "e1", "c1", "s1", "payment", "completed", 1500000, "2026-09-25"),
    p("p2", "e1", "c1", "s1", "payment", "completed", 2500000, "2026-10-05"),
    // Ali pays in full, then gets a partial refund
    p("p3", "e2", "c2", "s2", "payment", "completed", 5000000, "2026-10-02"),
    p("p4", "e2", "c2", "s2", "refund", "completed", 1000000, "2026-10-09"),
    // Nima: only a PENDING promise (not cash) + a voided mistake
    p("p5", "e3", "c1", "s3", "payment", "pending", 2000000, "2026-10-10"),
    { ...p("p6", "e3", "c1", "s3", "payment", "completed", 999999, "2026-10-11"), voided_at: "2026-10-12" },
  ],
  statements: [],
  salaryPayments: [],
  inventory: [{ id: "i1", book_id: "b1", title_snapshot: "Four Corners", selling_price: 300000, last_unit_cost: 200000, stock_qty: 11, stock_value: 2310000 }],
  purchases: [
    { id: "bp1", inventory_id: "i1", quantity: 10, unit_cost: 200000, total: 2000000, purchased_at: "2026-09-24", method: "cash", supplier: null, note: null, voided_at: null, void_reason: null },
    { id: "bp2", inventory_id: "i1", quantity: 5, unit_cost: 230000, total: 1150000, purchased_at: "2026-10-03", method: "cash", supplier: null, note: null, voided_at: null, void_reason: null },
  ],
  sales: [
    { id: "bs1", inventory_id: "i1", title: "Four Corners", quantity: 4, unit_price: 300000, revenue: 1200000, cogs: 840000, sold_at: "2026-10-04", method: "cash", student_id: null, buyer_name: null, note: null, voided_at: null, void_reason: null },
  ],
  expenses: [
    { id: "x1", category: "rent", amount: 15000000, expense_date: "2026-10-01", method: "bank_transfer", description: null, receipt_path: null, voided_at: null, void_reason: null },
    { id: "x2", category: "marketing", amount: 800000, expense_date: "2026-10-07", method: "card", description: null, receipt_path: null, voided_at: null, void_reason: null },
    { id: "x3", category: "other", amount: 123, expense_date: "2026-10-08", method: "cash", description: null, receipt_path: null, voided_at: "2026-10-09", void_reason: "typo" },
  ],
  otherIncome: [{ id: "oi1", amount: 500000, income_date: "2026-10-06", source: "Exam fee", method: "cash", note: null, voided_at: null, void_reason: null }],
  // Reza: 4 sessions (90 min). Maryam: 3 sessions
  sessions: [
    ...["2026-09-26", "2026-09-30", "2026-10-03", "2026-10-07"].map((d) => ({ classId: "c1", teacherId: "t1", date: d, minutes: 90 })),
    ...["2026-10-01", "2026-10-04", "2026-10-08"].map((d) => ({ classId: "c2", teacherId: "t2", date: d, minutes: 90 })),
    { classId: "c1", teacherId: "t1", date: "2026-11-01", minutes: 90 }, // next month — must not count
  ],
};
function p(id: string, enr: string, cls: string, stu: string, kind: "payment" | "refund", status: "completed" | "pending", amount: number, paid_at: string) {
  return { id, enrollment_id: enr, student_id: stu, class_id: cls, student_name: stu, class_title: cls, kind, status, amount, method: "card" as const, paid_at, reference: null, note: null, voided_at: null, void_reason: null, created_at: paid_at };
}

// student side
const bal = Object.fromEntries(enrollmentBalances(L).map((b) => [b.id, b]));
eq("Sara net 4M paid", [bal.e1.net, bal.e1.remaining, bal.e1.status], [4000000, 0, "paid"]);
eq("Ali net 4M (5M − 1M refund) partial", [bal.e2.net, bal.e2.remaining, bal.e2.status], [4000000, 1000000, "partial"]);
eq("Nima: pending not counted, voided ignored", [bal.e3.net, bal.e3.pendingAmount, bal.e3.remaining, bal.e3.status], [0, 2000000, 4000000, "pending"]);
eq("outstanding = 1M + 4M", outstandingStudentPayments(L), 5000000);

// salary: Reza per-class 100k × 4 = 400k ; Maryam 20% of (5M − 1M) = 800k
const rows = Object.fromEntries(salaryTable(L, "jalali", { y: 1405, m: 7 }).map((r) => [r.teacherId, r]));
eq("Reza 4 sessions / 360 min / 400k", [rows.t1.sessions, rows.t1.minutes, rows.t1.salary], [4, 360, 400000]);
eq("Maryam 20% of net revenue", [rows.t2.method, rows.t2.revenue, rows.t2.salary], ["percentage", 4000000 - 0, 800000]);
eq("Reza revenue base (Sara 4M, voided/pending excluded)", rows.t1.revenue, 4000000);

// report
const r = buildReport(L, "jalali", MEHR);
eq("course payments gross", r.income.coursePaymentsGross, 9000000);
eq("refunds deducted from revenue", [r.income.refunds, r.income.coursePayments], [1000000, 8000000]);
eq("pending/voided never income", r.income.coursePayments, 8000000);
eq("book sales + other income", [r.income.bookSales, r.income.otherIncome], [1200000, 500000]);
eq("total income", r.income.total, 9700000);
eq("salaries incurred 400k+800k", r.expenses.teacherSalaries, 1200000);
eq("COGS 840k, NOT the 3.15M purchased", r.expenses.booksCogs, 840000);
eq("voided expense ignored", r.expenses.other, 0);
eq("total expenses", r.expenses.total, 1200000 + 15000000 + 800000 + 840000);
eq("net profit", r.netProfit, 9700000 - 17840000);
eq("gross profit = income − COGS − teacher salaries", r.grossProfit, 9700000 - 840000 - 1200000);
eq("cash: no salary paid yet, but purchases hit cash", [r.cash.salaryPaid, r.cash.bookPurchases, r.cash.expensesPaid], [0, 3150000, 15800000]);
eq("net cash flow differs from profit", r.cash.net, 9700000 - 3150000 - 15800000);
eq("unpaid salaries (period) = all of it", r.unpaidSalaries, 1200000);

// freeze a statement for Reza and pay part → never double counted
L.statements.push({ id: "st1", teacher_id: "t1", teacher_name: "Reza", period_key: "1405-07", period_start: MEHR.from, period_end: MEHR.to, method: "per_class", rate: 100000, sessions: 4, minutes: 360, revenue_base: 0, gross_amount: 400000, created_at: "" });
L.salaryPayments.push({ id: "sp1", statement_id: "st1", teacher_id: "t1", amount: 150000, method: "bank_transfer", paid_at: "2026-10-15", reference: null, note: null, voided_at: null, void_reason: null });
L.salaryPayments.push({ id: "sp2", statement_id: "st1", teacher_id: "t1", amount: 50000, method: "bank_transfer", paid_at: "2026-10-16", reference: null, note: null, voided_at: "2026-10-17", void_reason: "oops" });
const r2 = buildReport(L, "jalali", MEHR);
eq("statement replaces estimate (no double count)", r2.expenses.teacherSalaries, 1200000);
eq("only non-voided salary payments are cash", r2.cash.salaryPaid, 150000);
eq("unpaid after partial pay", r2.unpaidSalaries, 1200000 - 150000);
eq("all-time unpaid = statement balance", unpaidSalariesAllTime(L), 250000);
L.sessions.push({ classId: "c1", teacherId: "t1", date: "2026-10-20", minutes: 90 });
const row2 = salaryTable(L, "jalali", { y: 1405, m: 7 }).find((x) => x.teacherId === "t1")!;
eq("frozen statement does not move; flagged stale", [row2.salary, row2.stale, row2.remaining], [400000, true, 250000]);
eq("report still uses the frozen amount", buildReport(L, "jalali", MEHR).expenses.teacherSalaries, 1200000);

// partial range uses live estimate, not the monthly statement
const half = buildReport(L, "jalali", { from: "2026-09-23", to: "2026-10-05" });
eq("partial month ignores statement (live: Reza 3 sessions)", half.expenses.teacherSalaries >= 300000, true);

// books
const bt = bookTable(L)[0];
eq("book: purchased 15, sold 4, stock 11", [bt.purchased, bt.sold, bt.stock], [15, 4, 11]);
eq("book: avg cost 210k, profit/book 90k, total profit 360k", [bt.avgCost, bt.profitPerBook, bt.totalProfit], [210000, 90000, 360000]);
eq("low stock flag off at 11 (threshold 3)", bt.low, false);
eq("low stock flag on", bookTable({ ...L, settings: { ...L.settings, low_stock_threshold: 11 } })[0].low, true);

// history
const tx = transactions(L);
eq("transactions include every source", new Set(tx.map((t) => t.type)).size, 7);
eq("transactions newest first", tx[0].date >= tx[tx.length - 1].date, true);
eq("course revenue grouped by course", courseRevenue(L, MEHR), [{ title: "Step 3", revenue: 4000000 }, { title: "NSE 5", revenue: 4000000 }].sort((a, b) => b.revenue - a.revenue));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
