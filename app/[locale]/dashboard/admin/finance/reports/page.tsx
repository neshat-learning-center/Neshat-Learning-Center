import Link from "next/link";
import { finCtx } from "@/lib/finance/page";
import { href } from "@/lib/utils";
import { formatToman, formatDate } from "@/lib/finance/money";
import { todayIso, monthOf, monthKey, parseMonthKey, monthRange, monthLabel, monthsBetween, addMonths, type Month } from "@/lib/finance/periods";
import { buildReport } from "@/lib/finance/calc";
import { FinHeader, Kpi, Card, SectionTitle, tbl, ExportButton, Notice } from "@/components/finance/ui";
import { PrintButton } from "@/components/finance/FinForm";

function Line({ label, value, strong, indent, tone }: { label: string; value: string; strong?: boolean; indent?: boolean; tone?: "bad" | "good" }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-line/70 py-2.5 text-sm last:border-0 ${indent ? "ps-5 text-ink-soft" : ""} ${strong ? "font-extrabold text-ink" : ""}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${tone === "bad" ? "text-red-600" : tone === "good" ? "text-emerald-700" : ""}`}>{value}</span>
    </div>
  );
}

export default async function ReportsPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await finCtx(params, (t) => t("reports"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const sp = await searchParams;
  const cal = ledger.settings.calendar;
  const today = todayIso();
  const nowMo = monthOf(today, cal);
  const mo: Month = (sp.month && parseMonthKey(sp.month)) || nowMo;
  const range = monthRange(cal, mo);
  const r = buildReport(ledger, cal, range);
  const m = (n: number) => formatToman(n, l);

  // history = from the first month that has any record up to now (never deleted, always reproducible)
  const dates = [
    ...ledger.payments.map((p) => p.paid_at), ...ledger.sales.map((s) => s.sold_at), ...ledger.expenses.map((e) => e.expense_date),
    ...ledger.otherIncome.map((i) => i.income_date), ...ledger.salaryPayments.map((p) => p.paid_at), ...ledger.statements.map((s) => s.period_start),
    ...ledger.purchases.map((p) => p.purchased_at),
  ].sort();
  const first = dates.length ? monthOf(dates[0], cal) : nowMo;
  const startHist = first.y * 12 + first.m < addMonths(nowMo, -35).y * 12 + addMonths(nowMo, -35).m ? addMonths(nowMo, -35) : first;
  const history = monthsBetween(startHist, nowMo).reverse().map((x) => ({ mo: x, r: buildReport(ledger, cal, monthRange(cal, x)) }));
  const here = href(l, "/dashboard/admin/finance/reports");

  return (
    <div>
      <FinHeader
        title={`${t("monthlyReport")} — ${monthLabel(cal, mo, l)}`}
        subtitle={`${formatDate(range.from, l)} – ${formatDate(range.to, l)} · ${l === "fa" ? "همه‌ی مبالغ به تومان" : "All amounts in Toman"}`}
        actions={<><ExportButton locale={l} t={t} kind="report" params={{ month: monthKey(mo) }} /><PrintButton label={t("print")} /></>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <Link href={`${here}?month=${monthKey(addMonths(mo, -1))}`} className="rounded-full border border-line-strong px-3 py-2 text-sm hover:border-ink">‹</Link>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas">{monthLabel(cal, mo, l)}</span>
        <Link href={`${here}?month=${monthKey(addMonths(mo, 1))}`} className="rounded-full border border-line-strong px-3 py-2 text-sm hover:border-ink">›</Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label={t("totalIncome")} value={m(r.income.total)} tone="good" />
        <Kpi label={t("totalExpenses")} value={m(r.expenses.total)} />
        <Kpi label={t("grossProfit")} value={m(r.grossProfit)} tone={r.grossProfit < 0 ? "bad" : "good"} hint={t("grossProfitHint")} />
        <Kpi label={t("netProfit")} value={m(r.netProfit)} tone={r.netProfit < 0 ? "bad" : "good"} featured />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionTitle>{t("incomeSection")}</SectionTitle>
          <Line label={t("coursePaymentsReceived")} value={m(r.income.coursePaymentsGross)} indent />
          <Line label={t("refundsDeducted")} value={`− ${m(r.income.refunds)}`} indent tone={r.income.refunds ? "bad" : undefined} />
          <Line label={t("netCoursePayments")} value={m(r.income.coursePayments)} />
          <Line label={t("bookSales")} value={m(r.income.bookSales)} />
          <Line label={t("otherIncome")} value={m(r.income.otherIncome)} />
          <Line label={t("totalIncome")} value={m(r.income.total)} strong tone="good" />
        </Card>
        <Card>
          <SectionTitle>{t("expenseSection")}</SectionTitle>
          <Line label={t("teacherSalaries")} value={m(r.expenses.teacherSalaries)} />
          <Line label={t("staffSalaries")} value={m(r.expenses.staffSalaries)} />
          <Line label={t("rent")} value={m(r.expenses.rent)} />
          <Line label={t("utilities")} value={m(r.expenses.utilities + r.expenses.internet)} />
          <Line label={t("marketing")} value={m(r.expenses.marketing)} />
          <Line label={t("booksCost")} value={m(r.expenses.booksCogs)} />
          <Line label={`${t("c_office_supplies")} · ${t("c_maintenance")}`} value={m(r.expenses.officeSupplies + r.expenses.maintenance)} />
          <Line label={t("otherExpenses")} value={m(r.expenses.other)} />
          <Line label={t("totalExpenses")} value={m(r.expenses.total)} strong />
        </Card>
        <Card>
          <SectionTitle>{t("cashFlow")}</SectionTitle>
          <Line label={t("cashIn")} value={m(r.cash.inflow)} tone="good" />
          <Line label={t("salariesPaid")} value={`− ${m(r.cash.salaryPaid)}`} indent />
          <Line label={t("expensesPaid")} value={`− ${m(r.cash.expensesPaid)}`} indent />
          <Line label={t("booksPurchased")} value={`− ${m(r.cash.bookPurchases)}`} indent />
          <Line label={t("cashOut")} value={m(r.cash.outflow)} />
          <Line label={t("netCash")} value={m(r.cash.net)} strong tone={r.cash.net < 0 ? "bad" : "good"} />
          <p className="mt-3 text-xs text-muted">{t("cashVsProfit")}</p>
        </Card>
        <Card>
          <SectionTitle>{t("pendingStudent")}</SectionTitle>
          <Line label={t("pendingStudent")} value={m(r.outstandingStudentPayments)} />
          <Line label={t("unpaidInPeriod")} value={m(r.unpaidSalaries)} />
          <p className="mt-3 text-xs text-muted">{t("pendingHint")}</p>
        </Card>
      </div>

      <div className="mt-10 print:hidden">
        <SectionTitle>{t("historicalMonths")}</SectionTitle>
        <div className={tbl.wrap}>
          <table className={`${tbl.table} min-w-[44rem]`}>
            <thead className={tbl.head}><tr>{[t("month"), t("totalIncome"), t("totalExpenses"), t("netProfit"), t("netCash"), ""].map((h, i) => <th key={i} className={tbl.th}>{h}</th>)}</tr></thead>
            <tbody>
              {history.map(({ mo: x, r: hr }) => (
                <tr key={monthKey(x)} className={`${tbl.row} ${monthKey(x) === monthKey(mo) ? "bg-accent-wash/50" : ""}`}>
                  <td className={`${tbl.td} font-medium`}>{monthLabel(cal, x, l)}</td>
                  <td className={tbl.num}>{m(hr.income.total)}</td>
                  <td className={tbl.num}>{m(hr.expenses.total)}</td>
                  <td className={`${tbl.num} font-semibold ${hr.netProfit < 0 ? "text-red-600" : "text-emerald-700"}`}>{m(hr.netProfit)}</td>
                  <td className={tbl.num}>{m(hr.cash.net)}</td>
                  <td className={tbl.td}><Link href={`${here}?month=${monthKey(x)}`} className="text-accent-deep hover:underline">{t("open")}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4"><Notice>{t("auditHint")}</Notice></div>
      </div>
    </div>
  );
}
