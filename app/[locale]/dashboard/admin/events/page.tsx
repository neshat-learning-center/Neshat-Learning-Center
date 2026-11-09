import Link from "next/link";
import { eventsAdminCtx, adminNotice } from "@/lib/events/page";
import { loadAdminEvents } from "@/lib/events/data";
import { href } from "@/lib/utils";
import { dateParts, formatTimeRange, eventPhase, nowMs } from "@/lib/events/time";
import { deleteEvent, archiveEvent } from "@/lib/actions/admin/events";
import { EVENT_STATUSES, type EventStatus } from "@/lib/events/types";
import { FinHeader, Pill, tbl } from "@/components/finance/ui";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { pickL } from "@/components/events/shared";

const TONE: Record<EventStatus, "good" | "warn" | "bad" | "neutral"> = { published: "good", draft: "neutral", completed: "neutral", cancelled: "bad", archived: "neutral" };

export default async function AdminEventsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { l, t } = await eventsAdminCtx(params);
  const sp = await searchParams;
  const res = await loadAdminEvents();
  if (!res.ok) return adminNotice(res, t, t("a_events"));
  const filter = (sp.status ?? "all") as EventStatus | "all";
  const rows = res.data.filter((r) => (filter === "all" ? r.event.status !== "archived" : r.event.status === filter));
  const nf = (n: number) => n.toLocaleString(l === "fa" ? "fa-IR" : "en-US");
  const base = href(l, "/dashboard/admin/events");
  const now = nowMs();

  return (
    <div>
      <FinHeader
        title={t("a_events")}
        actions={<Link href={`${base}/new`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate hover:bg-accent-deep">+ {t("a_new")}</Link>}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", ...EVENT_STATUSES] as const).map((s) => (
          <Link key={s} href={`${base}?status=${s}`} className={`rounded-full border px-4 py-2 text-sm ${filter === s ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-soft hover:border-ink"}`}>
            {s === "all" ? t("all") : t(`es_${s}` as "es_draft")}
          </Link>
        ))}
      </div>

      <div className={tbl.wrap}>
        <table className={`${tbl.table} min-w-[56rem]`}>
          <thead className={tbl.head}>
            <tr>{[t("a_events"), t("category"), t("date"), t("a_status"), t("seats"), t("a_registrations"), ""].map((h, i) => <th key={i} className={tbl.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(({ event: e, registrations, confirmedPeople, pendingPeople, waitlistedPeople }) => {
              const d = dateParts(e.startsAt, l);
              return (
                <tr key={e.id} className={`${tbl.row} align-top`}>
                  <td className={tbl.td}>
                    <div className="flex items-center gap-3">
                      {e.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.cover} alt="" className="h-12 w-12 shrink-0 object-cover" />
                      ) : <span className="h-12 w-12 shrink-0 bg-sand-deep" />}
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{pickL(e.title, l)}</p>
                        {e.featured && <Pill tone="warn">★ {t("secFeatured")}</Pill>}
                      </div>
                    </div>
                  </td>
                  <td className={tbl.td}>{e.category?.title[l] ?? "—"}</td>
                  <td className={tbl.td}><div>{d.day} {d.monthLong} {d.year}<div className="text-xs text-muted">{formatTimeRange(e, l)}</div></div></td>
                  <td className={tbl.td}><div className="flex flex-wrap gap-1"><Pill tone={TONE[e.status]}>{t(`es_${e.status}` as "es_draft")}</Pill>{e.status === "published" && eventPhase(e, now) === "past" && <Pill tone="warn">{t("a_datePassed")}</Pill>}</div></td>
                  <td className={tbl.num}>{nf(confirmedPeople + pendingPeople)}{e.capacity != null ? ` / ${nf(e.capacity)}` : ""}</td>
                  <td className={tbl.td}><div>{nf(registrations)}{pendingPeople > 0 && <div className="text-xs text-accent-deep">{nf(pendingPeople)} {t("rs_pending")}</div>}{waitlistedPeople > 0 && <div className="text-xs text-muted">{nf(waitlistedPeople)} {t("rs_waitlisted")}</div>}</div></td>
                  <td className={`${tbl.td} min-w-52`}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <Link href={`${base}/${e.id}/registrations`} className="font-semibold text-accent-deep hover:underline">{t("a_participants")}</Link>
                      <Link href={`${base}/${e.id}/edit`} className="text-ink hover:underline">{t("a_edit_btn")}</Link>
                      {(e.status === "published" || e.status === "completed") && <Link href={href(l, `/events/${e.slug}`)} className="text-muted hover:underline">↗</Link>}
                      {registrations === 0 && waitlistedPeople === 0 ? (
                        <ConfirmForm action={deleteEvent.bind(null, l, e.id)} confirmText={t("a_deleteConfirm")} cancelLabel={t("a_cancelBtn")} confirmLabel={t("a_delete")}>
                          <button type="submit" className="text-red-600 hover:underline">{t("a_delete")}</button>
                        </ConfirmForm>
                      ) : e.status !== "archived" ? (
                        <ConfirmForm action={archiveEvent.bind(null, l, e.id)} confirmText={t("a_archiveConfirm")} cancelLabel={t("a_cancelBtn")} confirmLabel={t("a_archive")}>
                          <button type="submit" className="text-red-600 hover:underline">{t("a_archive")}</button>
                        </ConfirmForm>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">{t("a_none")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
