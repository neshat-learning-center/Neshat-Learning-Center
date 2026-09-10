import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { Post } from "@/content/types";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function Journal({
  dict,
  locale,
  posts,
}: {
  dict: Dictionary;
  locale: Locale;
  posts: Post[];
}) {
  const [feature, ...rest] = posts;
  return (
    <section id="journal" className="section-x py-20 md:py-28">
      <div className="container-editorial">
        <SectionIntro
          label={dict.journal.label}
          title={dict.journal.title}
          lead={dict.journal.lead}
          action={
            <Button href={href(locale, "/journal")} variant="ghost" arrow>
              {dict.journal.viewAll}
            </Button>
          }
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* feature */}
          <Reveal>
            <Link href={href(locale, `/journal/${feature.slug}`)} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-gradient-to-br from-sand to-sand-deep">
                <span className="absolute bottom-4 end-4 font-en text-7xl font-bold text-ink/10">01</span>
                <span className="absolute start-5 top-5 rounded-full bg-canvas/80 px-3 py-1 text-xs text-ink backdrop-blur">
                  {pick(feature.category, locale)}
                </span>
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-x-100" />
              </div>
              <h3 className="mt-6 text-[clamp(1.6rem,2.8vw,2.4rem)] font-extrabold leading-snug text-ink">
                {pick(feature.title, locale)}
              </h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
                {pick(feature.excerpt, locale)}
              </p>
              <p className="mt-4 text-sm text-muted">
                {feature.minRead} {dict.journal.minRead}
              </p>
            </Link>
          </Reveal>

          {/* list */}
          <ul className="flex flex-col">
            {rest.map((post, i) => (
              <Reveal as="li" key={post.slug} delay={i * 80}>
                <Link
                  href={href(locale, `/journal/${post.slug}`)}
                  className="group flex gap-5 border-t border-line py-6 last:border-b"
                >
                  <span className="numeral pt-1 text-sm text-muted">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs text-accent-deep">{pick(post.category, locale)}</span>
                    <h4 className="mt-1.5 text-xl font-bold leading-snug text-ink transition-colors group-hover:text-accent-deep">
                      {pick(post.title, locale)}
                    </h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                      {pick(post.excerpt, locale)}
                    </p>
                    <p className="mt-3 text-xs text-muted">
                      {post.minRead} {dict.journal.minRead}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
