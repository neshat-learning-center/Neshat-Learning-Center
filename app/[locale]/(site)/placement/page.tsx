import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { LeadForm } from "@/components/forms/LeadForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.pages.placementTitle, description: dict.pages.placementLead };
}

export default async function PlacementPage({
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
        crumb={{ label: dict.pages.placementTitle }}
        label={dict.nav.placement}
        title={dict.pages.placementTitle}
        lead={dict.pages.placementLead}
      />
      <section className="section-x py-14 md:py-20">
        <div className="container-editorial container-editorial-2xl">
          <Reveal>
            <LeadForm dict={dict} locale={l} kind="placement" showLanguage showLevel />
          </Reveal>
        </div>
      </section>
    </>
  );
}
