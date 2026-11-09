import Link from "next/link";
import { notFound } from "next/navigation";
import { eventsAdminCtx, adminNotice } from "@/lib/events/page";
import { loadAdminEvent, getEventCategories } from "@/lib/events/data";
import { href } from "@/lib/utils";
import { deleteEvent, archiveEvent } from "@/lib/actions/admin/events";
import { FinHeader, Notice } from "@/components/finance/ui";
import { eventPhase, nowMs } from "@/lib/events/time";
import { EventForm } from "@/components/events/admin/EventForm";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { pickL } from "@/components/events/shared";

export default async function EditEventPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const { l, t } = await eventsAdminCtx(params);
  const res = await loadAdminEvent(id);
  if (!res.ok) return adminNotice(res, t, t("a_edit"));
  if (!res.data) notFound();
  const ev = res.data;
  const categories = await getEventCategories();
  const base = href(l, "/dashboard/admin/events");
  return (
    <div className="max-w-4xl">
      <FinHeader
        title={`${t("a_edit")} — ${pickL(ev.title, l)}`}
        actions={
          <>
            <Link href={`${base}/${id}/registrations`} className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink hover:border-ink">{t("a_participants")}</Link>
            {ev.status === "published" && <Link href={href(l, `/events/${ev.slug}`)} className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink hover:border-ink">{t("a_viewPublic")} ↗</Link>}
            <ConfirmForm action={archiveEvent.bind(null, l, id)} confirmText={t("a_archiveConfirm")} cancelLabel={t("a_cancelBtn")} confirmLabel={t("a_archive")}>
              <button type="submit" className="rounded-full border border-line-strong px-4 py-2 text-sm text-red-600 hover:border-red-400">{t("a_archive")}</button>
            </ConfirmForm>
            <ConfirmForm action={deleteEvent.bind(null, l, id)} confirmText={t("a_deleteConfirm")} cancelLabel={t("a_cancelBtn")} confirmLabel={t("a_delete")}>
              <button type="submit" className="rounded-full border border-line-strong px-4 py-2 text-sm text-red-600 hover:border-red-400">{t("a_delete")}</button>
            </ConfirmForm>
          </>
        }
      />
      {ev.status === "published" && eventPhase(ev, nowMs()) === "past" && <div className="mb-6"><Notice tone="warn">{t("a_pastBanner")}</Notice></div>}
      <EventForm locale={l} event={ev} categories={categories} folderKey={ev.id} />
    </div>
  );
}
