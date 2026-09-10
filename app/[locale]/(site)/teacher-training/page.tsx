import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.pages.trainingTitle, description: dict.pages.trainingLead };
}

export default async function TeacherTrainingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.training.label }}
        label={dict.training.label}
        title={dict.pages.trainingTitle}
        lead={dict.pages.trainingLead}
      />

      <section className="section-x py-14 md:py-20">
        <div className="container-editorial">
          <ul className="grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-3">
            {dict.pages.trainingPoints.map((p, i) => (
              <Reveal as="li" key={p.t} delay={i * 90} className="bg-canvas">
                <div className="flex h-full flex-col gap-6 p-8 md:p-10">
                  <span className="numeral text-4xl text-accent-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-ink">{p.t}</h2>
                    <p className="mt-3 text-base leading-relaxed text-ink-soft">{p.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-14">
            <div className="rounded-md bg-slate px-7 py-12 text-center md:px-16 md:py-16">
              <h2 className="mx-auto max-w-2xl text-[clamp(1.6rem,3.2vw,2.6rem)] font-extrabold leading-snug text-canvas">
                {dict.training.cta}
              </h2>
              <div className="mt-8 flex justify-center">
                <Button href={href(l, "/contact")} variant="accent" arrow>
                  {dict.pages.teacherContact}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
