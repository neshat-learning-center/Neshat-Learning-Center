import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCourses, getTeachers } from "@/lib/data/public";
import { PageHero } from "@/components/layout/PageHero";
import { CourseGrid } from "@/components/sections/CourseGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.pages.coursesTitle, description: dict.pages.coursesLead };
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const { lang } = await searchParams;
  const [courses, teachers] = await Promise.all([getCourses(), getTeachers()]);

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.coursesTitle }}
        label={dict.courses.label}
        title={dict.pages.coursesTitle}
        lead={dict.pages.coursesLead}
      />
      <section className="section-x py-14 md:py-20">
        <div className="container-editorial">
          <CourseGrid
            dict={dict}
            locale={l}
            courses={courses}
            teachers={teachers}
            initialFilter={lang ?? "all"}
          />
        </div>
      </section>
    </>
  );
}
