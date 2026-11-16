import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import Link from "next/link";
import { getProfileById } from "@/lib/data/admin";
import { listTeacherClassesAdmin } from "@/lib/data/links";
import { lt } from "@/lib/join/links-labels";
import { href } from "@/lib/utils";
import { deleteTeacher } from "@/lib/actions/admin/teachers";
import { NotConnected } from "@/components/admin/NotConnected";
import { EditPageHeader } from "@/components/admin/EditPageHeader";
import { TeacherEditForm } from "@/components/admin/TeacherEditForm";

export default async function EditTeacherPage({
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
    return <NotConnected message={a.notConnected} />;
  }

  const t = lt(l);
  const [teacher, classes] = await Promise.all([getProfileById(id), listTeacherClassesAdmin(id, l)]);
  if (!teacher) notFound();

  return (
    <div className="max-w-2xl">
      {isServiceRoleConfigured() ? (
        <EditPageHeader
          title={teacher.full_name ?? a.manageTeachers}
          deleteAction={deleteTeacher.bind(null, l, teacher.id)}
          deleteLabel={a.delete}
          cancelLabel={a.cancel}
          confirmText={a.confirmDelete}
        />
      ) : (
        <h1 className="text-2xl font-extrabold text-ink">{teacher.full_name ?? a.manageTeachers}</h1>
      )}
      <div className="mt-8">
        <TeacherEditForm dict={dict} locale={l} teacher={teacher} />
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <h2 className="eyebrow">{t("teacherClasses")}</h2>
        {classes.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-line-strong p-5 text-center text-sm text-muted">{t("noClassesTeacher")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-canvas">
            {classes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                <Link href={href(l, `/dashboard/admin/classes/${c.id}/edit`)} className="font-medium text-ink hover:text-accent-deep hover:underline">
                  {c.title}
                </Link>
                <span className="numeral text-xs text-ink-soft">
                  {t("students")}: {c.enrolled}
                  {c.capacity != null ? ` / ${c.capacity}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={href(l, `/dashboard/admin/finance/salaries/${teacher.id}`)}
          className="mt-5 inline-block rounded-full border border-line-strong px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent"
        >
          {t("viewSalary")}
        </Link>
      </div>
    </div>
  );
}
