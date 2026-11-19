import type { Locale } from "@/lib/i18n/config";
import type { MyAccount, MySalaryStatement, MySalaryPayment } from "@/lib/data/myfinance";
import { lt, type LKey } from "@/lib/join/links-labels";
import { formatToman, formatDate, formatHours, formatBp } from "@/lib/finance/money";
import { monthLabel, parseMonthKey } from "@/lib/finance/periods";
import { SectionBlock, InfoCard, EmptyState } from "./profile-ui";

const th = "px-4 py-3 text-start text-xs font-medium text-muted";
const td = "px-4 py-3 text-sm text-ink-soft";
const methodKey = (m: string): LKey =>
  (["cash", "card", "bank_transfer", "online", "cheque"].includes(m) ? m : "other") as LKey;

/** period_key is '1405-07' (jalali) or '2026-10' (gregorian) */
function periodText(key: string, locale: Locale): string {
  const mo = parseMonthKey(key);
  if (!mo) return key;
  return monthLabel(mo.y < 1700 ? "jalali" : "gregorian", mo, locale);
}

/** Student: fee, paid and remaining per class, plus the payment history the institute recorded. */
export function StudentFinance({ locale, account, index }: { locale: Locale; account: MyAccount; index: number }) {
  const t = lt(locale);
  const empty = account.classes.length === 0 && account.payments.length === 0;
  return (
    <SectionBlock id="fees" index={index} title={t("feesTitle")}>
      <p className="-mt-3 mb-6 max-w-xl text-sm text-muted">{t("feesLead")}</p>
      {empty && <EmptyState label={t("noClasses")} />}
      <div className="grid gap-5 md:grid-cols-2">
        {account.classes.map((c) => {
          const net = c.paid - c.refunded;
          const pct = c.fee > 0 ? Math.max(0, Math.min(100, Math.round((net / c.fee) * 100))) : 0;
          const settled = c.remaining === 0 && c.fee > 0;
          return (
            <InfoCard key={c.enrollmentId}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">{c.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    settled ? "bg-accent-wash text-accent-deep" : "border border-line-strong text-ink-soft"
                  }`}
                >
                  {settled ? t("settled") : `${t("remaining")}: ${formatToman(c.remaining, locale)}`}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">{t("fee")}</dt>
                  <dd className="numeral text-ink">{formatToman(c.fee, locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("received")}</dt>
                  <dd className="numeral text-ink">{formatToman(net, locale)}</dd>
                </div>
                {c.pending > 0 && (
                  <div>
                    <dt className="text-xs text-muted">{t("pendingAmt")}</dt>
                    <dd className="numeral text-ink">{formatToman(c.pending, locale)}</dd>
                  </div>
                )}
                {c.refunded > 0 && (
                  <div>
                    <dt className="text-xs text-muted">{t("refundedAmt")}</dt>
                    <dd className="numeral text-ink">{formatToman(c.refunded, locale)}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand" aria-hidden>
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </InfoCard>
          );
        })}
      </div>

      {!empty && <h3 className="eyebrow mt-8">{t("paymentHistory")}</h3>}
      {empty ? null : account.payments.length === 0 ? (
        <div className="mt-3">
          <EmptyState label={t("noPayments")} />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas">
          <table className="w-full min-w-[34rem]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>{t("date")}</th>
                <th className={th}>{t("classCol")}</th>
                <th className={th}>{t("amount")}</th>
                <th className={th}>{t("methodCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {account.payments.map((p) => (
                <tr key={p.id}>
                  <td className={td}>{formatDate(p.paidAt, locale)}</td>
                  <td className={`${td} text-ink`}>{p.classTitle}</td>
                  <td className={`${td} numeral`}>
                    <span className={p.kind === "refund" ? "text-red-600" : "text-ink"}>
                      {p.kind === "refund" ? "−" : ""}
                      {formatToman(p.amount, locale)}
                    </span>
                    {p.kind === "refund" && <span className="ms-2 text-xs text-muted">{t("refund")}</span>}
                    {p.status === "pending" && (
                      <span className="ms-2 rounded-full bg-sand px-2 py-0.5 text-xs text-ink-soft">{t("pendingAmt")}</span>
                    )}
                  </td>
                  <td className={td}>{t(methodKey(p.method))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionBlock>
  );
}

/** Teacher: the salary statements the institute issued, and what has been paid against each. */
export function TeacherSalary({
  locale,
  statements,
  payments,
  index,
}: {
  locale: Locale;
  statements: MySalaryStatement[];
  payments: MySalaryPayment[];
  index: number;
}) {
  const t = lt(locale);
  const unit = (m: string) => (m === "hourly" ? (locale === "fa" ? "ساعت" : "hour") : locale === "fa" ? "جلسه" : "session");
  const rateText = (s: MySalaryStatement) =>
    s.method === "percentage" ? formatBp(s.rate, locale) : `${formatToman(s.rate, locale)} / ${unit(s.method)}`;
  const methodName = (m: string) => (m === "hourly" ? t("hourly") : m === "percentage" ? t("percentage") : t("perClass"));
  return (
    <SectionBlock id="salary" index={index} title={t("salaryTitle")}>
      <p className="-mt-3 mb-6 max-w-xl text-sm text-muted">{t("salaryLead")}</p>
      {statements.length === 0 ? (
        <EmptyState label={t("noSalary")} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {statements.map((s) => {
            const left = Math.max(0, s.gross - s.paid);
            return (
              <InfoCard key={s.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink">{periodText(s.periodKey, locale)}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      left === 0 ? "bg-accent-wash text-accent-deep" : "border border-line-strong text-ink-soft"
                    }`}
                  >
                    {left === 0 ? t("paidInFull") : `${t("remaining")}: ${formatToman(left, locale)}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {methodName(s.method)} · {rateText(s)}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">{t("gross")}</dt>
                    <dd className="numeral font-bold text-ink">{formatToman(s.gross, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t("paidSoFar")}</dt>
                    <dd className="numeral text-ink">{formatToman(s.paid, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t("sessionsCol")}</dt>
                    <dd className="numeral text-ink">{s.sessions}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t("hoursCol")}</dt>
                    <dd className="text-ink">{formatHours(s.minutes, locale)}</dd>
                  </div>
                </dl>
              </InfoCard>
            );
          })}
        </div>
      )}

      {payments.length > 0 && (
        <>
          <h3 className="eyebrow mt-8">{t("salaryPayments")}</h3>
          <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas">
            <table className="w-full min-w-[30rem]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t("date")}</th>
                  <th className={th}>{t("period")}</th>
                  <th className={th}>{t("amount")}</th>
                  <th className={th}>{t("methodCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{formatDate(p.paidAt, locale)}</td>
                    <td className={td}>{periodText(p.periodKey, locale)}</td>
                    <td className={`${td} numeral text-ink`}>{formatToman(p.amount, locale)}</td>
                    <td className={td}>{t(methodKey(p.method))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionBlock>
  );
}
