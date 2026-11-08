import Link from "next/link";
import { finCtx } from "@/lib/finance/page";
import { href } from "@/lib/utils";
import { formatToman, formatDate, formatNumber } from "@/lib/finance/money";
import { todayIso } from "@/lib/finance/periods";
import { enrollmentBalances, outstandingStudentPayments, activePayments, type PaymentStatus } from "@/lib/finance/calc";
import { PAY_METHODS } from "@/lib/finance/types";
import { recordStudentPayment, confirmStudentPayment, voidStudentPayment, setStudentFee } from "@/lib/actions/admin/finance";
import { FinHeader, Kpi, Pill, tbl, Expand, VoidControl, ExportButton, SectionTitle } from "@/components/finance/ui";
import { FinForm, MoneyInput, PrintButton } from "@/components/finance/FinForm";
import { Field, TextInput, Select } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";

const TONE: Record<PaymentStatus, "good" | "warn" | "bad" | "neutral"> = { paid: "good", partial: "warn", pending: "bad", refunded: "neutral" };

export default async function StudentPaymentsPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await finCtx(params, (t) => t("payments"));
  if (!ctx.ok) return ctx.stop;
  const { l, t, ledger } = ctx;
  const sp = await searchParams;
  const m = (n: number) => formatToman(n, l);
  const today = todayIso();
  const q = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = sp.status ?? "all";

  const all = enrollmentBalances(ledger);
  const rows = all
    .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
    .filter((r) => !q || `${r.studentName} ${r.courseTitle} ${r.teacherName}`.toLowerCase().includes(q))
    .sort((a, b) => b.remaining - a.remaining);

  const received = activePayments(ledger).reduce((a, p) => a + (p.kind === "payment" ? p.amount : -p.amount), 0);
  const refunded = activePayments(ledger).filter((p) => p.kind === "refund").reduce((a, p) => a + p.amount, 0);
  const fees = all.reduce((a, r) => a + r.fee, 0);
  const records = [...ledger.payments].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 100);
  const filterHref = (s: string) => `${href(l, "/dashboard/admin/finance/payments")}?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <FinHeader
        title={t("payments")}
        actions={<><ExportButton locale={l} t={t} kind="payments" params={{}} /><PrintButton label={t("print")} /></>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label={t("totalFee")} value={m(fees)} />
        <Kpi label={t("netReceived")} value={m(received)} tone="good" featured />
        <Kpi label={t("pendingStudent")} value={m(outstandingStudentPayments(ledger))} tone="accent" hint={t("pendingHint")} />
        <Kpi label={t("kindRefund")} value={m(refunded)} />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "partial", "paid", "refunded"] as const).map((s) => (
            <Link key={s} href={filterHref(s)} className={`rounded-full border px-4 py-2 text-sm ${statusFilter === s ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-soft hover:border-ink"}`}>
              {s === "all" ? t("all") : t(`st_${s}` as "st_paid")}
            </Link>
          ))}
        </div>
        <form method="get" className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="status" value={statusFilter} />
          <input name="q" defaultValue={sp.q ?? ""} placeholder={t("searchStudent")} className="min-w-0 flex-1 rounded-full border border-line-strong bg-canvas px-4 py-2 text-sm outline-none focus:border-accent" />
          <button className="rounded-full border border-line-strong px-4 py-2 text-sm hover:border-ink">{t("search")}</button>
        </form>
      </div>

      <div className={tbl.wrap}>
        <table className={`${tbl.table} min-w-[62rem]`}>
          <thead className={tbl.head}>
            <tr>{(["student", "course", "teacher", "totalFee", "netReceived", "balance", "paymentDate", "method", "status", "actions"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`${tbl.row} align-top`}>
                <td className={`${tbl.td} font-bold text-ink`}>{r.studentName}</td>
                <td className={tbl.td}>{r.courseTitle}</td>
                <td className={tbl.td}>{r.teacherName}</td>
                <td className={tbl.num}>{m(r.fee)}</td>
                <td className={tbl.num}><div>{m(r.net)}{r.pendingAmount > 0 && <div className="text-xs text-muted">+ {m(r.pendingAmount)} {t("pendingTag")}</div>}</div></td>
                <td className={`${tbl.num} font-semibold ${r.remaining > 0 && r.status !== "refunded" ? "text-accent-deep" : ""}`}>{m(r.status === "refunded" ? 0 : r.remaining)}</td>
                <td className={tbl.td}>{formatDate(r.lastPaidAt, l)}</td>
                <td className={tbl.td}>{r.lastMethod ? t(`m_${r.lastMethod}` as "m_cash") : "—"}</td>
                <td className={tbl.td}><Pill tone={TONE[r.status]}>{t(`st_${r.status}` as "st_paid")}</Pill></td>
                <td className={`${tbl.td} min-w-44 print:hidden`}>
                  <div className="flex flex-col gap-3">
                    <Expand summary={t("recordPayment")} wide>
                      <FinForm action={recordStudentPayment.bind(null, l)} submit={t("save")}>
                        <input type="hidden" name="enrollment_id" value={r.id} />
                        <Field label={t("paymentKind")}>
                          <Select name="kind" defaultValue="payment">
                            <option value="payment">{t("kindPayment")}</option>
                            <option value="refund">{t("kindRefund")}</option>
                          </Select>
                        </Field>
                        <Field label={`${t("amount")} (${t("balance")}: ${m(r.remaining)} · ${t("netReceived")}: ${m(r.net)})`}>
                          <MoneyInput name="amount" locale={l} defaultValue={r.remaining || undefined} />
                        </Field>
                        <Field label={t("status")}>
                          <Select name="status" defaultValue="completed">
                            <option value="completed">{t("paymentCompleted")}</option>
                            <option value="pending">{t("paymentPending")}</option>
                          </Select>
                        </Field>
                        <Field label={t("paymentDate")}><DatePicker name="paid_at" locale={l} defaultValue={today} /></Field>
                        <Field label={t("method")}>
                          <Select name="method" defaultValue="card">
                            {PAY_METHODS.map((x) => <option key={x} value={x}>{t(`m_${x}` as "m_cash")}</option>)}
                          </Select>
                        </Field>
                        <Field label={t("reference")}><TextInput name="reference" dir="ltr" className="text-start" /></Field>
                        <Field label={t("note")}><TextInput name="note" /></Field>
                      </FinForm>
                    </Expand>
                    <Expand summary={t("setFee")} wide>
                      <FinForm action={setStudentFee.bind(null, l)} submit={t("save")} resetOnOk={false}>
                        <input type="hidden" name="enrollment_id" value={r.id} />
                        <Field label={t("totalFee")}><MoneyInput name="fee" locale={l} defaultValue={r.fee} /></Field>
                      </FinForm>
                    </Expand>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted">{t("none")}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <SectionTitle>{t("paymentLedger")}</SectionTitle>
        <div className={tbl.wrap}>
          <table className={`${tbl.table} min-w-[56rem]`}>
            <thead className={tbl.head}>
              <tr>{(["date", "student", "course", "paymentKind", "amount", "method", "reference", "status"] as const).map((k) => <th key={k} className={tbl.th}>{t(k)}</th>)}<th className={`${tbl.th} print:hidden`} /></tr>
            </thead>
            <tbody>
              {records.map((p) => (
                <tr key={p.id} className={`${tbl.row} ${p.voided_at ? "text-muted line-through" : ""}`}>
                  <td className={tbl.td}>{formatDate(p.paid_at, l)}</td>
                  <td className={tbl.td}>{p.student_name ?? "—"}</td>
                  <td className={tbl.td}>{p.class_title ?? "—"}</td>
                  <td className={tbl.td}>{p.kind === "refund" ? <Pill tone="bad">{t("kindRefund")}</Pill> : <Pill>{t("kindPayment")}</Pill>}</td>
                  <td className={`${tbl.num} font-semibold ${p.kind === "refund" ? "text-red-600" : ""}`}>{p.kind === "refund" ? "−" : ""}{formatNumber(p.amount, l)}</td>
                  <td className={tbl.td}>{t(`m_${p.method}` as "m_cash")}</td>
                  <td className={tbl.td} dir="ltr">{p.reference ?? "—"}</td>
                  <td className={tbl.td}>
                    {p.voided_at ? <Pill tone="bad">{t("voided")} · {p.void_reason}</Pill> : p.status === "pending" ? <Pill tone="warn">{t("pendingTag")}</Pill> : <Pill tone="good">✓</Pill>}
                  </td>
                  <td className={`${tbl.td} print:hidden`}>
                    <div className="flex items-center gap-4">
                      {!p.voided_at && p.status === "pending" && (
                        <FinForm action={confirmStudentPayment.bind(null, l)} submit={t("confirm")} resetOnOk={false} className="!gap-1">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="paid_at" value={today} />
                        </FinForm>
                      )}
                      {!p.voided_at && <VoidControl action={voidStudentPayment.bind(null, l)} id={p.id} t={t} />}
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted">{t("none")}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{l === "fa" ? "مبالغ به تومان" : "Amounts in Toman"}</p>
      </div>
    </div>
  );
}
