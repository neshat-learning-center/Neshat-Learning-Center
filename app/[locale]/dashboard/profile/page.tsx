import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { getMyProfile } from "@/lib/dashboard/data";
import { href } from "@/lib/utils";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export default async function ProfilePage({
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

  const p = dict.profile;
  const profile = session.demo ? null : await getMyProfile(session);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{p.title}</h1>
      <p className="mt-2 text-ink-soft">{p.lead}</p>

      <div className="mt-8">
        {profile ? (
          <ProfileForm dict={dict} locale={l} role={session.role} email={session.email} profile={profile} />
        ) : (
          <div className="rounded-md border border-line bg-sand p-5 text-sm text-ink-soft">
            {p.demoNotice}
          </div>
        )}
      </div>
    </div>
  );
}
