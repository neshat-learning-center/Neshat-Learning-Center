import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getClassById } from "@/lib/data/admin";
import { listMaterialsForClass, resolveMaterialUrl } from "@/lib/data/materials";
import { listHomeworkForClass } from "@/lib/data/homework";
import { getClassRosterForToday } from "@/lib/data/attendance";
import { NotConnected } from "@/components/admin/NotConnected";
import { MaterialsManager } from "@/components/admin/MaterialsManager";
import { HomeworkManager } from "@/components/dashboard/HomeworkManager";

export default async function TeacherClassPage({
  params,
}: {
  params: Promise<{ locale: string; classId: string }>;
}) {
  const { locale, classId } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);

  const session = await getSession();
  if (!session) redirect(href(l, "/login"));
  if (session.role !== "teacher" && session.role !== "admin") redirect(href(l, "/dashboard"));

  if (!isSupabaseConfigured() || session.demo || !session.id) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-ink">{dict.homework.manageClass}</h1>
        <div className="mt-6">
          <NotConnected message={dict.admin.notConnected} />
        </div>
      </div>
    );
  }

  const klass = await getClassById(classId);
  if (!klass) notFound();
  if (session.role !== "admin" && klass.teacher_id !== session.id) notFound();

  const [materialRows, homework, roster] = await Promise.all([
    listMaterialsForClass(classId),
    listHomeworkForClass(classId),
    getClassRosterForToday(classId),
  ]);
  const materials = await Promise.all(
    materialRows.map(async (m) => ({
      id: m.id,
      title: m.title,
      kind: m.kind,
      path: m.url,
      resolvedUrl: await resolveMaterialUrl(m.url),
    })),
  );

  return (
    <div className="flex max-w-3xl flex-col gap-12">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{klass.title}</h1>
        <p className="mt-1 text-sm text-muted">{klass.schedule}</p>
      </div>

      <div>
        <h2 className="eyebrow">{dict.homework.roster}</h2>
        {roster.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
            {dict.homework.noStudentsEnrolled}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-canvas">
            {roster.map((r) => (
              <li key={r.enrollmentId} className="px-5 py-3 text-sm font-medium text-ink">
                {r.studentName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <HomeworkManager dict={dict} locale={l} classId={classId} homework={homework} />

      <MaterialsManager dict={dict} locale={l} classId={classId} materials={materials} />
    </div>
  );
}
