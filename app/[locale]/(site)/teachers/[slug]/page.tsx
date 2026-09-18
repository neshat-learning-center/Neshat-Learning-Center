import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { teachers as seedTeachers } from "@/content/teachers";
import { getTeacherBySlug, getClassesByTeacher } from "@/lib/data/public";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { TeacherPortrait } from "@/components/ui/TeacherPortrait";

export function generateStaticParams() {
  return locales.flatMap((locale) => seedTeachers.map((t) => ({ locale, slug: t.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const teacher = await getTeacherBySlug(slug);
  if (!teacher) return {};
  return {
    title: pick(teacher.name, locale),
    description: pick(teacher.bio, locale) || pick(teacher.specialty, locale),
  };
}

export default async function TeacherProfile({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const teacher = await getTeacherBySlug(slug);
  if (!teacher) notFound();

  const classes = await getClassesByTeacher(teacher.slug);

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.teachersTitle, href: href(l, "/teachers") }}
        label={pick(teacher.specialty, l)}
        title={pick(teacher.name, l)}
      />

      <section className="section-x py-14 md:py-20">
        <div className="container-editorial grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="max-w-sm">
                <TeacherPortrait teacher={teacher} locale={l} />
              </div>
              <dl className="mt-6 flex flex-col divide-y divide-line border-y border-line">
                <div className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-muted">{dict.teachers.languages}</dt>
                  <dd className="font-medium text-ink">{pick(teacher.languages, l)}</dd>
                </div>
                <div className="flex items-center justify-between py-3 text-sm">
                  <dt className="text-muted">{dict.teachers.specialty}</dt>
                  <dd className="font-medium text-ink">{pick(teacher.specialty, l)}</dd>
                </div>
              </dl>
              <div className="mt-6">
                <Button href={href(l, "/contact")} variant="ghost" arrow>
                  {dict.pages.teacherContact}
                </Button>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <h2 className="text-2xl font-extrabold text-ink">{dict.pages.teacherAbout}</h2>
              <p className="mt-5 max-w-2xl text-lg leading-loose text-ink-soft">{pick(teacher.bio, l)}</p>
            </Reveal>

            {classes.length > 0 && (
              <div className="mt-14">
                <h3 className="eyebrow">{dict.pages.teacherClasses}</h3>
                <ul className="mt-5 flex flex-col">
                  {classes.map((c) => (
                    <li key={c.classId}>
                      <Link
                        href={href(l, `/courses/${c.courseSlug}`)}
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
        </div>
      </section>
    </>
  );
}
