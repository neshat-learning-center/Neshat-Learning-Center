"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Category, Course } from "@/content/types";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { languageLabel, categoryLabel } from "@/lib/labels";
import { Reveal } from "@/components/ui/Reveal";

type Filter =
  | { key: string; label: string; kind: "all" }
  | { key: string; label: string; kind: "category"; filter: Category["filter"] }
  | { key: string; label: string; kind: "age"; value: Course["age"] };

export function CourseGrid({
  dict,
  locale,
  courses,
  categories,
  initialFilter = "all",
  limit,
}: {
  dict: Dictionary;
  locale: Locale;
  courses: Course[];
  categories: Category[];
  initialFilter?: string;
  /** cap on cards shown (applied after filtering) — used by the homepage */
  limit?: number;
}) {
  const [active, setActive] = useState(initialFilter);

  const badgeLabel = (course: Course) =>
    course.category !== "general" ? categoryLabel(course.category, locale) : languageLabel(course.language, locale);

  const formatPrice = (price: number) =>
    `${price.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} ${dict.courses.toman}`;

  const filters: Filter[] = [
    { key: "all", label: dict.courses.filtersAll, kind: "all" },
    ...categories.map((c): Filter => ({ key: c.slug, label: pick(c.title, locale), kind: "category", filter: c.filter })),
    { key: "age-kids", label: locale === "fa" ? "کودکان" : "Kids", kind: "age", value: "kids" },
    { key: "age-teens", label: locale === "fa" ? "نوجوانان" : "Teens", kind: "age", value: "teens" },
    { key: "age-adults", label: locale === "fa" ? "بزرگسالان" : "Adults", kind: "age", value: "adults" },
  ];

  const filtered = useMemo(() => {
    const f = filters.find((x) => x.key === active) ?? filters[0];
    if (f.kind === "all") return courses;
    if (f.kind === "age") return courses.filter((c) => c.age === f.value);
    return courses.filter((c) =>
      f.filter.by === "language" ? c.language === f.filter.value : c.category === f.filter.value,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, courses]);
  const shown = limit ? filtered.slice(0, limit) : filtered;

  return (
    <>
      <Reveal>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          {filters.map((f) => {
            const on = f.key === active;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[0.9rem] transition-all duration-300 ease-[var(--ease-out-soft)] ${
                  on
                    ? "border-ink bg-ink text-canvas"
                    : "border-line-strong text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      {shown.length === 0 ? (
        <p className="mt-10 text-muted">{dict.pages.empty}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {shown.map((course, i) => (
            <Reveal key={course.slug} delay={(i % 2) * 80}>
              <Link
                href={href(locale, `/courses/${course.slug}`)}
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line-strong bg-paper p-7 transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-ink/30 hover:shadow-[0_16px_32px_-20px_rgba(43,42,45,0.35)] md:p-8"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left rtl:origin-right scale-x-0 bg-accent transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-x-100"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 text-sm text-muted">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    {pick(course.level, locale)}
                  </span>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink-soft">
                    {badgeLabel(course)}
                  </span>
                </div>

                <h3 className="mt-8 text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold leading-snug text-ink">
                  {pick(course.title, locale)}
                </h3>
                <p className="mt-3 line-clamp-2 max-w-md text-base leading-relaxed text-ink-soft">
                  {pick(course.summary, locale)}
                </p>

                <div className="mt-8 flex items-end justify-between gap-4 border-t border-line pt-5">
                  <dl className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted">{dict.courses.age}</dt>
                      <dd className="mt-0.5 text-ink">
                        {{ kids: dict.common.kids, teens: dict.common.teens, adults: dict.common.adults }[course.age] ?? course.age}
                      </dd>
                    </div>
                    {course.sessionsCount != null && (
                      <div>
                        <dt className="text-xs text-muted">{dict.courses.sessionsCount}</dt>
                        <dd className="mt-0.5 text-ink">
                          {course.sessionsCount.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}
                        </dd>
                      </div>
                    )}
                    {course.price != null && (
                      <div>
                        <dt className="text-xs text-muted">{dict.courses.price}</dt>
                        <dd className="mt-0.5 font-bold text-ink">{formatPrice(course.price)}</dd>
                      </div>
                    )}
                  </dl>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100">
                      <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
