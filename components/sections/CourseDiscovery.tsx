"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Category } from "@/content/types";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Reveal } from "@/components/ui/Reveal";
import { InteractiveLanguageIllustration } from "@/components/illustrations/language/InteractiveLanguageIllustration";

export function CourseDiscovery({
  dict,
  locale,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  categories: Category[];
}) {
  // `selected` is the sticky choice (focus / tap); `hover` is temporary and
  // falls back to `selected` when the pointer leaves the list.
  const [selected, setSelected] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const pointer = useRef<string>("mouse");
  const active = hover ?? selected;
  const current = categories[active];

  // First tap on touch selects (shows the scene); tapping the selected item follows its link.
  const onTap = (e: React.MouseEvent, i: number) => {
    if (pointer.current !== "mouse" && i !== selected) {
      e.preventDefault();
      setSelected(i);
    }
  };
  // Focus caused by a press (touch focus arrives *after* pointerup) must not pre-select:
  // the click handler needs the old value. Keyboard focus should select.
  const lastPress = useRef(0);
  const track = (e: React.PointerEvent) => {
    pointer.current = e.pointerType;
    lastPress.current = e.timeStamp;
  };
  const onFocusItem = (e: React.FocusEvent, i: number) => {
    if (e.timeStamp - lastPress.current > 700) setSelected(i);
  };

  return (
    <section id="discover" className="section-x py-20 md:py-28">
      <div className="container-editorial">
        <SectionIntro label={dict.discovery.label} title={dict.discovery.title} lead={dict.discovery.lead} />

        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-8 md:mt-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12">
          {/* preview — first on mobile, trailing column on desktop */}
          <div className="order-1 md:order-2">
            <div className="relative overflow-hidden rounded-sm border border-line bg-sand md:sticky md:top-28">
              <div className="flex items-start justify-between px-5 pt-5 md:px-8 md:pt-7">
                <span key={current.slug} className="eyebrow animate-[fadeUp_0.4s_var(--ease-out-soft)]">
                  {pick(current.note, locale)}
                </span>
                <span dir="ltr" className="numeral text-xs text-muted">
                  {String(active + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
                </span>
              </div>

              <InteractiveLanguageIllustration active={current.slug} className="mx-auto mt-2 block w-full max-w-[34rem]" />

              <div className="flex items-end justify-between gap-4 px-5 pb-5 md:px-8 md:pb-7">
                <div key={current.slug} className="min-w-0 animate-[fadeUp_0.4s_var(--ease-out-soft)]" aria-live="polite">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 min-w-8 place-items-center rounded-full bg-accent px-2 font-en text-[0.7rem] font-extrabold text-slate">
                      {current.glyph}
                    </span>
                    <h3 className="text-2xl font-extrabold text-ink md:text-3xl">{pick(current.title, locale)}</h3>
                  </div>
                  <p className="mt-2 text-[0.95rem] text-ink-soft">{pick(current.tagline, locale)}</p>
                </div>
                <Link
                  href={href(locale, `/courses?filter=${current.slug}`)}
                  className="group inline-flex shrink-0 items-center gap-2 rounded-sm text-[0.95rem] font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-deep"
                >
                  <span className="bg-[linear-gradient(var(--color-accent),var(--color-accent))] bg-[length:100%_2px] bg-[position:0_100%] bg-no-repeat pb-1">
                    {dict.discovery.explore}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100">
                    <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* DESKTOP — index list */}
          <ul className="order-2 hidden flex-col md:order-1 md:flex" onMouseLeave={() => setHover(null)}>
            {categories.map((cat, i) => {
              const on = i === active;
              return (
                <li key={cat.slug}>
                  <Link
                    href={href(locale, `/courses?filter=${cat.slug}`)}
                    onPointerDown={track}
                    onMouseEnter={() => setHover(i)}
                    onFocus={(e) => onFocusItem(e, i)}
                    onClick={(e) => onTap(e, i)}
                    aria-current={on ? "true" : undefined}
                    className="group flex items-center justify-between border-b border-line py-5 outline-none transition-colors focus-visible:bg-accent-wash/60"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className={`numeral text-sm transition-colors ${on ? "text-accent-deep" : "text-muted"}`}>
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

          {/* MOBILE — chips rail under the preview */}
          <Reveal className="order-2 md:hidden">
            <div className="no-scrollbar -mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1">
              {categories.map((cat, i) => {
                const on = i === selected;
                return (
                  <Link
                    key={cat.slug}
                    href={href(locale, `/courses?filter=${cat.slug}`)}
                    onPointerDown={track}
                    onClick={(e) => onTap(e, i)}
                    onFocus={(e) => onFocusItem(e, i)}
                    aria-current={on ? "true" : undefined}
                    className={`flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors duration-300 ${
                      on ? "border-accent bg-accent text-slate" : "border-line bg-sand text-ink"
                    }`}
                  >
                    {pick(cat.title, locale)}
                  </Link>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
