import Link from "next/link";
import { notFound } from "next/navigation";
import { finCtx } from "@/lib/finance/page";
import { href } from "@/lib/utils";
import { formatToman, formatNumber, formatHours, formatDate, formatBp } from "@/lib/finance/money";
import { monthLabel, parseMonthKey } from "@/lib/finance/periods";
import { paidAgainst, effectiveRate } from "@/lib/finance/calc";
import { voidSalaryPayment } from "@/lib/actions/admin/finance";
import { FinHeader, Kpi, Pill, tbl, VoidControl, ExportButton, SectionTitle } from "@/components/finance/ui";
import { PrintButton } from "@/components/finance/FinForm";

export default async function TeacherSalaryHistory({ params }: { params: Promise<{ locale: string; teacherId: string }> }) {
  const { teacherId } = await params;
  const ctx = await finCtx(params, (t) => t("salaryHistory"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const teacher = ledger.teachers.find((x) => x.id === teacherId);
  if (!teacher) notFound();
  const cal = ledger.settings.calendar;
  const m = (n: number) => formatToman(n, l);
  const nf = (n: number) => formatNumber(n, l);
  const stmts = ledger.statements.filter((s) => s.teacher_id === teacherId).sort((a, b) => (a.period_key < b.period_key ? 1 : -1));
  const er = effectiveRate(ledger, teacherId);
  const owed = stmts.reduce((a, s) => a + s.gross_amount, 0);
  const paid = stmts.reduce((a, s) => a + paidAgainst(ledger, s.id), 0);
  const rateText = er.method === "percentage" ? formatBp(er.rate, l) : m(er.rate);

  return (
    <div>
      <FinHeader
        title={`${t("salaryHistory")} — ${teacher.name}`}
        subtitle={`${t("salaryMethod")}: ${t(er.method)} · ${t("rate")}: ${rateText}`}
        actions={
          <>
            <Link href={href(l, "/dashboard/admin/finance/salaries")} className="text-sm text-ink-soft hover:text-ink">← {t("backToSalaries")}</Link>
            <ExportButton locale={l} t={t} kind="salary-history" params={{ teacher: teacherId }} />
            <PrintButton label={t("print")} />
          </>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Kpi label={t("calculatedSalary")} value={m(owed)} featured />
        <Kpi label={t("paidSoFar")} value={m(paid)} tone="good" />
        <Kpi label={t("remaining")} value={m(owed - paid)} tone="accent" />
      </div>

      {stmts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-muted">{t("none")}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {stmts.map((s) => {
            const pays = ledger.salaryPayments.filter((p) => p.statement_id === s.id).sort((a, b) => (a.paid_at < b.paid_at ? 1 : -1));
            const sPaid = paidAgainst(ledger, s.id);
            const mo = parseMonthKey(s.period_key);
            return (
              <section key={s.id} className="rounded-2xl border border-line bg-paper p-5 shadow-sm break-inside-avoid">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-ink">{mo ? monthLabel(cal, mo, l) : s.period_key}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {t(s.method)} · {s.method === "percentage" ? formatBp(s.rate, l) : m(s.rate)} · {nf(s.sessions)} {t("completedClasses")} · {formatHours(s.minutes, l)}
                      {s.method === "percentage" && ` · ${m(s.revenue_base)}`}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-extrabold text-ink">{m(s.gross_amount)}</p>
                    <Pill tone={s.gross_amount - sPaid === 0 ? "good" : "warn"}>{t("remaining")}: {m(s.gross_amount - sPaid)}</Pill>
                  </div>
                </div>
                {pays.length > 0 && (
                  <div className={`${tbl.wrap} mt-4 shadow-none`}>
                    <table className={tbl.table}>
                      <thead className={tbl.head}><tr>{(["date", "amount", "method", "reference", "status"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}<th className={`${tbl.th} print:hidden`} /></tr></thead>
                      <tbody>
                        {pays.map((p) => (
                          <tr key={p.id} className={`${tbl.row} ${p.voided_at ? "text-muted line-through" : ""}`}>
                            <td className={tbl.td}>{formatDate(p.paid_at, l)}</td>
                            <td className={tbl.num}>{m(p.amount)}</td>
                            <td className={tbl.td}>{t(`m_${p.method}` as "m_cash")}</td>
                            <td className={tbl.td} dir="ltr">{p.reference ?? "—"}</td>
                            <td className={tbl.td}>{p.voided_at ? <Pill tone="bad">{t("voided")} · {p.void_reason}</Pill> : <Pill tone="good">✓</Pill>}</td>
                            <td className={`${tbl.td} print:hidden`}>{!p.voided_at && <VoidControl action={voidSalaryPayment.bind(null, l)} id={p.id} t={t} />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
      <div className="mt-8"><SectionTitle>{t("salaryNote")}</SectionTitle></div>
    </div>
  );
}
