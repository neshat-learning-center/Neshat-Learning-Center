import { finCtx } from "@/lib/finance/page";
import { formatToman } from "@/lib/finance/money";
import { rangeFromParams, todayIso, monthOf, addMonths, monthsBetween, monthLabel, type Month } from "@/lib/finance/periods";
import { buildReport, monthlySeries, courseRevenue, bookTable, outstandingStudentPayments, unpaidSalariesAllTime } from "@/lib/finance/calc";
import { FinHeader, Kpi, Card, SectionTitle, PeriodFilter } from "@/components/finance/ui";
import { PrintButton } from "@/components/finance/FinForm";
import { BarChart, HBarChart } from "@/components/finance/Charts";

export default async function FinanceOverview({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await finCtx(params, (t) => t("overview"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const sp = await searchParams;
  const cal = ledger.settings.calendar;
  const { preset, range } = rangeFromParams(sp, todayIso(), cal, ledger.settings.default_report_range);
  const m = (n: number) => formatToman(n, l);

  const r = buildReport(ledger, cal, range);

  // chart window: the selected range, padded back to at least 6 months, capped at 24
  const end = monthOf(range.to, cal);
  let start = monthOf(range.from, cal);
  const minStart = addMonths(end, -5);
  if (start.y * 12 + start.m > minStart.y * 12 + minStart.m) start = minStart;
  const cap = addMonths(end, -23);
  if (start.y * 12 + start.m < cap.y * 12 + cap.m) start = cap;
  const months: Month[] = monthsBetween(start, end);
  const series = monthlySeries(ledger, cal, months);
  const label = (mo: Month) => monthLabel(cal, mo, l).replace(/\s?\d{4}$|\s?[۰-۹]{4}$/, ""); // axis: month name only

  const books = bookTable(ledger, range).sort((a, b) => b.revenue - a.revenue);
  const courses = courseRevenue(ledger, range);
  const netTone = r.netProfit < 0 ? "bad" : "good";

  return (
    <div>
      <FinHeader
        title={t("overview")}
        subtitle={`${t("finance")} · ${l === "fa" ? "تومان" : "Toman"}`}
        actions={<PrintButton label={t("print")} />}
      />
      <PeriodFilter locale={l} t={t} preset={preset} range={range} path="/dashboard/admin/finance" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label={t("monthlyRevenue")} value={m(r.income.total)} tone="good" featured />
        <Kpi label={t("monthlyExpenses")} value={m(r.expenses.total)} />
        <Kpi label={t("teacherSalaries")} value={m(r.expenses.teacherSalaries)} />
        <Kpi label={t("bookSales")} value={m(r.income.bookSales)} />
        <Kpi label={t("netProfit")} value={m(r.netProfit)} tone={netTone} featured />
        <Kpi label={t("pendingStudent")} value={m(outstandingStudentPayments(ledger))} tone="accent" hint={t("pendingHint")} />
        <Kpi label={t("unpaidSalaries")} value={m(unpaidSalariesAllTime(ledger))} tone="accent" hint={t("unpaidSalariesHint")} />
        <Kpi label={t("netCash")} value={m(r.cash.net)} tone={r.cash.net < 0 ? "bad" : "default"} hint={t("cashFlow")} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionTitle>{t("incomeVsExpenses")}</SectionTitle>
          <BarChart
            empty={t("noData")}
            series={[{ name: t("income"), color: "#f4b223" }, { name: t("expense"), color: "#55535a" }]}
            data={series.map((s) => ({ label: label(s.mo), values: [s.income, s.expenses], tips: [m(s.income), m(s.expenses)] }))}
          />
        </Card>
        <Card>
          <SectionTitle>{t("monthlyNet")}</SectionTitle>
          <BarChart
            empty={t("noData")}
            series={[{ name: t("netProfit"), color: "#dd9c0c" }]}
            data={series.map((s) => ({ label: label(s.mo), values: [s.net], tips: [m(s.net)] }))}
          />
        </Card>
        <Card>
          <SectionTitle>{t("courseRevenueChart")}</SectionTitle>
          <HBarChart empty={t("noData")} color="#f4b223" rows={courses.map((c) => ({ label: c.title, value: c.revenue, tip: m(c.revenue) }))} />
        </Card>
        <Card>
          <SectionTitle>{t("bookPerformance")}</SectionTitle>
          <HBarChart
            empty={t("noData")}
            color="#55535a"
            rows={books.map((b) => ({ label: b.title, value: b.revenue, tip: `${m(b.revenue)} · ${t("profit")} ${m(b.totalProfit)}` }))}
          />
        </Card>
      </div>
    </div>
  );
}
