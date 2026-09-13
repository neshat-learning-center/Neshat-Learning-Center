import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { TeacherData } from "@/lib/dashboard/data";
import { href } from "@/lib/utils";
import { SectionBlock, InfoCard, EmptyState } from "./profile-ui";

export function TeacherOverview({
  dict,
  locale,
  data,
}: {
  dict: Dictionary;
  locale: Locale;
  data: TeacherData;
}) {
  const d = dict.dash;
  const h = dict.homework;
  return (
    <div className="flex flex-col gap-14">
      <SectionBlock id="classes" index={1} title={d.classes}>
        {data.classes.length === 0 ? (
          <EmptyState label={d.empty} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {data.classes.map((c) => (
              <InfoCard key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink">{c.title}</h3>
                  <span className="shrink-0 rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-soft">
                    {c.mode === "online" ? dict.common.online : dict.common.offline}
                  </span>
                </div>
                <dl className="mt-4 flex items-center gap-6 text-sm">
                  <div>
                    <dt className="text-xs text-muted">{d.students}</dt>
                    <dd className="numeral text-ink">{c.students}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{d.schedule}</dt>
                    <dd className="text-ink">{c.schedule}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-center gap-5">
                  <Link
                    href={href(locale, `/dashboard/attendance/${c.id}`)}
                    className="text-sm font-medium text-accent-deep hover:underline"
                  >
                    {d.markAttendance}
                  </Link>
                  <Link
                    href={href(locale, `/dashboard/classes/${c.id}`)}
                    className="text-sm font-medium text-ink-soft hover:text-ink hover:underline"
                  >
                    {h.manageClass}
                  </Link>
                </div>
              </InfoCard>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock id="students" index={2} title={d.students}>
        {data.students.length === 0 ? (
          <EmptyState label={d.empty} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-canvas">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="px-6 py-3 text-start font-medium">{d.name}</th>
                  <th className="px-6 py-3 text-start font-medium">{d.classes}</th>
                  <th className="px-6 py-3 text-start font-medium">{d.level}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.students.map((s, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.klass}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>

      <SectionBlock id="homework" index={3} title={h.title}>
        {data.homework.length === 0 ? (
          <EmptyState label={h.noHomework} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
            {data.homework.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.title}</p>
                  <p className="truncate text-xs text-muted">
                    {item.classTitle}
                    {item.dueDate ? ` · ${h.dueDate}: ${item.dueDate}` : ""}
                  </p>
                </div>
                <Link
                  href={href(locale, `/dashboard/homework/${item.id}`)}
                  className="shrink-0 text-sm font-medium text-accent-deep hover:underline"
                >
                  {h.viewSubmissions}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      <SectionBlock id="materials" index={4} title={d.materials}>
        {data.materials.length === 0 ? (
          <EmptyState label={d.empty} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
            {data.materials.map((m, i) => (
              <li key={i} className="flex items-center justify-between px-6 py-4">
                <span className="flex items-center gap-3 text-ink">
                  <span className="rounded bg-accent-wash px-2 py-0.5 text-xs font-medium uppercase text-accent-deep">
                    {m.kind}
                  </span>
                  {m.title}
                </span>
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-deep hover:underline">
                    {dict.admin.download}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      <SectionBlock id="announcements" index={5} title={d.announcements}>
        {data.announcements.length === 0 ? (
          <EmptyState label={d.empty} />
        ) : (
          <div className="flex flex-col gap-3">
            {data.announcements.map((a, i) => (
              <InfoCard key={i}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-ink">{a.title}</h3>
                    {a.body && <p className="mt-1 text-sm text-ink-soft">{a.body}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{a.when}</span>
                </div>
              </InfoCard>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock id="scores" index={6} title={h.scores}>
        {data.scores.length === 0 ? (
          <EmptyState label={h.noScoresYet} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-canvas">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="px-6 py-3 text-start font-medium">{h.student}</th>
                  <th className="px-6 py-3 text-start font-medium">{h.title}</th>
                  <th className="px-6 py-3 text-start font-medium">{h.class}</th>
                  <th className="px-6 py-3 text-start font-medium">{h.grade}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.scores.map((s) => (
                  <tr key={s.submissionId}>
                    <td className="px-6 py-3 font-medium text-ink">{s.studentName}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.homeworkTitle}</td>
                    <td className="px-6 py-3 text-ink-soft">{s.classTitle}</td>
                    <td className="numeral px-6 py-3 font-bold text-accent-deep">{s.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>
    </div>
  );
}
