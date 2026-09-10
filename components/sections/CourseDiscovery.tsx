"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Category } from "@/content/types";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Reveal } from "@/components/ui/Reveal";

export function CourseDiscovery({
  dict,
  locale,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  categories: Category[];
}) {
  const [active, setActive] = useState(0);
  const current = categories[active];

  return (
    <section id="discover" className="section-x py-20 md:py-28">
      <div className="container-editorial">
        <SectionIntro label={dict.discovery.label} title={dict.discovery.title} lead={dict.discovery.lead} />

        {/* DESKTOP — index list + live preview */}
        <div className="mt-14 hidden gap-12 md:grid md:grid-cols-[1.05fr_0.95fr]">
          <ul className="flex flex-col">
            {categories.map((cat, i) => {
              const on = i === active;
              return (
                <li key={cat.slug}>
                  <Link
                    href={href(locale, `/courses?lang=${cat.language}`)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className="group flex items-center justify-between border-b border-line py-5 transition-colors"
                  >
                    <span className="flex items-baseline gap-4">
                      <span
                        className={`numeral text-sm transition-colors ${on ? "text-accent-deep" : "text-muted"}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-[clamp(1.5rem,2.4vw,2.4rem)] font-bold leading-tight transition-all duration-300 ease-[var(--ease-out-soft)] ${
                          on ? "text-ink ps-2" : "text-ink/45"
                        }`}
                      >
                        {pick(cat.title, locale)}
                      </span>
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        on ? "scale-100 bg-accent" : "scale-0 bg-transparent"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* preview */}
          <div className="relative overflow-hidden rounded-sm border border-line bg-sand">
            <div className="flex h-full min-h-[24rem] flex-col justify-between p-8">
              <div className="flex items-start justify-between">
                <span className="eyebrow">{pick(current.note, locale)}</span>
                <span className="numeral text-xs text-muted">
                  {String(active + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
                </span>
              </div>

              <div key={current.slug} className="animate-[fadeUp_0.5s_var(--ease-out-soft)]">
                <span className="font-en text-[clamp(3rem,7vw,6rem)] font-bold leading-none tracking-tight text-ink/12">
                  {current.glyph}
                </span>
                <h3 className="mt-4 text-3xl font-extrabold text-ink">
                  {pick(current.title, locale)}
                </h3>
              </div>

              <Link
                href={href(locale, `/courses?lang=${current.language}`)}
                className="group inline-flex w-fit items-center gap-2 text-[0.95rem] font-medium text-ink"
              >
                <span className="bg-[linear-gradient(var(--color-accent),var(--color-accent))] bg-[length:100%_2px] bg-[position:0_100%] bg-no-repeat pb-1">
                  {dict.discovery.explore}
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5">
                  <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* MOBILE — horizontal snap rail */}
        <Reveal className="mt-10 md:hidden">
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={href(locale, `/courses?lang=${cat.language}`)}
                className="relative flex min-w-[15rem] snap-start flex-col justify-between rounded-sm border border-line bg-sand p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="numeral text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </div>
                <span className="mt-10 font-en text-5xl font-bold text-ink/12">{cat.glyph}</span>
                <h3 className="mt-3 text-xl font-bold text-ink">{pick(cat.title, locale)}</h3>
                <p className="mt-1 text-sm text-muted">{pick(cat.note, locale)}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
