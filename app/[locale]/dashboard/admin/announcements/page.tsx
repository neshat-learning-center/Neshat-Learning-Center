import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listAnnouncementsAdmin } from "@/lib/data/admin";
import { href } from "@/lib/utils";
import { deleteAnnouncement } from "@/lib/actions/admin/announcements";
import { NotConnected } from "@/components/admin/NotConnected";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export default async function AdminAnnouncementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const dict = getDictionary(l);
  const a = dict.admin;

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{a.manageAnnouncements}</h1>
        <div className="mt-6">
          <NotConnected message={a.notConnected} />
        </div>
      </div>
    );
  }

  const announcements = await listAnnouncementsAdmin();
  const audienceLabel: Record<string, string> = {
    all: a.audienceAll,
    student: a.audienceStudent,
    teacher: a.audienceTeacher,
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">{a.manageAnnouncements}</h1>
        <Link
          href={href(l, "/dashboard/admin/announcements/new")}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-accent-deep"
        >
          {a.add}
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-canvas">
        {announcements.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{a.createdEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{dict.dash.name}</th>
                <th className="px-5 py-3 text-start font-medium">{a.audience}</th>
                <th className="px-5 py-3 text-start font-medium">{a.edit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {announcements.map((an) => (
                <tr key={an.id}>
                  <td className="px-5 py-3 font-medium text-ink">{an.title}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {audienceLabel[an.audience] ?? an.audience}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={href(l, `/dashboard/admin/announcements/${an.id}/edit`)}
                        className="font-medium text-accent-deep hover:underline"
                      >
                        {a.edit}
                      </Link>
                      <ConfirmForm
                        action={deleteAnnouncement.bind(null, l, an.id)}
                        confirmText={a.confirmDelete}
                      >
                        <button type="submit" className="text-red-600 hover:underline">
                          {a.delete}
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
