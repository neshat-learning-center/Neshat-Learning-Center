import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import { getClassById, listCourseOptions, listTeacherOptions, listClassEnrollments } from "@/lib/data/admin";
import { listMaterialsForClass, resolveMaterialUrl } from "@/lib/data/materials";
import { deleteClass } from "@/lib/actions/admin/classes";
import { NotConnected } from "@/components/admin/NotConnected";
import { EditPageHeader } from "@/components/admin/EditPageHeader";
import { ClassForm } from "@/components/admin/ClassForm";
import { EnrollmentManager } from "@/components/admin/EnrollmentManager";
import { MaterialsManager, type MaterialWithUrl } from "@/components/admin/MaterialsManager";

export default async function EditClassPage({
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

  const [klass, courses, teachers, enrollments, materialRows] = await Promise.all([
    getClassById(id),
    listCourseOptions(),
    listTeacherOptions(),
    listClassEnrollments(id),
    listMaterialsForClass(id),
  ]);
  if (!klass) notFound();

  const materials: MaterialWithUrl[] = await Promise.all(
    materialRows.map(async (m) => ({
      id: m.id,
      title: m.title,
      kind: m.kind,
      path: m.url,
      resolvedUrl: await resolveMaterialUrl(m.url),
    })),
  );

  return (
    <div className="max-w-2xl">
      <EditPageHeader
        title={klass.title}
        deleteAction={deleteClass.bind(null, l, klass.id, undefined)}
        deleteLabel={a.delete}
        confirmText={a.confirmDelete}
      />
      <div className="mt-8">
        <ClassForm dict={dict} locale={l} klass={klass} courses={courses} teachers={teachers} />
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <EnrollmentManager
          dict={dict}
          locale={l}
          classId={id}
          enrollments={enrollments}
          canEnroll={isServiceRoleConfigured()}
        />
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <MaterialsManager dict={dict} locale={l} classId={id} materials={materials} />
      </div>
    </div>
  );
}
