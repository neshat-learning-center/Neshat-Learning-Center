import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPosts } from "@/lib/data/public";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.pages.journalTitle, description: dict.pages.journalLead };
}

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const posts = await getPosts();

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.journalTitle }}
        label={dict.journal.label}
        title={dict.pages.journalTitle}
        lead={dict.pages.journalLead}
      />
      <section className="section-x py-14 md:py-20">
        <ul className="container-editorial flex flex-col">
          {posts.map((post, i) => (
            <Reveal as="li" key={post.slug} delay={(i % 3) * 70}>
              <Link
                href={href(l, `/journal/${post.slug}`)}
                className="group grid gap-4 border-t border-line py-8 last:border-b md:grid-cols-[auto_1fr_auto] md:items-baseline md:gap-10"
              >
                <span className="numeral text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <span className="text-xs text-accent-deep">{pick(post.category, l)}</span>
                  <h2 className="mt-2 text-[clamp(1.4rem,2.4vw,2.1rem)] font-extrabold leading-snug text-ink transition-colors group-hover:text-accent-deep">
                    {pick(post.title, l)}
                  </h2>
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-soft">
                    {pick(post.excerpt, l)}
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm text-muted">
                  {post.minRead} {dict.journal.minRead}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
