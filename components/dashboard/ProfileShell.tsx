import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import type { SessionCtx } from "@/lib/auth";
import type { Profile } from "@/lib/supabase/types";
import { href } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { LangToggle } from "@/components/ui/LangToggle";
import { Avatar } from "@/components/ui/Avatar";

/** The student/teacher account experience — a personal profile that happens to
 *  hold their classes and files, not an admin-style dashboard with a sidebar. */
export function ProfileShell({
  dict,
  locale,
  session,
  profile,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  session: SessionCtx;
  profile: Profile | null;
  children: ReactNode;
}) {
  const d = dict.dash;
  const isTeacher = session.role === "teacher";
  const roleLabel = isTeacher ? d.roleTeacher : d.roleStudent;
  const dashHref = href(locale, "/dashboard");

  const navItems = isTeacher
    ? [
        { label: d.classes, hash: "classes" },
        { label: d.students, hash: "students" },
        { label: d.materials, hash: "materials" },
        { label: d.announcements, hash: "announcements" },
      ]
    : [
        { label: d.myClasses, hash: "classes" },
        { label: d.schedule, hash: "schedule" },
        { label: d.attendance, hash: "attendance" },
        { label: d.materials, hash: "materials" },
        { label: d.announcements, hash: "announcements" },
      ];

  const subtitle = isTeacher && profile?.specialty ? pick(profile.specialty, locale) : undefined;

  return (
    <div className="min-h-screen bg-canvas">
      {/* slim top bar — logo + language + sign out, no sidebar */}
      <div className="border-b border-line">
        <div className="container-editorial section-x flex items-center justify-between py-4">
          <Link href={href(locale)} aria-label={d.viewSite}>
            <Logo locale={locale} />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <LangToggle locale={locale} />
            <Link href={href(locale)} className="hidden text-ink-soft transition-colors hover:text-ink sm:inline">
              {d.viewSite}
            </Link>
            <form action={signOut.bind(null, locale)}>
              <button
                type="submit"
                className="rounded-full border border-line-strong px-4 py-1.5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {dict.auth.signOut}
              </button>
            </form>
          </div>
        </div>
      </div>

      {session.demo && (
        <div className="flex items-center justify-center gap-2 bg-slate px-6 py-2.5 text-center text-sm text-canvas">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {d.demoBanner}
        </div>
      )}

      {/* profile header */}
      <div className="border-b border-line bg-sand/40">
        <div className="container-editorial section-x py-10 md:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <Avatar name={session.name} src={profile?.avatar_url} size={84} className="text-2xl" />
              <div>
                <span className="inline-flex items-center rounded-full bg-accent-wash px-3 py-1 text-xs font-medium text-accent-deep">
                  {roleLabel}
                </span>
                <h1 className="mt-2 text-2xl font-extrabold text-ink md:text-3xl">{session.name}</h1>
                {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
              </div>
            </div>

            <Link
              href={href(locale, "/dashboard/profile")}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {d.editProfile}
            </Link>
          </div>

          {/* quiet in-page nav — pills, not a sidebar */}
          <nav className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <a
                key={item.hash}
                href={`${dashHref}#${item.hash}`}
                className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* content */}
      <div className="container-editorial section-x py-10 md:py-14">{children}</div>
    </div>
  );
}
