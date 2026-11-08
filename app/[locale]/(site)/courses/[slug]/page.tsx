import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { courses as seedCourses } from "@/content/courses";
import type { Course } from "@/content/types";
import {
  getCourseBySlug,
  getRelatedCourses,
  getBookBySlug,
  languageLabel,
  categoryLabel,
} from "@/lib/data/public";
import { getCourseIdBySlug, listEnrollableClasses } from "@/lib/data/enrollment";
import { enrollInClass, unenrollFromClass } from "@/lib/actions/enrollment";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { BookCover } from "@/components/ui/BookCover";

export function generateStaticParams() {
  return locales.flatMap((locale) => seedCourses.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: pick(course.title, locale),
    description: pick(course.summary, locale),
  };
}

const ageLabel = (age: Course["age"], locale: Locale) =>
  ({
    kids: { fa: "کودکان", en: "Kids" },
    teens: { fa: "نوجوانان", en: "Teens" },
    adults: { fa: "بزرگسالان", en: "Adults" },
  })[age][locale];

/** `start_date` is a bare "YYYY-MM-DD" calendar date, not a moment in time —
 * force UTC so it never shifts a day depending on the server's timezone. */
const formatStartDate = (isoDate: string, locale: Locale) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** `start_time`/`end_time` come back as "HH:MM:SS" — just trim the seconds. */
const formatTime = (time: string) => time.slice(0, 5);

const formatPrice = (price: number, locale: Locale, tomanLabel: string) =>
  `${price.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} ${tomanLabel}`;

const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="rtl:-scale-x-100">
    <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <span className="h-6 w-1 rounded-full bg-accent" />
    <h2 className="text-xl font-extrabold text-ink md:text-2xl">{children}</h2>
  </div>
);

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const related = await getRelatedCourses(course.slug, course.language);
  const books = course.bookSlugs?.length
    ? (await Promise.all(course.bookSlugs.map((s) => getBookBySlug(s)))).filter(
        (b): b is NonNullable<typeof b> => !!b,
      )
    : [];

  const session = await getSession();
  const courseId = await getCourseIdBySlug(course.slug);
  const enrollableClasses = courseId
    ? await listEnrollableClasses(courseId, session?.role === "student" ? session.id : null, l)
    : [];

  const fa = l === "fa";
  const T = (f: string, e: string) => (fa ? f : e);
  const nf = (n: number) => n.toLocaleString(fa ? "fa-IR" : "en-US");

  const meta: Array<{ label: string; value: string }> = [
    { label: dict.courses.level, value: pick(course.level, l) },
    { label: dict.courses.age, value: ageLabel(course.age, l) },
    ...(course.sessionsCount != null
      ? [{ label: dict.courses.sessionsCount, value: `${nf(course.sessionsCount)} ${dict.courses.sessions}` }]
      : []),
    { label: dict.courses.language, value: languageLabel(course.language, l) },
  ];

  const primaryBtn =
    "inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-slate shadow-[0_10px_24px_-12px_rgba(221,156,12,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-deep";

  const cta =
    session?.role === "student" ? (
      <a href="#classes" className={primaryBtn}>
        {dict.pages.availableClasses}
        <Arrow />
      </a>
    ) : !session ? (
      <Link href={href(l, "/login")} className={primaryBtn}>
        {dict.pages.loginToEnroll}
        <Arrow />
      </Link>
    ) : (
      <Link href={href(l, "/placement")} className={primaryBtn}>
        {dict.pages.enroll}
        <Arrow />
      </Link>
    );

  const trust: string[] = [
    T("آزمون تعیین سطح رایگان", "Free placement test"),
    T("کلاس حضوری و آنلاین", "In-person & online classes"),
    ...(books.length > 0
      ? [`${nf(books.length)} ${T("کتاب پیشنهادی", "recommended books")}`]
      : []),
  ];

  return (
    <>
      {/* ===== hero ===== */}
      <section className="section-x relative overflow-hidden border-b border-line bg-gradient-to-b from-accent-wash via-canvas to-canvas pb-12 pt-10 md:pb-16 md:pt-14">
        <span aria-hidden className="pointer-events-none absolute -top-28 -end-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 start-[-5rem] h-64 w-64 rounded-full bg-accent-tint/60 blur-3xl" />
        <div className="container-editorial relative">
          <Reveal>
            <nav className="flex items-center gap-2 text-sm text-muted">
              <Link href={href(l)} className="transition-colors hover:text-ink">{dict.pages.breadcrumbHome}</Link>
              <span className="text-line-strong">/</span>
              <Link href={href(l, "/courses")} className="transition-colors hover:text-ink">{dict.pages.coursesTitle}</Link>
            </nav>
          </Reveal>

          <div className="mt-8 max-w-3xl">
            <Reveal delay={80}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-slate">
                  {languageLabel(course.language, l)}
                </span>
                <span className="rounded-full border border-line-strong bg-paper/80 px-3 py-1 text-xs text-ink-soft">
                  {categoryLabel(course.category, l)}
                </span>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <h1 className="mt-5 text-[clamp(2.2rem,5.5vw,4.25rem)] font-extrabold leading-[1.12] text-ink">
                {pick(course.title, l)}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{pick(course.summary, l)}</p>
            </Reveal>
          </div>

          <Reveal delay={260}>
            <dl className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {meta.map((m) => (
                <div key={m.label} className="rounded-2xl border border-line bg-paper/80 px-5 py-4 shadow-sm backdrop-blur">
                  <dt className="text-xs text-muted">{m.label}</dt>
                  <dd className="mt-1 text-lg font-extrabold text-ink">{m.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="section-x py-12 pb-28 md:py-16 lg:pb-16">
        <div className="container-editorial grid items-start gap-10 lg:grid-cols-[1.6fr_0.8fr] lg:gap-14">
          <div className="min-w-0">
            {/* classes */}
            <div id="classes" className="scroll-mt-28">
              <SectionTitle>{dict.pages.availableClasses}</SectionTitle>

              {enrollableClasses.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-dashed border-line-strong bg-paper p-6 text-sm text-ink-soft">
                  {dict.pages.noClassesScheduled}
                </p>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {enrollableClasses.map((c) => {
                    const days = (c.schedule ?? "").split(/[،,]\s*/).filter(Boolean);
                    const left = c.capacity != null ? Math.max(0, c.capacity - c.enrolledCount) : null;
                    const pct = c.capacity ? Math.min(100, Math.round((c.enrolledCount / c.capacity) * 100)) : 0;
                    const low = left != null && left > 0 && left <= 3;
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col justify-between rounded-2xl border border-line bg-paper p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap gap-1.5">
                              {days.length > 0 ? (
                                days.map((d) => (
                                  <span key={d} className="rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-canvas">
                                    {d}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-muted">—</span>
                              )}
                            </div>
                            <span className="shrink-0 rounded-full bg-accent-wash px-3 py-1 text-xs font-medium text-accent-deep ring-1 ring-accent/30">
                              {c.mode === "online" ? dict.common.online : c.mode === "both" ? dict.common.both : dict.common.offline}
                            </span>
                          </div>

                          {c.startTime && (
                            <p className="mt-5 text-3xl font-extrabold tracking-tight text-ink" dir="ltr" style={{ textAlign: "start" }}>
                              {formatTime(c.startTime)}
                              {c.endTime && <span className="text-muted"> – {formatTime(c.endTime)}</span>}
                            </p>
                          )}

                          {c.teacherName && (
                            <div className="mt-5 flex items-center gap-3 rounded-xl bg-sand/70 p-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-slate">
                                {c.teacherName.trim().charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs text-muted">{dict.courses.teacher}</p>
                                <p className="truncate text-sm font-bold text-ink">{c.teacherName}</p>
                              </div>
                            </div>
                          )}

                          <dl className="mt-4 flex flex-col gap-2 text-sm">
                            {c.startDate && (
                              <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted">{dict.courses.startDate}</dt>
                                <dd className="font-medium text-ink">{formatStartDate(c.startDate, l)}</dd>
                              </div>
                            )}
                            {c.classroom && (
                              <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted">{dict.courses.classroom}</dt>
                                <dd className="font-medium text-ink">{c.classroom}</dd>
                              </div>
                            )}
                          </dl>

                          {c.capacity != null && (
                            <div className="mt-5">
                              <div className="flex items-center justify-between text-xs">
                                <span className={low ? "font-semibold text-accent-deep" : "text-muted"}>
                                  {left === 0
                                    ? dict.pages.classFull
                                    : `${nf(left ?? 0)} ${dict.courses.seats} ${T("باقی‌مانده", "left")}`}
                                </span>
                                <span className="text-muted">
                                  {nf(c.enrolledCount)}/{nf(c.capacity)}
                                </span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-deep">
                                <div
                                  className={`h-full rounded-full transition-all ${low || left === 0 ? "bg-accent-deep" : "bg-accent"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {c.onlineMeetingUrl && (
                            <a
                              href={c.onlineMeetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-block text-sm font-medium text-accent-deep hover:underline"
                            >
                              {dict.pages.joinOnlineClass} ↗
                            </a>
                          )}
                        </div>

                        {session?.role === "student" && (
                          <div className="mt-5">
                            {c.enrolled ? (
                              <form action={unenrollFromClass.bind(null, l, course.slug, c.id)} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-accent-deep">{dict.pages.enrolledAlready} ✓</span>
                                <button type="submit" className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                                  {dict.pages.cancelEnrollment}
                                </button>
                              </form>
                            ) : c.full ? (
                              <span className="block w-full rounded-full border border-line-strong px-5 py-2.5 text-center text-sm font-medium text-muted">
                                {dict.pages.classFull}
                              </span>
                            ) : (
                              <form action={enrollInClass.bind(null, l, course.slug, c.id)}>
                                <button type="submit" className={primaryBtn}>
                                  {dict.pages.enrollInClass}
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* books */}
            {books.length > 0 && (
              <div className="mt-16">
                <SectionTitle>{dict.courses.books}</SectionTitle>
                <div className="no-scrollbar -mx-5 mt-6 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
                  {books.map((b) => (
                    <Link
                      key={b.slug}
                      href={href(l, `/books/${b.slug}`)}
                      className="group w-40 shrink-0 snap-start rounded-2xl border border-line bg-paper p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg sm:w-auto"
                    >
                      <div className="overflow-hidden rounded-xl bg-sand/70 p-3">
                        <div className="mx-auto max-w-[8.5rem] transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-105">
                          <BookCover book={b} locale={l} />
                        </div>
                      </div>
                      <div className="px-1 pb-1 pt-4">
                        <h3 className="line-clamp-2 font-bold leading-snug text-ink transition-colors group-hover:text-accent-deep">
                          {pick(b.title, l)}
                        </h3>
                        <p className="mt-1.5 text-xs text-muted">
                          {languageLabel(b.language, l)} · {pick(b.level, l)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* related */}
            {related.length > 0 && (
              <div className="mt-16">
                <SectionTitle>{dict.pages.related}</SectionTitle>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {related.map((c) => (
                    <Link
                      key={c.slug}
                      href={href(l, `/courses/${c.slug}`)}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg"
                    >
                      <div className="min-w-0">
                        <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft">{pick(c.level, l)}</span>
                        <p className="mt-3 truncate text-lg font-extrabold text-ink transition-colors group-hover:text-accent-deep">
                          {pick(c.title, l)}
                        </p>
                        {c.price != null && (
                          <p className="mt-1 text-sm text-muted">{formatPrice(c.price, l, dict.courses.toman)}</p>
                        )}
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-ink transition-colors group-hover:bg-accent">
                        <Arrow />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== sticky enrolment card ===== */}
          <Reveal delay={120} className="hidden lg:block">
            <aside className="sticky top-28">
              <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-lg">
                <div className="h-1.5 bg-gradient-to-l from-accent to-accent-deep" />
                <div className="p-7">
                  {course.price != null && (
                    <>
                      <p className="text-xs text-muted">{dict.courses.price}</p>
                      <p className="mt-1 text-[2rem] font-extrabold leading-tight text-ink">
                        {nf(course.price)} <span className="text-base font-bold text-muted">{dict.courses.toman}</span>
                      </p>
                      {course.sessionsCount != null && (
                        <p className="mt-1 text-xs text-muted">
                          {nf(course.sessionsCount)} {dict.courses.sessions}
                        </p>
                      )}
                    </>
                  )}

                  <div className="mt-6">{cta}</div>
                  {session?.role !== "student" && (
                    <Link href={href(l, "/placement")} className="mt-3 block text-center text-sm text-ink-soft hover:text-ink hover:underline">
                      {T("نمی‌دانید کدام سطح؟ آزمون رایگان", "Not sure of your level? Free test")}
                    </Link>
                  )}

                  <ul className="mt-6 flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-soft">
                    {trust.map((x) => (
                      <li key={x} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.5 6.5l2.2 2.2L9.5 3.8" />
                          </svg>
                        </span>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* mobile sticky enrol bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-5 py-3 shadow-[0_-10px_30px_-18px_rgba(43,42,45,0.4)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-4">
          {course.price != null && (
            <div className="shrink-0">
              <p className="text-[0.7rem] text-muted">{dict.courses.price}</p>
              <p className="text-base font-extrabold text-ink">{formatPrice(course.price, l, dict.courses.toman)}</p>
            </div>
          )}
          <div className="flex-1">{cta}</div>
        </div>
      </div>
    </>
  );
}
