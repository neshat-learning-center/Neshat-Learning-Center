import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { SessionCtx } from "@/lib/auth";
import { href } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { makeT } from "@/lib/finance/labels";
import { makeET } from "@/lib/events/labels";
import { MobileNav, type NavGroup } from "@/components/dashboard/MobileNav";

type NavItem = { label: string; hash?: string; route?: string };

/** Admin-only nav — students/teachers use ProfileShell instead. */
function navFor(dict: Dictionary, locale: Locale): NavItem[] {
  const d = dict.dash;
  return [
    { label: d.overview, route: "/dashboard" },
    { label: d.students, route: "/dashboard/admin/students" },
    { label: d.teachers, route: "/dashboard/admin/teachers" },
    { label: d.courses, route: "/dashboard/admin/courses" },
    { label: d.classes, route: "/dashboard/admin/classes" },
    { label: d.books, route: "/dashboard/admin/books" },
    { label: d.journal, route: "/dashboard/admin/journal" },
    { label: d.announcements, route: "/dashboard/admin/announcements" },
    { label: makeET(locale)("a_events"), route: "/dashboard/admin/events" },
    { label: dict.admin.leadsTitle, route: "/dashboard/admin/leads" },
    { label: dict.admin.placementTitle, route: "/dashboard/admin/placement" },
    { label: d.profile, route: "/dashboard/profile" },
  ];
}

/** Accounting section — admin only, always Toman. */
function financeNav(locale: Locale): { heading: string; items: NavItem[] } {
  const t = makeT(locale);
  const base = "/dashboard/admin/finance";
  return {
    heading: t("finance"),
    items: [
      { label: t("overview"), route: base },
      { label: t("salaries"), route: `${base}/salaries` },
      { label: t("payments"), route: `${base}/payments` },
      { label: t("books"), route: `${base}/books` },
      { label: t("expenses"), route: `${base}/expenses` },
      { label: t("reports"), route: `${base}/reports` },
      { label: t("transactions"), route: `${base}/transactions` },
      { label: t("settings"), route: `${base}/settings` },
    ],
  };
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
  const nav = navFor(dict, locale);
  const fin = financeNav(locale);
  const roleLabel = dict.dash.roleAdmin;
  const groups: NavGroup[] = [
    { items: nav.map((i) => ({ label: i.label, href: href(locale, i.route as string), exact: i.route === "/dashboard" })) },
    {
      heading: fin.heading,
      items: fin.items.map((i) => ({ label: i.label, href: href(locale, i.route as string), exact: i.route === "/dashboard/admin/finance" })),
    },
  ];

  return (
    <div className="min-h-screen bg-sand/40 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* sidebar (desktop) / top bar + drawer (phone, tablet) */}
      <aside className="sticky top-0 z-30 border-b border-line bg-canvas lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-e lg:border-line print:hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3 lg:px-6 lg:py-5">
          <Link href={href(locale)} className="shrink-0">
            <Logo locale={locale} />
          </Link>
          <div className="flex items-center gap-3 lg:hidden">
            <span className="rounded-full bg-accent-wash px-3 py-1 text-xs font-medium text-accent-deep">{roleLabel}</span>
            <MobileNav
              groups={groups}
              labels={{ open: dict.nav.menu, close: dict.nav.close }}
              siteHref={href(locale)}
              siteLabel={dict.dash.viewSite}
              signOutAction={signOut.bind(null, locale)}
              signOutLabel={dict.auth.signOut}
            />
          </div>
        </div>
        <div className="hidden px-6 lg:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-wash px-3 py-1 text-xs font-medium text-accent-deep">
            {roleLabel}
          </span>
        </div>

        <nav className="mt-6 hidden flex-col gap-1 px-4 pb-4 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.route}
              href={href(locale, item.route as string)}
              className="shrink-0 rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <span className="shrink-0 px-3 pb-1 pt-4 text-xs font-medium text-muted">{fin.heading}</span>
          {fin.items.map((item) => (
            <Link
              key={item.route}
              href={href(locale, item.route as string)}
              className="shrink-0 rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
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
      <div id="top" className="flex min-w-0 flex-col">
        {session.demo && (
          <div className="flex items-center gap-2 bg-slate px-6 py-2.5 text-sm text-canvas">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {dict.dash.demoBanner}
          </div>
        )}
        <header className="flex items-center justify-between px-6 py-6 md:px-10 print:hidden">
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
