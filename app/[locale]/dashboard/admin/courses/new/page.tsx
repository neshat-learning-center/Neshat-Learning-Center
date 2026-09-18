import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listBookOptions } from "@/lib/data/admin";
import { NotConnected } from "@/components/admin/NotConnected";
import { CourseForm } from "@/components/admin/CourseForm";

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const dict = getDictionary(l);

  if (!isSupabaseConfigured()) {
    return <NotConnected message={dict.admin.notConnected} />;
  }

  const books = await listBookOptions();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{dict.admin.add}</h1>
      <div className="mt-8">
        <CourseForm dict={dict} locale={l} books={books} />
      </div>
      <p className="mt-4 text-sm text-muted">{dict.admin.saveCourseFirst}</p>
    </div>
  );
}
