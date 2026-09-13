import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { getStudentData, getTeacherData, getAdminData } from "@/lib/dashboard/data";
import { StudentOverview } from "@/components/dashboard/StudentOverview";
import { TeacherOverview } from "@/components/dashboard/TeacherOverview";
import { AdminOverview } from "@/components/dashboard/AdminOverview";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);

  const session = await getSession();
  if (!session) redirect(href(l, "/login"));

  if (session.role === "teacher") {
    const data = await getTeacherData(session, l);
    return <TeacherOverview dict={dict} locale={l} data={data} />;
  }
  if (session.role === "admin") {
    const data = await getAdminData(session, l);
    return <AdminOverview dict={dict} locale={l} data={data} />;
  }
  const data = await getStudentData(session, l);
  return <StudentOverview dict={dict} locale={l} data={data} />;
}
