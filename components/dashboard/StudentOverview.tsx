import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { StudentData } from "@/lib/dashboard/data";
import { SectionBlock, InfoCard, ProgressBar, EmptyState } from "./profile-ui";
import { HomeworkSubmitForm } from "./HomeworkSubmitForm";

export function StudentOverview({ dict, locale, data }: { dict: Dictionary; locale: Locale; data: StudentData }) {
  const d = dict.dash;
  const h = dict.homework;
  const classTitleById = new Map(data.classes.map((c) => [c.id, c.title]));

  return (
    <div className="flex flex-col gap-14">
      {/* classes */}
      <SectionBlock id="classes" index={1} title={d.myClasses}>
        {data.classes.length === 0 ? (
          <EmptyState label={d.empty} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {data.classes.map((c) => (
              <InfoCard key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted">{c.teacher}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-soft">
                    {c.mode === "online" ? dict.common.online : dict.common.offline}
                  </span>
                </div>
                <dl className="mt-4 flex items-center gap-6 text-sm">
                  <div>
                    <dt className="text-xs text-muted">{d.level}</dt>
                    <dd className="text-ink">{c.level}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{d.schedule}</dt>
                    <dd className="text-ink">{c.schedule}</dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                    <span>{d.progress}</span>
                    <span className="numeral">{c.progress}%</span>
                  </div>
                  <ProgressBar value={c.progress} />
                </div>
                {c.mode === "online" && c.onlineMeetingUrl && (
                  <a
                    href={c.onlineMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-accent-deep"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate/50" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate" />
                    </span>
                    {d.joinClass}
                  </a>
                )}
              </InfoCard>
            ))}
          </div>
        )}
      </SectionBlock>

      {/* homework */}
      <SectionBlock id="homework" index={2} title={h.title}>
        {data.homework.length === 0 ? (
          <EmptyState label={h.noHomework} />
        ) : (
          <div className="flex flex-col gap-4">
            {data.homework.map((item) => (
              <InfoCard key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">{classTitleById.get(item.classId)}</p>
                    <h3 className="mt-0.5 text-lg font-bold text-ink">{item.title}</h3>
                    {item.description && <p className="mt-1 text-sm text-ink-soft">{item.description}</p>}
                    {item.dueDate && (
                      <p className="mt-1 text-xs text-muted">
                        {h.dueDate}: {item.dueDate}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.grade != null
                        ? "bg-accent-wash text-accent-deep"
                        : item.submitted
                          ? "bg-sand text-ink-soft"
                          : "border border-line-strong text-muted"
                    }`}
                  >
                    {item.grade != null ? h.graded : item.submitted ? h.pendingReview : h.notSubmitted}
                  </span>
                </div>

                {item.grade != null && (
                  <div className="mt-4 rounded-md bg-accent-wash p-4">
                    <p className="text-sm font-bold text-accent-deep">
                      {h.grade}: <span className="numeral">{item.grade}</span>
                    </p>
                    {item.feedback && <p className="mt-1 text-sm text-ink-soft">{item.feedback}</p>}
                  </div>
                )}

                {item.fileUrl && (
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-accent-deep hover:underline">
                    {h.viewFile}
                  </a>
                )}

                <HomeworkSubmitForm dict={dict} locale={locale} homeworkId={item.id} classId={item.classId} alreadySubmitted={item.submitted} />
              </InfoCard>
            ))}
          </div>
        )}
      </SectionBlock>

      {/* schedule */}
      <SectionBlock id="schedule" index={3} title={d.schedule}>
        {data.classes.length === 0 ? (
          <EmptyState label={d.empty} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
            {data.classes.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-6 py-4">
                <span className="font-medium text-ink">{c.title}</span>
                <span className="text-sm text-muted">{c.schedule}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      {/* attendance */}
      <SectionBlock id="attendance" index={4} title={d.attendance}>
        <div className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-canvas rtl:divide-x-reverse">
          {[
            { label: d.present, value: data.attendance.present },
            { label: d.absent, value: data.attendance.absent },
            { label: d.late, value: data.attendance.late },
          ].map((stat) => (
            <div key={stat.label} className="p-6 text-center">
              <p className="numeral text-3xl font-extrabold text-ink">{stat.value}</p>
              <p className="mt-1 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* materials */}
      <SectionBlock id="materials" index={5} title={d.materials}>
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
                {m.url ? (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={dict.admin.download}
                    className="text-muted transition-colors hover:text-accent-deep"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8m0 0l3-3m-3 3L5 7M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-line-strong">
                    <path d="M8 2v8m0 0l3-3m-3 3L5 7M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      {/* announcements */}
      <SectionBlock id="announcements" index={6} title={d.announcements}>
        {data.announcements.length === 0 ? (
          <EmptyState label={d.empty} />
        ) : (
          <div className="flex flex-col gap-3">
            {data.announcements.map((a, i) => (
              <InfoCard key={i}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-ink">{a.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{a.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{a.when}</span>
                </div>
              </InfoCard>
            ))}
          </div>
        )}
      </SectionBlock>

      {/* scores */}
      <SectionBlock id="scores" index={7} title={h.scores}>
        {data.scores.length === 0 ? (
          <EmptyState label={h.noScoresYet} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
            {data.scores.map((s) => (
              <li key={s.submissionId} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{s.homeworkTitle}</p>
                  <p className="truncate text-xs text-muted">{s.classTitle}</p>
                </div>
                <span className="numeral shrink-0 text-lg font-extrabold text-accent-deep">{s.grade}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>
    </div>
  );
}
