import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { SessionCtx } from "@/lib/auth";
import { href } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/Logo";

type NavItem = { label: string; hash?: string; route?: string };

function navFor(role: SessionCtx["role"], dict: Dictionary): NavItem[] {
  const d = dict.dash;
  const profile: NavItem = { label: d.profile, route: "/dashboard/profile" };
  if (role === "student")
    return [
      { label: d.overview, hash: "#top" },
      { label: d.myClasses, hash: "#classes" },
      { label: d.schedule, hash: "#schedule" },
      { label: d.attendance, hash: "#attendance" },
      { label: d.materials, hash: "#materials" },
      { label: d.announcements, hash: "#announcements" },
      profile,
    ];
  if (role === "teacher")
    return [
      { label: d.overview, hash: "#top" },
      { label: d.classes, hash: "#classes" },
      { label: d.students, hash: "#students" },
      { label: d.materials, hash: "#materials" },
      { label: d.announcements, hash: "#announcements" },
      profile,
    ];
  return [
    { label: d.overview, route: "/dashboard" },
    { label: d.students, route: "/dashboard/admin/students" },
    { label: d.teachers, route: "/dashboard/admin/teachers" },
    { label: d.courses, route: "/dashboard/admin/courses" },
    { label: d.classes, route: "/dashboard/admin/classes" },
    { label: d.books, route: "/dashboard/admin/books" },
    { label: d.journal, route: "/dashboard/admin/journal" },
    { label: d.announcements, route: "/dashboard/admin/announcements" },
    { label: dict.admin.leadsTitle, route: "/dashboard/admin/leads" },
    profile,
  ];
}

export function Shell({
  dict,
  locale,
  session,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  session: SessionCtx;
  children: ReactNode;
}) {
  const nav = navFor(session.role, dict);
  const roleLabel =
    session.role === "student"
      ? dict.dash.roleStudent
      : session.role === "teacher"
        ? dict.dash.roleTeacher
        : dict.dash.roleAdmin;

  return (
    <div className="min-h-screen bg-sand/40 lg:grid lg:grid-cols-[16rem_1fr]">
      {/* sidebar */}
      <aside className="sticky top-0 z-30 flex h-auto flex-col border-b border-line bg-canvas lg:h-screen lg:border-b-0 lg:border-e lg:border-line">
        <div className="flex items-center justify-between px-6 py-5">
          <Link href={href(locale)}>
            <Logo locale={locale} />
          </Link>
        </div>
        <div className="px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-wash px-3 py-1 text-xs font-medium text-accent-deep">
            {roleLabel}
          </span>
        </div>

        <nav className="no-scrollbar mt-4 flex gap-1 overflow-x-auto px-4 pb-4 lg:mt-6 lg:flex-col lg:overflow-visible lg:px-4">
          {nav.map((item) =>
            item.route ? (
              <Link
                key={item.route}
                href={href(locale, item.route)}
                className="shrink-0 rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.hash}
                href={item.hash}
                className="shrink-0 rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="mt-auto hidden flex-col gap-1 border-t border-line p-4 lg:flex">
          <Link
            href={href(locale)}
            className="rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink"
          >
            {dict.dash.viewSite}
          </Link>
          <form action={signOut.bind(null, locale)}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-start text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink"
            >
              {dict.auth.signOut}
            </button>
          </form>
        </div>
      </aside>

      {/* content */}
      <div id="top" className="flex flex-col">
        {session.demo && (
          <div className="flex items-center gap-2 bg-slate px-6 py-2.5 text-sm text-canvas">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {dict.dash.demoBanner}
          </div>
        )}
        <header className="flex items-center justify-between px-6 py-6 md:px-10">
          <div>
            <p className="text-sm text-muted">{dict.dash.welcome}</p>
            <p className="text-lg font-bold text-ink">{session.name}</p>
          </div>
          <form action={signOut.bind(null, locale)} className="lg:hidden">
            <button type="submit" className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink">
              {dict.auth.signOut}
            </button>
          </form>
        </header>
        <div className="px-6 pb-16 md:px-10">{children}</div>
      </div>
    </div>
  );
}
