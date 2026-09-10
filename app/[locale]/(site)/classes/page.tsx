import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/utils";
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
  return { title: dict.pages.classesTitle, description: dict.pages.classesLead };
}

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const { modes, common } = dict;

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.nav.classes }}
        label={modes.label}
        title={dict.pages.classesTitle}
        lead={dict.pages.classesLead}
      />

      {/* offline */}
      <section className="section-x py-14 md:py-24">
        <div className="container-editorial grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="numeral text-6xl text-ink/15 md:text-7xl">01</span>
              <span className="rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft">
                {common.offline}
              </span>
            </div>
            <h2 className="mt-8 text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.2] text-ink">
              {modes.offlineName}
            </h2>
            <p className="mt-4 max-w-md text-xl leading-relaxed text-ink-soft">
              {modes.offlineDesc}
            </p>
            <div className="mt-8">
              <Button href={href(l, "/contact")} variant="ghost" arrow>
                {dict.pages.classesOfflineCta}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <ul className="flex flex-col gap-4">
              {modes.offlinePoints.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-4 rounded-md border border-line bg-canvas px-6 py-5 text-lg font-bold text-ink"
                >
                  <span className="h-px w-6 shrink-0 bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* online */}
      <section className="section-x pb-14 md:pb-24">
        <div className="container-editorial">
          <Reveal mask>
            <div className="rounded-lg border border-accent/40 bg-accent-wash px-7 py-12 md:px-14 md:py-16">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div>
                  <div className="flex items-center gap-4">
                    <span className="numeral text-6xl text-accent-deep/30 md:text-7xl">02</span>
                    <span className="flex items-center gap-2 rounded-full bg-slate px-3 py-1 text-xs text-canvas">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                      {common.online}
                    </span>
                  </div>
                  <h2 className="mt-8 text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.2] text-ink">
                    {modes.onlineName}
                  </h2>
                  <p className="mt-4 max-w-md text-xl leading-relaxed text-ink-soft">
                    {modes.onlineDesc}
                  </p>
                  <div className="mt-8">
                    <Button href={href(l, "/login")} variant="solid" arrow>
                      {modes.joinClass}
                    </Button>
                  </div>
                </div>

                <ul className="flex flex-col gap-4">
                  {modes.onlinePoints.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-4 rounded-md border border-accent/30 bg-canvas px-6 py-5 text-lg font-bold text-ink"
                    >
                      <span className="h-px w-6 shrink-0 bg-accent-deep" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal>
        <p className="section-x text-center text-lg text-ink-soft">{dict.pages.classesPrompt}</p>
      </Reveal>

      <CallToAction dict={dict} locale={l} />
    </>
  );
}
