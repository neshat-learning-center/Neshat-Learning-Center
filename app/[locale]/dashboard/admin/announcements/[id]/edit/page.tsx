import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAnnouncementById, listClassOptions } from "@/lib/data/admin";
import { NotConnected } from "@/components/admin/NotConnected";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const dict = getDictionary(l);

  if (!isSupabaseConfigured()) {
    return <NotConnected message={dict.admin.notConnected} />;
  }

  const [announcement, classes] = await Promise.all([getAnnouncementById(id), listClassOptions()]);
  if (!announcement) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{announcement.title}</h1>
      <div className="mt-8">
        <AnnouncementForm dict={dict} locale={l} announcement={announcement} classes={classes} />
      </div>
    </div>
  );
}
