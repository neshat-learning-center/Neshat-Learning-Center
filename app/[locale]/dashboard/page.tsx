import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { getStudentData, getTeacherData, getAdminData } from "@/lib/dashboard/data";
import { getStudentJoinData } from "@/lib/data/join";
import { getClassCounts } from "@/lib/data/links";
import { getMyAccount, getMySalary } from "@/lib/data/myfinance";
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
    const [counts, salary] = session.demo
      ? [null, null]
      : await Promise.all([getClassCounts(data.classes.map((c) => c.id)), getMySalary()]);
    return <TeacherOverview dict={dict} locale={l} data={data} pending={counts?.pending} salary={salary} />;
  }
  if (session.role === "admin") {
    const data = await getAdminData(session, l);
    return <AdminOverview dict={dict} locale={l} data={data} />;
  }
  const [data, join, account] = await Promise.all([
    getStudentData(session, l),
    session.id && !session.demo ? getStudentJoinData(session.id, l) : Promise.resolve(null),
    session.id && !session.demo ? getMyAccount(l) : Promise.resolve(null),
  ]);
  return <StudentOverview dict={dict} locale={l} data={data} join={join} account={account} />;
}
