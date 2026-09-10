"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Course, Teacher } from "@/content/types";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

type Filter =
  | { key: string; label: string; kind: "all" }
  | { key: string; label: string; kind: "lang"; value: Course["language"] }
  | { key: string; label: string; kind: "age"; value: Course["age"] };

export function CourseGrid({
  dict,
  locale,
  courses,
  teachers,
  initialFilter = "all",
}: {
  dict: Dictionary;
  locale: Locale;
  courses: Course[];
  teachers: Teacher[];
  initialFilter?: string;
}) {
  const [active, setActive] = useState(initialFilter);

  const teacherName = useMemo(() => {
    const map = new Map(teachers.map((t) => [t.slug, pick(t.name, locale)]));
    return (slug?: string) => (slug ? map.get(slug) : undefined);
  }, [teachers, locale]);

  const filters: Filter[] = [
    { key: "all", label: dict.courses.filtersAll, kind: "all" },
    { key: "english", label: locale === "fa" ? "انگلیسی" : "English", kind: "lang", value: "english" },
    { key: "german", label: locale === "fa" ? "آلمانی" : "German", kind: "lang", value: "german" },
    { key: "turkish", label: locale === "fa" ? "ترکی" : "Turkish", kind: "lang", value: "turkish" },
    { key: "kids", label: locale === "fa" ? "کودکان" : "Kids", kind: "age", value: "kids" },
    { key: "teens", label: locale === "fa" ? "نوجوانان" : "Teens", kind: "age", value: "teens" },
    { key: "adults", label: locale === "fa" ? "بزرگسالان" : "Adults", kind: "age", value: "adults" },
  ];

  const shown = useMemo(() => {
    const f = filters.find((x) => x.key === active) ?? filters[0];
    if (f.kind === "all") return courses;
    if (f.kind === "lang") return courses.filter((c) => c.language === f.value);
    return courses.filter((c) => c.age === f.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, courses]);

  const modeLabel = (mode: Course["mode"]) =>
    mode === "online" ? dict.common.online : mode === "offline" ? dict.common.offline : dict.common.both;

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
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-sm text-muted">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    {pick(course.level, locale)}
                  </span>
                  <span className="rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft">
                    {modeLabel(course.mode)}
                  </span>
                </div>

                <div>
                  <h3 className="text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold leading-snug text-ink">
                    {pick(course.title, locale)}
                  </h3>
                  <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-soft">
                    {pick(course.summary, locale)}
                  </p>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
                  <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    {teacherName(course.teacherSlug) && (
                      <div>
                        <dt className="text-xs text-muted">{dict.courses.teacher}</dt>
                        <dd className="mt-0.5 text-ink">{teacherName(course.teacherSlug)}</dd>
                      </div>
                    )}
                    {course.schedule && (
                      <div>
                        <dt className="text-xs text-muted">{dict.courses.schedule}</dt>
                        <dd className="mt-0.5 text-ink">{pick(course.schedule, locale)}</dd>
                      </div>
                    )}
                    {course.capacity != null && (
                      <div>
                        <dt className="text-xs text-muted">{dict.courses.capacity}</dt>
                        <dd className="mt-0.5 text-ink">
                          {course.capacity} {dict.courses.seats}
                        </dd>
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
