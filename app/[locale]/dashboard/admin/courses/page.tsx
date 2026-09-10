import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCoursesAdmin } from "@/lib/data/admin";
import { languageLabel } from "@/lib/data/public";
import type { LanguageKey } from "@/content/types";
import { href } from "@/lib/utils";
import { deleteCourse } from "@/lib/actions/admin/courses";
import { NotConnected } from "@/components/admin/NotConnected";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export default async function AdminCoursesPage({
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
        <h1 className="text-2xl font-extrabold text-ink">{a.manageCourses}</h1>
        <div className="mt-6">
          <NotConnected message={a.notConnected} />
        </div>
      </div>
    );
  }

  const courses = await listCoursesAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">{a.manageCourses}</h1>
        <Link
          href={href(l, "/dashboard/admin/courses/new")}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-accent-deep"
        >
          {a.add}
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-canvas">
        {courses.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">{a.createdEmpty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{a.titleFa}</th>
                <th className="px-5 py-3 text-start font-medium">{dict.courses.language}</th>
                <th className="px-5 py-3 text-start font-medium">{a.teacher}</th>
                <th className="px-5 py-3 text-start font-medium">{a.edit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium text-ink">{c.title?.fa ?? c.title?.en}</td>
                  <td className="px-5 py-3 text-ink-soft">{languageLabel(c.language as LanguageKey, l)}</td>
                  <td className="px-5 py-3 text-ink-soft">{c.teacherName ?? a.noTeacher}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={href(l, `/dashboard/admin/courses/${c.id}/edit`)}
                        className="font-medium text-accent-deep hover:underline"
                      >
                        {a.edit}
                      </Link>
                      <ConfirmForm action={deleteCourse.bind(null, l, c.id)} confirmText={a.confirmDelete}>
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
