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
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
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

  const info: Array<{ label: string; value: string }> = [
    { label: dict.courses.language, value: languageLabel(course.language, l) },
    { label: dict.courses.category, value: categoryLabel(course.category, l) },
    { label: dict.courses.level, value: pick(course.level, l) },
    { label: dict.courses.age, value: ageLabel(course.age, l) },
    ...(course.sessionsCount != null
      ? [{ label: dict.courses.sessionsCount, value: `${course.sessionsCount.toLocaleString(l === "fa" ? "fa-IR" : "en-US")} ${dict.courses.sessions}` }]
      : []),
    ...(course.price != null
      ? [{ label: dict.courses.price, value: formatPrice(course.price, l, dict.courses.toman) }]
      : []),
  ];

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.coursesTitle, href: href(l, "/courses") }}
        label={languageLabel(course.language, l)}
        title={pick(course.title, l)}
        lead={pick(course.summary, l)}
      />

      <section className="section-x py-14 md:py-20">
        <div className="container-editorial grid gap-12 lg:grid-cols-[1.4fr_0.9fr] lg:gap-16">
          {/* about + related */}
          <div>
            {course.image && (
              <Reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.image}
                  alt={pick(course.title, l)}
                  className="mb-10 aspect-video w-full rounded-md border border-line object-cover"
                />
              </Reveal>
            )}

            <Reveal>
              <h2 className="text-2xl font-extrabold text-ink">{dict.pages.aboutCourse}</h2>
              <p className="mt-5 max-w-2xl text-lg leading-loose text-ink-soft">
                {pick(course.summary, l)}
              </p>
            </Reveal>

            <div className="mt-14">
              <h3 className="eyebrow">{dict.pages.availableClasses}</h3>
              {enrollableClasses.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">{dict.pages.noClassesScheduled}</p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {enrollableClasses.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between rounded-md border border-line-strong bg-sand p-6"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-lg font-bold text-ink">{c.schedule ?? "—"}</span>
                          <span className="shrink-0 rounded-full border border-line-strong bg-canvas px-3 py-1 text-xs text-ink-soft">
                            {c.mode === "online" ? dict.common.online : c.mode === "both" ? dict.common.both : dict.common.offline}
                          </span>
                        </div>

                        <dl className="mt-4 flex flex-col gap-2 text-sm">
                          {c.teacherName && (
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-muted">{dict.courses.teacher}</dt>
                              <dd className="font-medium text-ink">{c.teacherName}</dd>
                            </div>
                          )}
                          {c.startDate && (
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-muted">{dict.courses.startDate}</dt>
                              <dd className="font-medium text-ink">{formatStartDate(c.startDate, l)}</dd>
                            </div>
                          )}
                          {c.startTime && (
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-muted">{dict.courses.classTime}</dt>
                              <dd className="font-medium text-ink" dir="ltr">
                                {formatTime(c.startTime)}
                                {c.endTime && ` – ${formatTime(c.endTime)}`}
                              </dd>
                            </div>
                          )}
                          {c.classroom && (
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-muted">{dict.courses.classroom}</dt>
                              <dd className="font-medium text-ink">{c.classroom}</dd>
                            </div>
                          )}
                          {c.capacity != null && (
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-muted">{dict.courses.capacity}</dt>
                              <dd className="font-medium text-ink">
                                {c.enrolledCount}/{c.capacity} {dict.courses.seats}
                              </dd>
                            </div>
                          )}
                        </dl>

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
                              <span className="text-sm font-medium text-accent-deep">
                                {dict.pages.enrolledAlready} ✓
                              </span>
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
                              <button
                                type="submit"
                                className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-accent-deep"
                              >
                                {dict.pages.enrollInClass}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {session?.role !== "student" &&
                (!session ? (
                  <div className="mt-6 flex items-center gap-4">
                    <Button href={href(l, "/login")} variant="accent" arrow>
                      {dict.pages.loginToEnroll}
                    </Button>
                    <Link
                      href={href(l, "/placement")}
                      className="text-sm text-ink-soft hover:text-ink hover:underline"
                    >
                      {dict.pages.enroll}
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6">
                    <Button href={href(l, "/placement")} variant="accent" arrow>
                      {dict.pages.enroll}
                    </Button>
                  </div>
                ))}
            </div>

            {books.length > 0 && (
              <div className="mt-14">
                <h3 className="eyebrow">{dict.courses.books}</h3>
                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
                  {books.map((b, i) => (
                    <Reveal key={b.slug} delay={(i % 3) * 70}>
                      <Link href={href(l, `/books/${b.slug}`)} className="group block">
                        <div className="transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-2">
                          <BookCover book={b} locale={l} />
                        </div>
                        <h4 className="mt-4 font-bold text-ink transition-colors group-hover:text-accent-deep">
                          {pick(b.title, l)}
                        </h4>
                        <p className="mt-1 text-sm text-muted">
                          {languageLabel(b.language, l)} · {pick(b.level, l)}
                        </p>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="mt-14">
                <h3 className="eyebrow">{dict.pages.related}</h3>
                <ul className="mt-5 flex flex-col">
                  {related.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={href(l, `/courses/${c.slug}`)}
                        className="group flex items-center justify-between border-t border-line py-5 last:border-b"
                      >
                        <span className="text-lg font-bold text-ink transition-colors group-hover:text-accent-deep">
                          {pick(c.title, l)}
                        </span>
                        <span className="text-sm text-muted">{pick(c.level, l)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* sticky info card */}
          <Reveal delay={120}>
            <aside className="lg:sticky lg:top-28">
              <div className="rounded-md border border-line bg-sand p-7">
                <h3 className="eyebrow">{dict.pages.courseInfo}</h3>
                <dl className="mt-5 flex flex-col divide-y divide-line-strong">
                  {info.map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-3 text-sm">
                      <dt className="text-muted">{row.label}</dt>
                      <dd className="font-medium text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
