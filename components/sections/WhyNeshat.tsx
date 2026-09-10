import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function WhyNeshat({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { why } = dict;
  return (
    <section id="about" className="bg-sand py-20 md:py-32">
      <div className="container-editorial section-x">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* statement — sticky on desktop */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="eyebrow flex items-center gap-3">
                <span className="inline-block h-px w-6 bg-accent" />
                {why.label}
              </p>
            </Reveal>
            <Reveal delay={120}>
              <h2 className="mt-6 text-[clamp(2rem,4.4vw,3.6rem)] font-extrabold leading-[1.3] text-ink">
                {why.title}
              </h2>
            </Reveal>
            <Reveal delay={220}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">{why.lead}</p>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-8">
                <Button href={href(locale, "/about")} variant="ghost" arrow>
                  {why.viewAll}
                </Button>
              </div>
            </Reveal>
          </div>

          {/* principles */}
          <ul className="flex flex-col">
            {why.principles.map((p, i) => (
              <Reveal as="li" key={p.k} delay={i * 90}>
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line-strong py-8 md:py-10">
                  <span className="numeral text-lg text-accent-deep">{p.k}</span>
                  <div>
                    <h3 className="text-[clamp(1.8rem,3.4vw,2.75rem)] font-extrabold leading-tight text-ink">
                      {p.t}
                    </h3>
                    <p className="mt-3 max-w-md text-base leading-relaxed text-ink-soft">{p.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
