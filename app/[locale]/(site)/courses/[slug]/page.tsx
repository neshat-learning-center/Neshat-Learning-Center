import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { courses as seedCourses } from "@/content/courses";
import type { Course } from "@/content/types";
import {
  getCourseBySlug,
  getTeacherBySlug,
  getRelatedCourses,
  languageLabel,
} from "@/lib/data/public";
import { getCourseIdBySlug, listEnrollableClasses } from "@/lib/data/enrollment";
import { enrollInClass, unenrollFromClass } from "@/lib/actions/enrollment";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

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

  const teacher = course.teacherSlug ? await getTeacherBySlug(course.teacherSlug) : undefined;
  const related = await getRelatedCourses(course.slug, course.language);

  const session = await getSession();
  const courseId = await getCourseIdBySlug(course.slug);
  const enrollableClasses = courseId
    ? await listEnrollableClasses(courseId, session?.role === "student" ? session.id : null)
    : [];
  const modeLabel =
    course.mode === "online"
      ? dict.common.online
      : course.mode === "offline"
        ? dict.common.offline
        : dict.common.both;

  const info: Array<{ label: string; value: string }> = [
    { label: dict.courses.language, value: languageLabel(course.language, l) },
    { label: dict.courses.level, value: pick(course.level, l) },
    { label: dict.courses.age, value: ageLabel(course.age, l) },
    { label: dict.courses.mode, value: modeLabel },
    ...(teacher ? [{ label: dict.courses.teacher, value: pick(teacher.name, l) }] : []),
    ...(course.schedule ? [{ label: dict.courses.schedule, value: pick(course.schedule, l) }] : []),
    ...(course.capacity != null
      ? [{ label: dict.courses.capacity, value: `${course.capacity} ${dict.courses.seats}` }]
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
            <Reveal>
              <h2 className="text-2xl font-extrabold text-ink">{dict.pages.aboutCourse}</h2>
              <p className="mt-5 max-w-2xl text-lg leading-loose text-ink-soft">
                {pick(course.summary, l)}
              </p>
            </Reveal>

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

                {session?.role === "student" ? (
                  <div className="mt-7">
                    <h4 className="eyebrow">{dict.pages.availableClasses}</h4>
                    {enrollableClasses.length === 0 ? (
                      <p className="mt-3 text-sm text-ink-soft">{dict.pages.noClassesScheduled}</p>
                    ) : (
                      <ul className="mt-4 flex flex-col gap-3">
                        {enrollableClasses.map((c) => (
                          <li key={c.id} className="rounded-md border border-line-strong bg-canvas p-4">
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="font-medium text-ink">{c.schedule ?? "—"}</span>
                              <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs text-ink-soft">
                                {c.mode === "online" ? dict.common.online : dict.common.offline}
                              </span>
                            </div>
                            {c.teacherName && <p className="mt-1 text-xs text-muted">{c.teacherName}</p>}
                            <div className="mt-3">
                              {c.enrolled ? (
                                <form action={unenrollFromClass.bind(null, l, course.slug, c.id)} className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-accent-deep">
                                    {dict.pages.enrolledAlready} ✓
                                  </span>
                                  <button type="submit" className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                                    {dict.pages.cancelEnrollment}
                                  </button>
                                </form>
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
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : !session ? (
                  <div className="mt-7">
                    <Button href={href(l, "/login")} variant="accent" arrow className="w-full justify-center">
                      {dict.pages.loginToEnroll}
                    </Button>
                    <Link
                      href={href(l, "/placement")}
                      className="mt-3 block text-center text-sm text-ink-soft hover:text-ink hover:underline"
                    >
                      {dict.pages.enroll}
                    </Link>
                  </div>
                ) : (
                  <div className="mt-7">
                    <Button href={href(l, "/placement")} variant="accent" arrow className="w-full justify-center">
                      {dict.pages.enroll}
                    </Button>
                  </div>
                )}
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
