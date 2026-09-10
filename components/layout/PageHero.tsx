import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

/** Interior-page header: breadcrumb + oversized editorial title. */
export function PageHero({
  locale,
  homeLabel,
  crumb,
  label,
  title,
  lead,
  aside,
}: {
  locale: Locale;
  homeLabel: string;
  crumb?: { label: string; href?: string };
  label?: string;
  title: ReactNode;
  lead?: string;
  aside?: ReactNode;
}) {
  return (
    <section className="section-x border-b border-line pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="container-editorial">
        <Reveal>
          <nav className="flex items-center gap-2 text-sm text-muted">
            <Link href={href(locale)} className="transition-colors hover:text-ink">
              {homeLabel}
            </Link>
            {crumb && (
              <>
                <span className="text-line-strong">/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-ink">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink-soft">{crumb.label}</span>
                )}
              </>
            )}
          </nav>
        </Reveal>

        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            {label && (
              <Reveal delay={80}>
                <p className="eyebrow flex items-center gap-3">
                  <span className="inline-block h-px w-6 bg-accent" />
                  {label}
                </p>
              </Reveal>
            )}
            <Reveal delay={140}>
              <h1 className="mt-4 text-[clamp(2.2rem,5.5vw,4.5rem)] font-extrabold leading-[1.12] text-ink">
                {title}
              </h1>
            </Reveal>
            {lead && (
              <Reveal delay={220}>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{lead}</p>
              </Reveal>
            )}
          </div>
          {aside && (
            <Reveal delay={280} className="shrink-0">
              {aside}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
