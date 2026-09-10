import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { site } from "@/content/site";
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
  return { title: dict.pages.contactTitle, description: dict.pages.contactLead };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);

  const ways = [
    site.email && {
      label: dict.footer.contact,
      value: site.email,
      href: `mailto:${site.email}`,
      ltr: true,
    },
    ...(site.phones?.map((phone) => ({
      label: dict.pages.form.phone,
      value: phone,
      href: `tel:${phone}`,
      ltr: true,
    })) ?? []),
    {
      label: dict.footer.address,
      value: site.address ? pick(site.address, l) : pick(site.city, l),
      href: site.mapUrl,
      ltr: false,
    },
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr: boolean }[];

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.contactTitle }}
        label={dict.cta.secondary}
        title={dict.pages.contactTitle}
        lead={dict.pages.contactLead}
      />
      <section className="section-x py-14 md:py-20">
        <div className="container-editorial grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Reveal>
            <h2 className="eyebrow">{dict.pages.contactWays}</h2>
            <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
              {ways.map((w, i) => (
                <li key={i} className="flex items-center justify-between py-5">
                  <span className="text-sm text-muted">{w.label}</span>
                  {w.href ? (
                    <a
                      href={w.href}
                      dir={w.ltr ? "ltr" : undefined}
                      target={w.href.startsWith("http") ? "_blank" : undefined}
                      rel={w.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="font-medium text-ink hover:text-accent-deep"
                    >
                      {w.value}
                    </a>
                  ) : (
                    <span className="font-medium text-ink">{w.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <LeadForm dict={dict} locale={l} kind="contact" showLanguage />
          </Reveal>
        </div>
      </section>
    </>
  );
}
