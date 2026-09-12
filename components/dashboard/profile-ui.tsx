import type { ReactNode } from "react";

/** Editorial section header — numeral + title, matching the marketing site's
 *  typographic language, instead of a generic dashboard panel header. */
export function SectionBlock({
  id,
  index,
  title,
  action,
  children,
}: {
  id?: string;
  index?: number;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line pt-8 first:border-t-0 first:pt-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          {index != null && (
            <span className="numeral text-sm text-accent-deep">{String(index).padStart(2, "0")}</span>
          )}
          <h2 className="text-xl font-extrabold text-ink md:text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InfoCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-line bg-canvas p-6 transition-colors hover:border-line-strong ${className}`}
    >
      {children}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-deep">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-sand/30 p-8 text-center text-sm text-muted">
      {label}
    </div>
  );
}
