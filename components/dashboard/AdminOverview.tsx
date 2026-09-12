import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import type { AdminData } from "@/lib/dashboard/data";
import { relativeTime } from "@/lib/dashboard/data";
import { getCourses, getTeachers, getBooks, languageLabel } from "@/lib/data/public";
import { listLeads, listStudents, listClassesAdmin, listAnnouncementsAdmin, listPostsAdmin } from "@/lib/data/admin";
import { markLeadContacted } from "@/lib/actions/admin/leads";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { href } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
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

const statusTone: Record<string, string> = {
  active: "bg-accent-wash text-accent-deep",
  upcoming: "bg-sand text-ink-soft",
  finished: "bg-sand text-muted",
  cancelled: "bg-sand text-muted line-through",
};

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
  const configured = isSupabaseConfigured();

  const [courses, teachers, books] = await Promise.all([getCourses(), getTeachers(), getBooks()]);

  const [leads, recentStudents, recentClasses, recentAnnouncements, recentPosts] = configured
    ? await Promise.all([
        listLeads(),
        listStudents(),
        listClassesAdmin(),
        listAnnouncementsAdmin(),
        listPostsAdmin(),
      ])
    : [[], [], [], [], []];

  const pendingLeads = leads.filter((lead) => !lead.contacted);
  const statusLabel: Record<string, string> = {
    active: a.statusActive,
    upcoming: a.statusUpcoming,
    finished: a.statusFinished,
    cancelled: a.statusCancelled,
  };
  const kindLabel: Record<string, string> = {
    placement: a.leadKindPlacement,
    contact: a.leadKindContact,
  };
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US");

  return (
    <div className="flex flex-col gap-12">
      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {data.stats.map((s, i) => (
          <StatTile key={i} label={s.key} value={s.value} />
        ))}
        <StatTile
          label={a.pendingLeadsStat}
          value={configured ? pendingLeads.length : null}
          href={href(locale, "/dashboard/admin/leads")}
          urgent
        />
      </div>

      {/* quick actions */}
      <div>
        <h2 className="text-sm font-medium text-muted">{a.quickActions}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <AddLink locale={locale} route="/dashboard/admin/teachers/new" label={a.quickAddTeacher} />
          <AddLink locale={locale} route="/dashboard/admin/courses/new" label={a.quickAddCourse} />
          <AddLink locale={locale} route="/dashboard/admin/classes/new" label={a.quickAddClass} />
          <AddLink locale={locale} route="/dashboard/admin/announcements/new" label={a.quickAddAnnouncement} />
        </div>
      </div>

      {/* leads inbox */}
      {configured && (
        <Panel
          id="leads"
          title={a.recentLeads}
          action={<Link href={href(locale, "/dashboard/admin/leads")} className="text-sm font-medium text-accent-deep hover:underline">{a.viewAll}</Link>}
        >
          {pendingLeads.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {a.noLeadsPending}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
              {pendingLeads.slice(0, 5).map((lead) => (
                <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-ink">{lead.name}</p>
                    <p className="mt-0.5 text-sm text-muted" dir="ltr">
                      {lead.phone} · {kindLabel[lead.kind] ?? lead.kind} · {fmtDate(lead.created_at)}
                    </p>
                  </div>
                  <form action={markLeadContacted.bind(null, locale, lead.id, true)}>
                    <button
                      type="submit"
                      className="rounded-full border border-line-strong px-4 py-1.5 text-sm text-ink transition-colors hover:border-ink"
                    >
                      {a.leadMarkContacted}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {/* recent students + recent classes */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Panel
          id="students"
          title={configured ? a.recentStudents : d.students}
          action={<Link href={href(locale, "/dashboard/admin/students")} className="text-sm font-medium text-accent-deep hover:underline">{a.viewAll}</Link>}
        >
          {!configured ? (
            <ManageLink locale={locale} route="/dashboard/admin/students" label={a.manageStudents} />
          ) : recentStudents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {a.createdEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
              {recentStudents.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={s.full_name ?? "?"} src={s.avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{s.full_name ?? "—"}</p>
                    <p className="text-xs text-muted">
                      {a.joined} · {relativeTime(s.created_at, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="classes"
          title={configured ? a.recentClasses : d.classes}
          action={<AddLink locale={locale} route="/dashboard/admin/classes/new" label={a.add} />}
        >
          {!configured ? (
            <ManageLink locale={locale} route="/dashboard/admin/classes" label={a.manageClasses} />
          ) : recentClasses.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {a.createdEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
              {recentClasses.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{c.title}</p>
                    <p className="truncate text-xs text-muted">{c.teacherName ?? a.noTeacher}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[c.status] ?? "bg-sand text-ink-soft"}`}>
                    {statusLabel[c.status] ?? c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

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
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={pick(t.name, locale)} src={t.image} size={32} />
                      <span className="font-medium text-ink">{pick(t.name, locale)}</span>
                    </div>
                  </td>
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
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-ink-soft">
                      {languageLabel(c.language, locale)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{pick(c.level, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel
          id="announcements"
          title={configured ? a.recentAnnouncements : d.announcements}
          action={<AddLink locale={locale} route="/dashboard/admin/announcements/new" label={a.add} />}
        >
          {!configured ? (
            <ManageLink locale={locale} route="/dashboard/admin/announcements" label={a.manageAnnouncements} />
          ) : recentAnnouncements.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {a.createdEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
              {recentAnnouncements.slice(0, 4).map((post) => (
                <li key={post.id} className="px-5 py-3.5">
                  <p className="truncate font-medium text-ink">{post.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{relativeTime(post.created_at, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="journal"
          title={configured ? a.recentJournal : d.journal}
          action={<AddLink locale={locale} route="/dashboard/admin/journal/new" label={a.add} />}
        >
          {!configured ? (
            <ManageLink locale={locale} route="/dashboard/admin/journal" label={a.manageJournal} />
          ) : recentPosts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {a.createdEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
              {recentPosts.slice(0, 4).map((post) => (
                <li key={post.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <span className="truncate font-medium text-ink">{pick(post.title, locale)}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${post.published ? "bg-accent-wash text-accent-deep" : "bg-sand text-muted"}`}>
                    {post.published ? a.published : a.draft}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
