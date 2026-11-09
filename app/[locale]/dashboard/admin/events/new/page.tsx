import { randomUUID } from "node:crypto";
import { eventsAdminCtx } from "@/lib/events/page";
import { getEventCategories } from "@/lib/events/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { FinHeader, Notice } from "@/components/finance/ui";
import { EventForm } from "@/components/events/admin/EventForm";

export default async function NewEventPage({ params }: { params: Promise<{ locale: string }> }) {
  const { l, t } = await eventsAdminCtx(params);
  if (!isSupabaseConfigured()) return <div><FinHeader title={t("a_new")} /><Notice tone="warn">{t("a_notConnected")}</Notice></div>;
  const categories = await getEventCategories();
  return (
    <div className="max-w-4xl">
      <FinHeader title={t("a_new")} />
      <EventForm locale={l} categories={categories} folderKey={`new-${randomUUID().slice(0, 8)}`} />
    </div>
  );
}
