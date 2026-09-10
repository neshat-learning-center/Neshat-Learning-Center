import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

/**
 * Shared section intro (eyebrow + editorial title). Deliberately minimal so each
 * section can compose around it differently — avoids a repeating template.
 */
export function SectionIntro({
  label,
  title,
  lead,
  action,
  className,
  titleClassName,
}: {
  label: string;
  title: ReactNode;
  lead?: string;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-6 bg-accent" />
            {label}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h2
            className={cn(
              "mt-5 text-[clamp(1.9rem,4vw,3.4rem)] font-extrabold leading-[1.18] text-ink",
              titleClassName,
            )}
          >
            {title}
          </h2>
        </Reveal>
        {lead && (
          <Reveal delay={200}>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{lead}</p>
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal delay={260} className="shrink-0">
          {action}
        </Reveal>
      )}
    </div>
  );
}
