import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);

  const session = await getSession();
  if (session) redirect(href(l, "/dashboard"));

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.auth.title }}
        title={dict.auth.title}
        lead={dict.auth.lead}
      />
      <section className="section-x py-14 md:py-20">
        <div className="container-editorial container-editorial-md">
          <Reveal>
            <LoginForm dict={dict} locale={l} configured={isSupabaseConfigured()} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
