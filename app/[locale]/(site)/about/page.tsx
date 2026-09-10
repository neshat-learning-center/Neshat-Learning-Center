import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/utils";
import { site } from "@/content/site";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { CallToAction } from "@/components/sections/CallToAction";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.pages.aboutTitle, description: dict.pages.aboutLead };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const { why } = dict;

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.nav.about }}
        label={why.label}
        title={dict.pages.aboutTitle}
        lead={dict.pages.aboutLead}
      />

      {/* philosophy */}
      <section className="section-x py-14 md:py-20">
        <div className="container-editorial">
          <Reveal>
            <h2 className="max-w-3xl text-[clamp(1.8rem,3.6vw,3rem)] font-extrabold leading-[1.25] text-ink">
              {why.title}
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-2">
            {why.principles.map((p, i) => (
              <Reveal as="li" key={p.k} delay={i * 90} className="bg-canvas">
                <div className="flex h-full flex-col gap-6 p-8 md:p-10">
                  <span className="numeral text-4xl text-accent-deep">{p.k}</span>
                  <div>
                    <h3 className="text-xl font-extrabold text-ink md:text-2xl">{p.t}</h3>
                    <p className="mt-3 text-base leading-relaxed text-ink-soft">{p.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* visit + meet the teachers */}
      <section className="section-x pb-14 md:pb-20">
        <div className="container-editorial grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col justify-between rounded-md border border-line bg-canvas p-8 md:p-10">
              <div>
                <h3 className="text-xl font-extrabold text-ink md:text-2xl">
                  {dict.pages.aboutVisit}
                </h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-soft">
                  {dict.pages.aboutVisitLead}
                </p>
                <ul className="mt-6 flex flex-col gap-2">
                  {site.address && (
                    <li className="text-[0.95rem] font-medium text-ink">
                      {pick(site.address, l)}
                    </li>
                  )}
                  {site.phones?.map((phone) => (
                    <li key={phone}>
                      <Button href={`tel:${phone}`} variant="link" dir="ltr" className="w-fit">
                        {phone}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {site.mapUrl && (
                <div className="mt-8">
                  <Button
                    href={site.mapUrl}
                    variant="ghost"
                    arrow
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dict.pages.aboutVisitCta}
                  </Button>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex h-full flex-col justify-between rounded-md border border-line bg-sand/60 p-8 md:p-10">
              <div>
                <h3 className="text-xl font-extrabold text-ink md:text-2xl">
                  {dict.pages.teachersTitle}
                </h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-soft">
                  {dict.pages.aboutMeetLead}
                </p>
              </div>
              <div className="mt-8">
                <Button href={href(l, "/teachers")} variant="solid" arrow>
                  {dict.pages.aboutMeetCta}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CallToAction dict={dict} locale={l} />
    </>
  );
}
