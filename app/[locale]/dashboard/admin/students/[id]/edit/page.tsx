import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import Link from "next/link";
import { getProfileById } from "@/lib/data/admin";
import { getStudentAdminView } from "@/lib/data/links";
import { lt } from "@/lib/join/links-labels";
import { href } from "@/lib/utils";
import { deleteStudent } from "@/lib/actions/admin/students";
import { NotConnected } from "@/components/admin/NotConnected";
import { EditPageHeader } from "@/components/admin/EditPageHeader";
import { StudentEditForm } from "@/components/admin/StudentEditForm";

export default async function EditStudentPage({
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
  const [student, view] = await Promise.all([getProfileById(id), getStudentAdminView(id, l)]);
  if (!student) notFound();

  return (
    <div className="max-w-2xl">
      {isServiceRoleConfigured() ? (
        <EditPageHeader
          title={student.full_name ?? a.manageStudents}
          deleteAction={deleteStudent.bind(null, l, student.id)}
          deleteLabel={a.delete}
          cancelLabel={a.cancel}
          confirmText={a.confirmDelete}
        />
      ) : (
        <h1 className="text-2xl font-extrabold text-ink">{student.full_name ?? a.manageStudents}</h1>
      )}

      <div className="mt-8">
        <StudentEditForm dict={dict} locale={l} student={student} />
      </div>

      <div className="mt-10">
        <h2 className="eyebrow">{t("studentClasses")}</h2>
        {view.classes.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-line-strong p-5 text-center text-sm text-muted">{t("noClasses")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-canvas">
            {view.classes.map((c) => (
              <li key={c.enrollmentId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                <span className="min-w-0">
                  <Link href={href(l, `/dashboard/admin/classes/${c.classId}/edit`)} className="font-medium text-ink hover:text-accent-deep hover:underline">
                    {c.title}
                  </Link>
                  {c.teacher && <span className="block text-xs text-muted">{c.teacher}</span>}
                </span>
                <span className="flex items-center gap-4 text-xs text-ink-soft">
                  {c.level && <span dir="ltr" className="rounded-full border border-line-strong px-2.5 py-1">{c.level}</span>}
                  <span className="numeral">{c.progress}%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="eyebrow">{t("attendance")}</h2>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            {(["present", "absent", "late"] as const).map((k) => (
              <div key={k} className="rounded-lg border border-line bg-canvas p-3">
                <dd className="numeral text-xl font-bold text-ink">{view.attendance[k]}</dd>
                <dt className="text-xs text-muted">{t(k)}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="eyebrow">{t("placement")}</h2>
          <p className="mt-4 rounded-lg border border-line bg-canvas p-4 text-sm text-ink">
            {view.placement ? (
              <>
                <span dir="ltr" className="font-bold">{view.placement.levelCode ?? "—"}</span>
                {view.placement.score != null && view.placement.total != null && (
                  <span className="numeral ms-2 text-muted">
                    {view.placement.score}/{view.placement.total}
                  </span>
                )}
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href={href(l, `/dashboard/admin/finance/payments?q=${encodeURIComponent(student.full_name ?? "")}`)}
          className="inline-block rounded-full border border-line-strong px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent"
        >
          {t("viewPayments")}
        </Link>
      </div>
    </div>
  );
}
