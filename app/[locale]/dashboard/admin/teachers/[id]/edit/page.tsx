import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/config";
import { getProfileById } from "@/lib/data/admin";
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

  const teacher = await getProfileById(id);
  if (!teacher) notFound();

  return (
    <div className="max-w-2xl">
      {isServiceRoleConfigured() ? (
        <EditPageHeader
          title={teacher.full_name ?? a.manageTeachers}
          deleteAction={deleteTeacher.bind(null, l, teacher.id)}
          deleteLabel={a.delete}
          confirmText={a.confirmDelete}
        />
      ) : (
        <h1 className="text-2xl font-extrabold text-ink">{teacher.full_name ?? a.manageTeachers}</h1>
      )}
      <div className="mt-8">
        <TeacherEditForm dict={dict} locale={l} teacher={teacher} />
      </div>
    </div>
  );
}
