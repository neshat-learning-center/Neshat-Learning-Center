import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfileById, listStudentEnrollments } from "@/lib/data/admin";
import { NotConnected } from "@/components/admin/NotConnected";
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

  const [student, enrollments] = await Promise.all([
    getProfileById(id),
    listStudentEnrollments(id),
  ]);
  if (!student) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{student.full_name ?? a.manageStudents}</h1>

      <div className="mt-8">
        <StudentEditForm dict={dict} locale={l} student={student} />
      </div>

      {enrollments.length > 0 && (
        <div className="mt-10">
          <h2 className="eyebrow">{dict.dash.classes}</h2>
          <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
            {enrollments.map((e) => (
              <li key={e.id} className="py-3 text-sm text-ink">
                {e.classTitle}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
