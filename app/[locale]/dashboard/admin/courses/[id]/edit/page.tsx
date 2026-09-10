import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCourseById, listTeacherOptions } from "@/lib/data/admin";
import { NotConnected } from "@/components/admin/NotConnected";
import { CourseForm } from "@/components/admin/CourseForm";

export default async function EditCoursePage({
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

  const [course, teachers] = await Promise.all([getCourseById(id), listTeacherOptions()]);
  if (!course) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{course.title?.fa ?? course.title?.en}</h1>
      <div className="mt-8">
        <CourseForm dict={dict} locale={l} course={course} teachers={teachers} />
      </div>
    </div>
  );
}
