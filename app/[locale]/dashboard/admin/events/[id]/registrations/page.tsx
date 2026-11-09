import Link from "next/link";
import { notFound } from "next/navigation";
import { eventsAdminCtx, adminNotice } from "@/lib/events/page";
import { loadEventRegistrations } from "@/lib/events/data";
import { href } from "@/lib/utils";
import { formatToman, formatDate } from "@/lib/finance/money";
import { todayIso } from "@/lib/finance/periods";
import { eventStats, paymentSummary } from "@/lib/events/stats";
import { makeT } from "@/lib/finance/labels";
import { displayPhone } from "@/lib/events/phone";
import { dateParts, formatTimeRange } from "@/lib/events/time";
import { REG_STATUSES, EVENT_PAY_METHODS, type RegStatus } from "@/lib/events/types";
import { setRegistrationStatus, recordEventPayment, voidEventPayment, setEventAttendance } from "@/lib/actions/admin/events";
import { FinHeader, Kpi, Pill, tbl, Expand, VoidControl, Card, SectionTitle } from "@/components/finance/ui";
import { FinForm, MoneyInput, PrintButton } from "@/components/finance/FinForm";
import { Field, TextInput, Select } from "@/components/admin/fields";
import { DatePicker } from "@/components/admin/DatePicker";
import { pickL } from "@/components/events/shared";

const TONE: Record<RegStatus, "good" | "warn" | "bad" | "neutral"> = { confirmed: "good", pending: "warn", waitlisted: "neutral", rejected: "bad", cancelled: "bad" };
const ORDER: Record<RegStatus, number> = { pending: 0, waitlisted: 1, confirmed: 2, rejected: 3, cancelled: 4 };

export default async function EventRegistrationsPage({
  params, searchParams,
}: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const { l, t } = await eventsAdminCtx(params);
  const sp = await searchParams;
  const res = await loadEventRegistrations(id);
  if (!res.ok) return adminNotice(res, t, t("a_participants"));
  if (!res.data) notFound();
  const { event: ev, registrations, payments, attendance } = res.data;

  const tf = makeT(l);
  const m = (n: number) => formatToman(n, l);
  const nf = (n: number) => n.toLocaleString(l === "fa" ? "fa-IR" : "en-US");
  const stats = eventStats(ev, registrations, payments, attendance);
  const filter = (sp.status ?? "all") as RegStatus | "all";
  const rows = registrations
    .filter((r) => filter === "all" || r.status === filter)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.created_at < b.created_at ? -1 : 1));
  const attMap = new Map(attendance.map((a) => [a.registration_id, a.attended_participants]));
  const today = todayIso();
  const base = href(l, `/dashboard/admin/events/${id}/registrations`);
  const d = dateParts(ev.startsAt, l);

  const statusForm = (rid: string, status: RegStatus, label: string, tone: "accent" | "dark" | "danger" = "dark") => (
    <FinForm action={setRegistrationStatus.bind(null, l)} submit={label} tone={tone} resetOnOk={false} className="!gap-0">
      <input type="hidden" name="id" value={rid} />
      <input type="hidden" name="status" value={status} />
    </FinForm>
  );

  return (
    <div>
      <FinHeader
        title={`${t("a_participants")} — ${pickL(ev.title, l)}`}
        subtitle={`${d.full} · ${formatTimeRange(ev, l)}`}
        actions={
          <>
            <Link href={href(l, "/dashboard/admin/events")} className="text-sm text-ink-soft hover:text-ink">← {t("a_events")}</Link>
            <Link href={href(l, `/dashboard/admin/events/${id}/edit`)} className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink hover:border-ink">{t("a_edit_btn")}</Link>
            <a href={href(l, `/dashboard/admin/events/${id}/export`)} className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink hover:border-ink">{t("a_exportExcel")}</a>
            <PrintButton label={t("a_print")} />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label={t("s_total")} value={nf(stats.totalRegistrations)} hint={`${nf(stats.activeRegistrations)} ${t("rs_confirmed")}/${t("rs_pending")}/${t("rs_waitlisted")}`} />
        <Kpi label={t("s_confirmed")} value={nf(stats.confirmedParticipants)} tone="good" featured />
        <Kpi label={t("s_pending")} value={nf(stats.pendingParticipants)} tone="accent" />
        <Kpi label={t("s_waitlist")} value={nf(stats.waitlistedParticipants)} />
        <Kpi label={t("s_available")} value={stats.seatsAvailable == null ? t("unlimited") : nf(stats.seatsAvailable)} hint={ev.capacity != null ? `${nf(stats.seatsTaken)} / ${nf(ev.capacity)}` : undefined} />
        <Kpi label={t("s_revenue")} value={ev.isPaid ? m(stats.revenue) : t("free")} tone="good" />
        <Kpi label={t("s_outstanding")} value={ev.isPaid ? m(stats.outstanding) : "—"} tone="accent" />
        <Kpi label={t("s_attendance")} value={stats.attendanceRate == null ? "—" : `${nf(stats.attendanceRate)}٪`.replace("٪", l === "fa" ? "٪" : "%")} hint={`${nf(stats.attended)} ${t("s_attended")}`} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        {(["all", ...REG_STATUSES] as const).map((s) => (
          <Link key={s} href={`${base}?status=${s}`} className={`rounded-full border px-4 py-2 text-sm ${filter === s ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-soft hover:border-ink"}`}>
            {s === "all" ? t("all") : t(`rs_${s}` as "rs_pending")}
          </Link>
        ))}
      </div>

      <div className={tbl.wrap}>
        <table className={`${tbl.table} min-w-[64rem]`}>
          <thead className={tbl.head}>
            <tr>{[t("c_name"), t("c_code"), t("c_phone"), t("c_people"), t("c_status"), t("c_payment"), t("c_registered"), t("c_actions")].map((h, i) => <th key={i} className={tbl.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pay = paymentSummary(ev, r, payments);
              const mine = payments.filter((p) => p.registration_id === r.id);
              const att = attMap.get(r.id);
              return (
                <tr key={r.id} className={`${tbl.row} align-top`}>
                  <td className={tbl.td}>
                    <div>
                      <p className="font-bold text-ink">{r.full_name}</p>
                      {r.is_student && <Pill tone="good">{t("c_student")}</Pill>}
                      {r.email && <p className="mt-1 text-xs text-muted" dir="ltr">{r.email}</p>}
                      {r.notes && <p className="mt-1 max-w-56 text-xs text-ink-soft">{r.notes}</p>}
                    </div>
                  </td>
                  <td className={tbl.td} dir="ltr">{r.code}</td>
                  <td className={tbl.td} dir="ltr">{displayPhone(r.phone)}</td>
                  <td className={tbl.num}>{nf(r.participants)}</td>
                  <td className={tbl.td}><Pill tone={TONE[r.status]}>{t(`rs_${r.status}` as "rs_pending")}</Pill></td>
                  <td className={tbl.td}>
                    {ev.isPaid ? (
                      <div>
                        <Pill tone={pay.status === "paid" ? "good" : pay.status === "partial" ? "warn" : pay.status === "refunded" ? "neutral" : "bad"}>{t(`ps_${pay.status}` as "ps_paid")}</Pill>
                        <p className="mt-1 text-xs text-muted">{m(pay.paid)} / {m(pay.due)}</p>
                      </div>
                    ) : <Pill>{t("ps_free")}</Pill>}
                  </td>
                  <td className={tbl.td}>{formatDate(r.created_at.slice(0, 10), l)}</td>
                  <td className={`${tbl.td} min-w-60 print:hidden`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.status === "pending" && <>{statusForm(r.id, "confirmed", t("approve"), "accent")}{statusForm(r.id, "rejected", t("reject"), "danger")}</>}
                        {r.status === "waitlisted" && <>{statusForm(r.id, "confirmed", t("promote"), "accent")}{statusForm(r.id, "rejected", t("reject"), "danger")}</>}
                        {r.status === "confirmed" && <>{statusForm(r.id, "waitlisted", t("moveWaitlist"))}{statusForm(r.id, "cancelled", t("rs_cancelled"), "danger")}</>}
                        {(r.status === "rejected" || r.status === "cancelled") && statusForm(r.id, "pending", t("reactivate"))}
                      </div>

                      {ev.isPaid && (r.status === "pending" || r.status === "confirmed" || mine.length > 0) && (
                        <Expand summary={t("recordPayment")} wide>
                          {mine.length > 0 && (
                            <ul className="mb-4 flex flex-col gap-2 text-xs">
                              {mine.map((p) => (
                                <li key={p.id} className={`flex items-center justify-between gap-3 ${p.voided_at ? "text-muted line-through" : "text-ink"}`}>
                                  <span>{formatDate(p.paid_at, l)} · {p.kind === "refund" ? "−" : ""}{m(p.amount)} · {t(`m_${p.method}` as "m_cash")}</span>
                                  {!p.voided_at && <VoidControl action={voidEventPayment.bind(null, l)} id={p.id} t={tf} />}
                                </li>
                              ))}
                            </ul>
                          )}
                          <FinForm action={recordEventPayment.bind(null, l)} submit={t("recordPayment")}>
                            <input type="hidden" name="registration_id" value={r.id} />
                            <Field label={t("c_status")}>
                              <Select name="kind" defaultValue="payment"><option value="payment">{t("kindPayment")}</option><option value="refund">{t("kindRefund")}</option></Select>
                            </Field>
                            <Field label={`${t("amount")} (${m(Math.max(pay.due - pay.paid, 0))})`}><MoneyInput name="amount" locale={l} defaultValue={Math.max(pay.due - pay.paid, 0) || undefined} /></Field>
                            <Field label={t("method")}>
                              <Select name="method" defaultValue="cash">{EVENT_PAY_METHODS.map((x) => <option key={x} value={x}>{t(`m_${x}` as "m_cash")}</option>)}</Select>
                            </Field>
                            <Field label={t("c_registered")}><DatePicker name="paid_at" locale={l} defaultValue={today} /></Field>
                            <Field label={t("reference")}><TextInput name="reference" dir="ltr" className="text-start" /></Field>
                          </FinForm>
                        </Expand>
                      )}

                      {r.status === "confirmed" && (
                        <Expand summary={`${t("checkIn")}${att != null ? ` · ${nf(att)}/${nf(r.participants)}` : ""}`}>
                          <FinForm action={setEventAttendance.bind(null, l)} submit={t("checkIn")} resetOnOk={false}>
                            <input type="hidden" name="registration_id" value={r.id} />
                            <Field label={`${t("attendedCount")} (0–${nf(r.participants)})`}>
                              <TextInput name="attended" type="number" min={0} max={r.participants} defaultValue={att ?? r.participants} dir="ltr" className="text-start" />
                            </Field>
                          </FinForm>
                        </Expand>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted">{t("a_none")}</td></tr>}
          </tbody>
        </table>
      </div>
      <Card className="mt-6 print:hidden"><SectionTitle>{t("a_registrations")}</SectionTitle><p className="text-sm text-muted">{nf(stats.totalRegistrations)} · {t("rs_pending")}: {nf(stats.pendingParticipants)} · {t("rs_waitlisted")}: {nf(stats.waitlistedParticipants)}</p></Card>
    </div>
  );
}
