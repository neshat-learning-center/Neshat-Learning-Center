import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/auth";
import { getMyProfile, getStudentData } from "@/lib/dashboard/data";
import Link from "next/link";
import { lt } from "@/lib/join/links-labels";
import { href } from "@/lib/utils";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";

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
  const myClasses = session.role === "student" && !session.demo ? (await getStudentData(session, l)).classes : [];
  const t = lt(l);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">{p.title}</h1>
      <p className="mt-2 text-ink-soft">{p.lead}</p>

      {session.role === "student" && !session.demo && (
        <section className="mt-8" aria-labelledby="my-classes-h">
          <h2 id="my-classes-h" className="eyebrow">{dict.dash.myClasses}</h2>
          {myClasses.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-line-strong p-5 text-sm text-muted">
              {t("noClasses")}{" "}
              <Link href={href(l, "/dashboard#join")} className="font-medium text-accent-deep underline underline-offset-4">
                {dict.dash.myClasses}
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-canvas">
              {myClasses.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{c.title}</span>
                    {c.teacher && <span className="block text-xs text-muted">{c.teacher}</span>}
                  </span>
                  <span className="flex items-center gap-3 text-xs text-ink-soft">
                    {c.level && <span dir="ltr" className="rounded-full border border-line-strong px-2.5 py-1">{c.level}</span>}
                    <span className="numeral">{c.progress}%</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="mt-8">
        {profile ? (
          <>
            <ProfileForm dict={dict} locale={l} role={session.role} email={session.email} profile={profile} />
            <div className="mt-12 border-t border-line pt-10">
              <ChangePasswordForm dict={dict} locale={l} />
            </div>
          </>
        ) : (
          <div className="rounded-md border border-line bg-sand p-5 text-sm text-ink-soft">
            {p.demoNotice}
          </div>
        )}
      </div>
    </div>
  );
}
