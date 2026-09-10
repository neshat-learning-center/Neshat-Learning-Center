import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, pick, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { posts as seedPosts } from "@/content/journal";
import { getPostBySlug } from "@/lib/data/public";
import { href } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function generateStaticParams() {
  return locales.flatMap((locale) => seedPosts.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: pick(post.title, locale),
    description: pick(post.excerpt, locale),
  };
}

export default async function Article({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const dict = getDictionary(l);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.body?.[l] ?? [pick(post.excerpt, l)];

  return (
    <>
      <PageHero
        locale={l}
        homeLabel={dict.pages.breadcrumbHome}
        crumb={{ label: dict.pages.journalTitle, href: href(l, "/journal") }}
        label={pick(post.category, l)}
        title={pick(post.title, l)}
        aside={
          <span className="text-sm text-muted">
            {post.minRead} {dict.journal.minRead}
          </span>
        }
      />

      <section className="section-x py-14 md:py-20">
        <article className="container-editorial container-editorial-2xl">
          <Reveal>
            <div className="aspect-[16/9] w-full rounded-sm bg-gradient-to-br from-sand to-sand-deep" />
          </Reveal>
          <div className="mt-10 flex flex-col gap-6">
            {paragraphs.map((para, i) => (
              <Reveal as="p" key={i} delay={i * 40} className="text-lg leading-loose text-ink-soft">
                {para}
              </Reveal>
            ))}
          </div>
          <div className="mt-12 border-t border-line pt-8">
            <Button href={href(l, "/journal")} variant="link" arrow>
              {dict.journal.viewAll}
            </Button>
          </div>
        </article>
      </section>
    </>
  );
}
