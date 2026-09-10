import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { StudentData } from "@/lib/dashboard/data";
import { Panel, Card, Progress, Empty } from "./primitives";

export function StudentOverview({ dict, data }: { dict: Dictionary; data: StudentData }) {
  const d = dict.dash;
  return (
    <div className="flex flex-col gap-12">
      {/* classes */}
      <Panel id="classes" title={d.myClasses}>
        {data.classes.length === 0 ? (
          <Empty label={d.empty} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.classes.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted">{c.teacher}</p>
                  </div>
                  <span className="rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-soft">
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
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                    <span>{d.progress}</span>
                    <span className="numeral">{c.progress}%</span>
                  </div>
                  <Progress value={c.progress} />
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
              </Card>
            ))}
          </div>
        )}
      </Panel>

      {/* schedule */}
      <Panel id="schedule" title={d.schedule}>
        {data.classes.length === 0 ? (
          <Empty label={d.empty} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
            {data.classes.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-4">
                <span className="font-medium text-ink">{c.title}</span>
                <span className="text-sm text-muted">{c.schedule}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* attendance */}
      <Panel id="attendance" title={d.attendance}>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-line bg-canvas p-5">
            <p className="numeral text-3xl font-bold text-ink">{data.attendance.present}</p>
            <p className="mt-1 text-sm text-muted">{d.present}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas p-5">
            <p className="numeral text-3xl font-bold text-ink">{data.attendance.absent}</p>
            <p className="mt-1 text-sm text-muted">{d.absent}</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas p-5">
            <p className="numeral text-3xl font-bold text-ink">{data.attendance.late}</p>
            <p className="mt-1 text-sm text-muted">{d.late}</p>
          </div>
        </div>
      </Panel>

      {/* materials */}
      <Panel id="materials" title={d.materials}>
        {data.materials.length === 0 ? (
          <Empty label={d.empty} />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-canvas">
            {data.materials.map((m, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-4">
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
      </Panel>

      {/* announcements */}
      <Panel id="announcements" title={d.announcements}>
        {data.announcements.length === 0 ? (
          <Empty label={d.empty} />
        ) : (
          <div className="flex flex-col gap-3">
            {data.announcements.map((a, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-ink">{a.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{a.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{a.when}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
