import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getTeachers } from "@/lib/data/public";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { TeacherPortrait } from "@/components/ui/TeacherPortrait";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.pages.teachersTitle, description: dict.pages.teachersLead };
}

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const teachers = await getTeachers();

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.teachersTitle }}
        label={dict.teachers.label}
        title={dict.pages.teachersTitle}
        lead={dict.pages.teachersLead}
      />
      <section className="section-x py-14 md:py-20">
        <div className="container-editorial grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {teachers.map((t, i) => (
            <Reveal key={t.slug} delay={(i % 4) * 80}>
              <Link href={href(l, `/teachers/${t.slug}`)} className="group block">
                <TeacherPortrait teacher={t} locale={l} />
                <h3 className="mt-4 text-lg font-bold text-ink transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  {pick(t.name, l)}
                </h3>
                <p className="mt-1 text-sm text-muted">{pick(t.specialty, l)}</p>
                <p className="mt-2 border-t border-line pt-2 text-xs text-ink-soft">
                  {pick(t.languages, l)}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
