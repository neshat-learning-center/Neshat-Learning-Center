import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Category, Course } from "@/content/types";
import { href } from "@/lib/utils";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Button } from "@/components/ui/Button";
import { CourseGrid } from "./CourseGrid";

export function Courses({
  dict,
  locale,
  courses,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  courses: Course[];
  categories: Category[];
}) {
  return (
    <section id="courses" className="section-x py-20 md:py-28">
      <div className="container-editorial">
        <SectionIntro
          label={dict.courses.label}
          title={dict.courses.title}
          lead={dict.courses.lead}
          action={
            <Button href={href(locale, "/courses")} variant="ghost" arrow>
              {dict.courses.viewAll}
            </Button>
          }
          className="mb-12"
        />
        <CourseGrid dict={dict} locale={locale} courses={courses} categories={categories} />
      </div>
    </section>
  );
}
