import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { requireAdminSession } from "@/lib/admin-guard";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import { NotConnected } from "@/components/admin/NotConnected";
import { CreateTeacherForm } from "@/components/admin/CreateTeacherForm";

export default async function NewTeacherPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  await requireAdminSession(l);
  const dict = getDictionary(l);
  const a = dict.admin;

  if (!isServiceRoleConfigured()) {
    return <NotConnected message={a.serviceRoleMissing} />;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-extrabold text-ink">{a.createTeacherTitle}</h1>
      <p className="mt-2 text-ink-soft">{a.createTeacherLead}</p>
      <div className="mt-8">
        <CreateTeacherForm dict={dict} locale={l} />
      </div>
    </div>
  );
}
