import Link from "next/link";
import { finCtx } from "@/lib/finance/page";
import { href } from "@/lib/utils";
import { formatToman, formatNumber, formatHours, formatBp } from "@/lib/finance/money";
import { todayIso, monthOf, monthKey, parseMonthKey, addMonths, monthLabel, type Month } from "@/lib/finance/periods";
import { salaryTable } from "@/lib/finance/calc";
import { SALARY_METHODS, PAY_METHODS } from "@/lib/finance/types";
import {
  generateStatement, generateAllStatements, recordSalaryPayment, saveTeacherRate,
} from "@/lib/actions/admin/finance";
import { FinHeader, Kpi, Pill, tbl, Expand, ExportButton, Notice } from "@/components/finance/ui";
import { FinForm, MoneyInput, PrintButton } from "@/components/finance/FinForm";
import { Field, TextInput, Select } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";

export default async function SalariesPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await finCtx(params, (t) => t("salaries"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const sp = await searchParams;
  const cal = ledger.settings.calendar;
  const today = todayIso();
  const mo: Month = (sp.month && parseMonthKey(sp.month)) || monthOf(today, cal);
  const key = monthKey(mo);
  const rows = salaryTable(ledger, cal, mo);
  const m = (n: number) => formatToman(n, l);
  const nf = (n: number) => formatNumber(n, l);

  const rateText = (method: string, rate: number) =>
    method === "percentage" ? formatBp(rate, l) : `${m(rate)}${method === "hourly" ? (l === "fa" ? " / ساعت" : " / h") : l === "fa" ? " / جلسه" : " / class"}`;
  const methodLabel = (x: string) => t(x as "hourly" | "per_class" | "percentage");

  const total = rows.reduce((a, r) => a + r.salary, 0);
  const paid = rows.reduce((a, r) => a + r.paid, 0);
  const prev = monthKey(addMonths(mo, -1));
  const next = monthKey(addMonths(mo, 1));
  const here = `${href(l, "/dashboard/admin/finance/salaries")}`;
  const recent = Array.from({ length: 12 }, (_, i) => addMonths(monthOf(today, cal), -i));
  const pending = rows.filter((r) => !r.statement && r.calculated > 0).length;

  return (
    <div>
      <FinHeader
        title={t("salaries")}
        subtitle={t("salaryNote")}
        actions={
          <>
            <ExportButton locale={l} t={t} kind="salaries" params={{ month: key }} />
            <PrintButton label={t("print")} />
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <Link href={`${here}?month=${prev}`} className="rounded-full border border-line-strong px-3 py-2 text-sm hover:border-ink">‹</Link>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas">{monthLabel(cal, mo, l)}</span>
        <Link href={`${here}?month=${next}`} className="rounded-full border border-line-strong px-3 py-2 text-sm hover:border-ink">›</Link>
        <span className="mx-2 h-5 w-px bg-line-strong" />
        {recent.slice(0, 6).map((x) => (
          <Link key={monthKey(x)} href={`${here}?month=${monthKey(x)}`} className={`rounded-full px-3 py-1.5 text-xs ${monthKey(x) === key ? "bg-accent text-slate" : "bg-sand text-ink-soft hover:bg-sand-deep"}`}>
            {monthLabel(cal, x, l)}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Kpi label={t("calculatedSalary")} value={m(total)} featured />
        <Kpi label={t("paidSoFar")} value={m(paid)} tone="good" />
        <Kpi label={t("remaining")} value={m(total - paid)} tone="accent" />
      </div>

      {pending > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-wash p-4 text-sm print:hidden">
          <span>{l === "fa" ? `${nf(pending)} مدرس هنوز فیش حقوقی این ماه را ندارند.` : `${nf(pending)} teacher(s) have no statement for this month yet.`}</span>
          <FinForm action={generateAllStatements.bind(null, l)} submit={t("generateAll")} resetOnOk={false}>
            <input type="hidden" name="period_key" value={key} />
          </FinForm>
        </div>
      )}

      <div className={tbl.wrap}>
        <table className={`${tbl.table} min-w-[64rem]`}>
          <thead className={tbl.head}>
            <tr>
              {["teacher", "salaryMethod", "rate", "completedClasses", "teachingHours", "calculatedSalary", "paidSoFar", "remaining", "actions"].map((k) => (
                <th key={k} className={tbl.th}>{t(k as "teacher")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teacherId} className={`${tbl.row} align-top`}>
                <td className={tbl.td}>
                  <div>
                    <Link href={`${here}/${r.teacherId}`} className="font-bold text-ink hover:text-accent-deep">{r.name}</Link>
                    <div className="mt-1 flex flex-wrap gap-1 max-md:justify-end">
                      {r.statement ? <Pill tone="good">{t("statement")}</Pill> : r.calculated > 0 ? <Pill tone="warn">{t("estimate")} · {t("noStatement")}</Pill> : null}
                      {r.stale && <Pill tone="warn">{t("stale")}</Pill>}
                    </div>
                  </div>
                </td>
                <td className={tbl.td}><div><Pill>{methodLabel(r.method)}</Pill>{!r.customRate && <div className="mt-1 text-xs text-muted">{t("defaultRate")}</div>}</div></td>
                <td className={tbl.num}>{rateText(r.method, r.rate)}</td>
                <td className={tbl.num}>{nf(r.sessions)}</td>
                <td className={tbl.num}>{formatHours(r.minutes, l)}</td>
                <td className={`${tbl.num} font-bold`}>
                  <div>
                    {m(r.salary)}
                    {r.method === "percentage" && <div className="text-xs font-normal text-muted">{m(r.revenue)}</div>}
                  </div>
                </td>
                <td className={tbl.num}>{m(r.paid)}</td>
                <td className={`${tbl.num} font-semibold ${r.remaining > 0 ? "text-accent-deep" : "text-emerald-700"}`}>{m(r.remaining)}</td>
                <td className={`${tbl.td} min-w-48 print:hidden`}>
                  <div className="flex flex-col gap-3">
                    {!r.statement && r.calculated > 0 && (
                      <FinForm action={generateStatement.bind(null, l)} submit={t("generateStatement")} resetOnOk={false}>
                        <input type="hidden" name="teacher_id" value={r.teacherId} />
                        <input type="hidden" name="period_key" value={key} />
                      </FinForm>
                    )}
                    {r.statement && r.paid === 0 && r.stale && (
                      <FinForm action={generateStatement.bind(null, l)} submit={t("regenerate")} resetOnOk={false} tone="dark">
                        <input type="hidden" name="teacher_id" value={r.teacherId} />
                        <input type="hidden" name="period_key" value={key} />
                        <input type="hidden" name="replace" value="1" />
                      </FinForm>
                    )}
                    {r.statement && r.remaining > 0 && (
                      <Expand summary={t("recordSalaryPayment")} wide>
                        <FinForm action={recordSalaryPayment.bind(null, l)} submit={t("save")}>
                          <input type="hidden" name="statement_id" value={r.statement.id} />
                          <Field label={`${t("amount")} (≤ ${m(r.remaining)})`}><MoneyInput name="amount" locale={l} defaultValue={r.remaining} /></Field>
                          <Field label={t("paymentDate")}><DatePicker name="paid_at" locale={l} defaultValue={today} /></Field>
                          <Field label={t("method")}>
                            <Select name="method" defaultValue="bank_transfer">
                              {PAY_METHODS.map((x) => <option key={x} value={x}>{t(`m_${x}` as "m_cash")}</option>)}
                            </Select>
                          </Field>
                          <Field label={t("reference")}><TextInput name="reference" dir="ltr" className="text-start" /></Field>
                        </FinForm>
                      </Expand>
                    )}
                    <Expand summary={t("editRate")} wide>
                      <FinForm action={saveTeacherRate.bind(null, l)} submit={t("save")} resetOnOk={false}>
                        <input type="hidden" name="teacher_id" value={r.teacherId} />
                        <Field label={t("salaryMethod")}>
                          <Select name="method" defaultValue={r.method}>
                            {SALARY_METHODS.map((x) => <option key={x} value={x}>{methodLabel(x)}</option>)}
                          </Select>
                        </Field>
                        <Field label={t("rate")} note={`${t("ratePerHour")} · ${t("ratePerClass")} · ${t("ratePercent")}`}>
                          <TextInput name="rate" required dir="ltr" className="text-start" inputMode="decimal"
                            defaultValue={r.method === "percentage" ? String(r.rate / 100) : String(r.rate)} />
                        </Field>
                      </FinForm>
                    </Expand>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted">{t("none")}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4"><Notice>{t("salaryNote")}</Notice></div>
    </div>
  );
}
