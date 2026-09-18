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
}: {
  dict: Dictionary;
  locale: Locale;
  courses: Course[];
  categories: Category[];
  initialFilter?: string;
}) {
  const [active, setActive] = useState(initialFilter);

  const badgeLabel = (course: Course) =>
    course.category !== "general" ? categoryLabel(course.category, locale) : languageLabel(course.language, locale);

  const filters: Filter[] = [
    { key: "all", label: dict.courses.filtersAll, kind: "all" },
    ...categories.map((c): Filter => ({ key: c.slug, label: pick(c.title, locale), kind: "category", filter: c.filter })),
    { key: "age-kids", label: locale === "fa" ? "کودکان" : "Kids", kind: "age", value: "kids" },
    { key: "age-teens", label: locale === "fa" ? "نوجوانان" : "Teens", kind: "age", value: "teens" },
    { key: "age-adults", label: locale === "fa" ? "بزرگسالان" : "Adults", kind: "age", value: "adults" },
  ];

  const shown = useMemo(() => {
    const f = filters.find((x) => x.key === active) ?? filters[0];
    if (f.kind === "all") return courses;
    if (f.kind === "age") return courses.filter((c) => c.age === f.value);
    return courses.filter((c) =>
      f.filter.by === "language" ? c.language === f.filter.value : c.category === f.filter.value,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, courses]);

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
        <div className="mt-8 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2">
          {shown.map((course, i) => (
            <Reveal key={course.slug} delay={(i % 2) * 80} className="bg-canvas">
              <Link
                href={href(locale, `/courses/${course.slug}`)}
                className="group relative flex h-full flex-col justify-between gap-8 p-7 transition-colors duration-300 hover:bg-sand/60 md:p-9"
              >
                {course.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.1]"
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-sm text-muted">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    {pick(course.level, locale)}
                  </span>
                  <span className="rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft">
                    {badgeLabel(course)}
                  </span>
                </div>

                <div className="relative">
                  <h3 className="text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold leading-snug text-ink">
                    {pick(course.title, locale)}
                  </h3>
                  <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-soft">
                    {pick(course.summary, locale)}
                  </p>
                </div>

                <div className="relative flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
                  <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted">{dict.courses.age}</dt>
                      <dd className="mt-0.5 text-ink">
                        {{ kids: dict.common.kids, teens: dict.common.teens, adults: dict.common.adults }[
                          course.age
                        ] ?? course.age}
                      </dd>
                    </div>
                    {course.bookSlugs && course.bookSlugs.length > 0 && (
                      <div>
                        <dt className="text-xs text-muted">{dict.courses.books}</dt>
                        <dd className="mt-0.5 text-ink">{course.bookSlugs.length}</dd>
                      </div>
                    )}
                  </dl>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent">
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
