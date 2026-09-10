import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import type { AdminData } from "@/lib/dashboard/data";
import { getCourses, getTeachers, getBooks, languageLabel } from "@/lib/data/public";
import { listLeads } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { href } from "@/lib/utils";
import { Panel, StatTile } from "./primitives";

function AddLink({ locale, route, label }: { locale: Locale; route: string; label: string }) {
  return (
    <Link
      href={href(locale, route)}
      className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-ink"
    >
      {label}
    </Link>
  );
}

function ManageLink({ locale, route, label }: { locale: Locale; route: string; label: string }) {
  return (
    <Link
      href={href(locale, route)}
      className="flex items-center justify-center rounded-lg border border-dashed border-line-strong p-6 text-sm font-medium text-accent-deep transition-colors hover:border-ink hover:text-ink"
    >
      {label} ↗
    </Link>
  );
}

export async function AdminOverview({
  dict,
  locale,
  data,
}: {
  dict: Dictionary;
  locale: Locale;
  data: AdminData;
}) {
  const d = dict.dash;
  const a = dict.admin;
  const [courses, teachers, books] = await Promise.all([getCourses(), getTeachers(), getBooks()]);
  const pendingLeads = isSupabaseConfigured() ? (await listLeads()).filter((lead) => !lead.contacted).length : null;
  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.stats.map((s, i) => (
          <StatTile key={i} label={s.key} value={s.value} />
        ))}
      </div>

      <Panel id="students" title={d.students}>
        <ManageLink locale={locale} route="/dashboard/admin/students" label={a.manageStudents} />
      </Panel>

      <Panel
        id="teachers"
        title={d.teachers}
        action={<AddLink locale={locale} route="/dashboard/admin/teachers/new" label={a.add} />}
      >
        <div className="overflow-hidden rounded-lg border border-line bg-canvas">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{d.name}</th>
                <th className="px-5 py-3 text-start font-medium">{dict.teachers.specialty}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teachers.map((t) => (
                <tr key={t.slug}>
                  <td className="px-5 py-3 font-medium text-ink">{pick(t.name, locale)}</td>
                  <td className="px-5 py-3 text-ink-soft">{pick(t.specialty, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        id="courses"
        title={d.courses}
        action={<AddLink locale={locale} route="/dashboard/admin/courses/new" label={a.add} />}
      >
        <div className="overflow-hidden rounded-lg border border-line bg-canvas">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{d.name}</th>
                <th className="px-5 py-3 text-start font-medium">{dict.courses.language}</th>
                <th className="px-5 py-3 text-start font-medium">{dict.courses.level}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {courses.map((c) => (
                <tr key={c.slug}>
                  <td className="px-5 py-3 font-medium text-ink">{pick(c.title, locale)}</td>
                  <td className="px-5 py-3 text-ink-soft">{languageLabel(c.language, locale)}</td>
                  <td className="px-5 py-3 text-ink-soft">{pick(c.level, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        id="classes"
        title={d.classes}
        action={<AddLink locale={locale} route="/dashboard/admin/classes/new" label={a.add} />}
      >
        <ManageLink locale={locale} route="/dashboard/admin/classes" label={a.manageClasses} />
      </Panel>

      <Panel
        id="books"
        title={d.books}
        action={<AddLink locale={locale} route="/dashboard/admin/books/new" label={a.add} />}
      >
        <div className="overflow-hidden rounded-lg border border-line bg-canvas">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-5 py-3 text-start font-medium">{d.name}</th>
                <th className="px-5 py-3 text-start font-medium">{dict.courses.language}</th>
                <th className="px-5 py-3 text-start font-medium">{dict.books.level}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {books.map((b) => (
                <tr key={b.slug}>
                  <td className="px-5 py-3 font-medium text-ink">{pick(b.title, locale)}</td>
                  <td className="px-5 py-3 text-ink-soft">{languageLabel(b.language, locale)}</td>
                  <td className="px-5 py-3 text-ink-soft">{pick(b.level, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        id="announcements"
        title={d.announcements}
        action={<AddLink locale={locale} route="/dashboard/admin/announcements/new" label={a.add} />}
      >
        <ManageLink locale={locale} route="/dashboard/admin/announcements" label={a.manageAnnouncements} />
      </Panel>

      <Panel
        id="journal"
        title={d.journal}
        action={<AddLink locale={locale} route="/dashboard/admin/journal/new" label={a.add} />}
      >
        <ManageLink locale={locale} route="/dashboard/admin/journal" label={a.manageJournal} />
      </Panel>

      <Panel id="leads" title={a.leadsTitle}>
        <ManageLink
          locale={locale}
          route="/dashboard/admin/leads"
          label={pendingLeads !== null ? `${a.leadsTitle} (${pendingLeads})` : a.leadsTitle}
        />
      </Panel>
    </div>
  );
}
