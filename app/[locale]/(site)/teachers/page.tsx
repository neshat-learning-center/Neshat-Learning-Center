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
        <div className="container-editorial grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {teachers.map((t, i) => (
            <Reveal key={t.slug} delay={(i % 4) * 60}>
              <Link
                href={href(l, `/teachers/${t.slug}`)}
                className="group flex h-full flex-col overflow-hidden rounded-sm border border-line bg-canvas transition-colors duration-300 hover:border-ink/25"
              >
                <div className="p-3 pb-0">
                  <TeacherPortrait teacher={t} locale={l} />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-lg font-bold text-ink transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                    {pick(t.name, l)}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{pick(t.specialty, l)}</p>
                  {pick(t.languages, l) && (
                    <span className="mt-3 inline-block w-fit rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft">
                      {pick(t.languages, l)}
                    </span>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
