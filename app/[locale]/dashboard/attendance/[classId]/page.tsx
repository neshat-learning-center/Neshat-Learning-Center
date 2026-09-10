import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getClassForAttendance, getClassRosterForToday } from "@/lib/data/attendance";
import { NotConnected } from "@/components/admin/NotConnected";
import { AttendanceForm } from "@/components/dashboard/AttendanceForm";

export default async function AttendancePage({
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
        <h1 className="text-2xl font-extrabold text-ink">{dict.dash.markAttendance}</h1>
        <div className="mt-6">
          <NotConnected message={dict.admin.notConnected} />
        </div>
      </div>
    );
  }

  const klass = await getClassForAttendance(classId, session.id, session.role === "admin");
  if (!klass) notFound();

  const roster = await getClassRosterForToday(classId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{klass.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {dict.dash.markAttendance} · {dict.dash.today}
      </p>

      <div className="mt-8">
        {roster.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
            {dict.dash.noStudentsEnrolled}
          </p>
        ) : (
          <AttendanceForm dict={dict} locale={l} classId={classId} roster={roster} />
        )}
      </div>
    </div>
  );
}
