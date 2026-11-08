import ExcelJS from "exceljs";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getSession } from "@/lib/auth";
import { loadLedger } from "@/lib/finance/data";
import { makeT, type T } from "@/lib/finance/labels";
import { formatDate } from "@/lib/finance/money";
import { rangeFromParams, todayIso, monthOf, parseMonthKey, monthRange, monthLabel } from "@/lib/finance/periods";
import {
  buildReport, salaryTable, transactions, enrollmentBalances, bookTable, paidAgainst,
} from "@/lib/finance/calc";
import { filterTransactions } from "@/lib/finance/filters";
import { ALL_EXPENSE_CATEGORIES } from "@/lib/finance/types";

/** Excel export. Money cells are real integer numbers (Toman) so sums/formulas work; the unit is in each header. */
export async function GET(req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const l = locale as Locale;
  const session = await getSession();
  if (!session || session.role !== "admin" || session.demo) return new Response("Forbidden", { status: 403 });

  const res = await loadLedger(l);
  if (!res.ok) return new Response(res.message ?? res.reason, { status: 503 });
  const ledger = res.ledger;
  const t = makeT(l);
  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries()) as Record<string, string | undefined>;
  const kind = sp.kind ?? "transactions";
  const cal = ledger.settings.calendar;
  const unit = l === "fa" ? "تومان" : "Toman";
  const money = (label: string) => `${label} (${unit})`;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Neshat Learning Center";
  const ws = wb.addWorksheet(sheetName(kind, t), { views: [{ rightToLeft: l === "fa", state: "frozen", ySplit: 1 }] });

  const header = (cols: { h: string; w?: number; money?: boolean }[]) => {
    ws.columns = cols.map((c) => ({ header: c.h, width: c.w ?? 18, style: c.money ? { numFmt: "#,##0" } : {} }));
    const row = ws.getRow(1);
    row.font = { bold: true };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBE9BF" } };
    row.alignment = { vertical: "middle", horizontal: "center" };
  };
  const mLabel = (c: string) => t(`m_${c}` as "m_cash");

  if (kind === "transactions") {
    const rows = filterTransactions(transactions(ledger), sp);
    header([{ h: t("date") }, { h: t("type") }, { h: t("category"), w: 20 }, { h: t("description"), w: 32 }, { h: t("student"), w: 20 }, { h: t("teacher"), w: 20 }, { h: t("method") }, { h: t("direction"), w: 10 }, { h: money(t("amount")), money: true }, { h: t("status"), w: 14 }]);
    for (const x of rows) {
      ws.addRow([
        formatDate(x.date, l), t(`t_${x.type}` as "t_expense"),
        (ALL_EXPENSE_CATEGORIES as string[]).includes(x.category) ? t(`c_${x.category}` as "c_rent") : "",
        x.description, x.studentName ?? "", x.teacherName ?? "", mLabel(x.method), x.direction === "in" ? t("in") : t("out"),
        x.direction === "in" ? x.amount : -x.amount, x.voided ? t("voided") : x.pending ? t("pendingTag") : "✓",
      ]);
    }
  } else if (kind === "salaries") {
    const mo = (sp.month && parseMonthKey(sp.month)) || monthOf(todayIso(), cal);
    header([{ h: t("teacher"), w: 24 }, { h: t("salaryMethod") }, { h: t("rate"), money: true }, { h: t("completedClasses") }, { h: `${t("teachingHours")} (h)` }, { h: money(t("calculatedSalary")), money: true, w: 22 }, { h: money(t("paidSoFar")), money: true }, { h: money(t("remaining")), money: true }, { h: t("statement") }]);
    for (const r of salaryTable(ledger, cal, mo)) {
      ws.addRow([r.name, t(r.method), r.method === "percentage" ? `${r.rate / 100}%` : r.rate, r.sessions, Number((r.minutes / 60).toFixed(2)), r.salary, r.paid, r.remaining, r.statement ? "✓" : t("noStatement")]);
    }
  } else if (kind === "salary-history") {
    const teacher = sp.teacher;
    header([{ h: t("statementPeriod") }, { h: t("salaryMethod") }, { h: t("completedClasses") }, { h: money(t("calculatedSalary")), money: true, w: 22 }, { h: money(t("paidSoFar")), money: true }, { h: money(t("remaining")), money: true }]);
    for (const s of ledger.statements.filter((x) => x.teacher_id === teacher)) {
      const paid = paidAgainst(ledger, s.id);
      const mo = parseMonthKey(s.period_key);
      ws.addRow([mo ? monthLabel(cal, mo, l) : s.period_key, t(s.method), s.sessions, s.gross_amount, paid, s.gross_amount - paid]);
    }
  } else if (kind === "payments") {
    header([{ h: t("student"), w: 24 }, { h: t("course"), w: 24 }, { h: t("teacher"), w: 20 }, { h: money(t("totalFee")), money: true, w: 20 }, { h: money(t("netReceived")), money: true, w: 20 }, { h: money(t("balance")), money: true }, { h: t("paymentDate") }, { h: t("method") }, { h: t("status") }]);
    for (const b of enrollmentBalances(ledger)) {
      ws.addRow([b.studentName, b.courseTitle, b.teacherName, b.fee, b.net, b.status === "refunded" ? 0 : b.remaining, formatDate(b.lastPaidAt, l), b.lastMethod ? mLabel(b.lastMethod) : "", t(`st_${b.status}` as "st_paid")]);
    }
  } else if (kind === "books") {
    const { range } = rangeFromParams(sp, todayIso(), cal);
    header([{ h: t("bookTitle"), w: 30 }, { h: money(t("purchasePrice")), money: true, w: 20 }, { h: money(t("sellingPrice")), money: true, w: 20 }, { h: t("qtyPurchased") }, { h: t("qtySold") }, { h: t("stock") }, { h: money(t("profitPerBook")), money: true, w: 20 }, { h: money(t("totalProfit")), money: true, w: 20 }]);
    for (const b of bookTable(ledger)) ws.addRow([b.title, b.avgCost, b.sellingPrice, b.purchased, b.sold, b.stock, b.profitPerBook, b.totalProfit]);
    const ws2 = wb.addWorksheet(t("salesReport"), { views: [{ rightToLeft: l === "fa" }] });
    ws2.addRow([t("date"), t("bookTitle"), t("quantity"), money(t("unitPrice")), money(t("revenue")), money(t("profit")), t("status")]).font = { bold: true };
    for (const s of ledger.sales.filter((x) => x.sold_at >= range.from && x.sold_at <= range.to)) {
      ws2.addRow([formatDate(s.sold_at, l), s.title, s.quantity, s.unit_price, s.revenue, s.revenue - s.cogs, s.voided_at ? t("voided") : "✓"]);
    }
    ws2.columns.forEach((c, i) => { c.width = i === 1 ? 30 : 18; if (i >= 3 && i <= 5) c.style = { numFmt: "#,##0" }; });
  } else if (kind === "expenses") {
    const { range } = rangeFromParams(sp, todayIso(), cal);
    header([{ h: t("date") }, { h: t("category"), w: 22 }, { h: t("description"), w: 34 }, { h: money(t("amount")), money: true, w: 20 }, { h: t("method") }, { h: t("status"), w: 14 }]);
    for (const e of ledger.expenses.filter((x) => x.expense_date >= range.from && x.expense_date <= range.to)) {
      ws.addRow([formatDate(e.expense_date, l), t(`c_${e.category}` as "c_rent"), e.description ?? "", e.amount, mLabel(e.method), e.voided_at ? t("voided") : "✓"]);
    }
  } else if (kind === "report") {
    const mo = (sp.month && parseMonthKey(sp.month)) || monthOf(todayIso(), cal);
    const r = buildReport(ledger, cal, monthRange(cal, mo));
    header([{ h: `${t("monthlyReport")} — ${monthLabel(cal, mo, l)}`, w: 44 }, { h: money(t("amount")), money: true, w: 22 }]);
    const line = (label: string, v: number, bold = false) => { const row = ws.addRow([label, v]); if (bold) row.font = { bold: true }; };
    const section = (label: string) => { const row = ws.addRow([label]); row.font = { bold: true }; row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3EFE6" } }; };
    section(t("incomeSection"));
    line(t("coursePaymentsReceived"), r.income.coursePaymentsGross);
    line(t("refundsDeducted"), -r.income.refunds);
    line(t("bookSales"), r.income.bookSales);
    line(t("otherIncome"), r.income.otherIncome);
    line(t("totalIncome"), r.income.total, true);
    section(t("expenseSection"));
    line(t("teacherSalaries"), r.expenses.teacherSalaries);
    line(t("staffSalaries"), r.expenses.staffSalaries);
    line(t("rent"), r.expenses.rent);
    line(t("utilities"), r.expenses.utilities + r.expenses.internet);
    line(t("marketing"), r.expenses.marketing);
    line(t("booksCost"), r.expenses.booksCogs);
    line(`${t("c_office_supplies")} · ${t("c_maintenance")}`, r.expenses.officeSupplies + r.expenses.maintenance);
    line(t("otherExpenses"), r.expenses.other);
    line(t("totalExpenses"), r.expenses.total, true);
    section("");
    line(t("grossProfit"), r.grossProfit, true);
    line(t("netProfit"), r.netProfit, true);
    section(t("cashFlow"));
    line(t("cashIn"), r.cash.inflow);
    line(t("salariesPaid"), -r.cash.salaryPaid);
    line(t("expensesPaid"), -r.cash.expensesPaid);
    line(t("booksPurchased"), -r.cash.bookPurchases);
    line(t("netCash"), r.cash.net, true);
    section("");
    line(t("pendingStudent"), r.outstandingStudentPayments);
    line(t("unpaidInPeriod"), r.unpaidSalaries);
  } else {
    return new Response("Unknown export", { status: 400 });
  }

  const buf = await wb.xlsx.writeBuffer();
  const name = `neshat-${kind}-${todayIso()}.xlsx`;
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

function sheetName(kind: string, t: T): string {
  const map: Record<string, string> = {
    transactions: t("transactions"), salaries: t("salaries"), "salary-history": t("salaryHistory"), payments: t("payments"),
    books: t("books"), expenses: t("expenses"), report: t("reports"),
  };
  return (map[kind] ?? "Sheet1").replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
}
