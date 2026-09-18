import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAnnouncementById, listClassOptions } from "@/lib/data/admin";
import { deleteAnnouncement } from "@/lib/actions/admin/announcements";
import { NotConnected } from "@/components/admin/NotConnected";
import { EditPageHeader } from "@/components/admin/EditPageHeader";
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
  const a = dict.admin;

  if (!isSupabaseConfigured()) {
    return <NotConnected message={dict.admin.notConnected} />;
  }

  const [announcement, classes] = await Promise.all([getAnnouncementById(id), listClassOptions()]);
  if (!announcement) notFound();

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={announcement.title}
        deleteAction={deleteAnnouncement.bind(null, l, announcement.id)}
        deleteLabel={a.delete}
        confirmText={a.confirmDelete}
      />
      <div className="mt-8">
        <AnnouncementForm dict={dict} locale={l} announcement={announcement} classes={classes} />
      </div>
    </div>
  );
}
