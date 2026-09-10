import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function CallToAction({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="section-x pb-8 pt-12">
      <div className="container-editorial">
        <Reveal mask>
          <div className="relative overflow-hidden rounded-lg bg-slate px-7 py-16 text-center md:px-16 md:py-28">
            {/* faint traveling line motif */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1200 200"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 top-1/2 h-40 w-full -translate-y-1/2 opacity-30"
            >
              <path
                d="M0 120 C 300 40, 500 180, 800 100 C 1000 50, 1100 140, 1200 90"
                stroke="var(--color-accent)"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-[clamp(2.2rem,5vw,4.2rem)] font-extrabold leading-[1.25] text-canvas">
                {dict.cta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-canvas/65">
                {dict.cta.lead}
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button href={href(locale, "/placement")} variant="accent" arrow>
                  {dict.cta.primary}
                </Button>
                <Button
                  href={href(locale, "/contact")}
                  variant="ghost"
                  className="border-canvas/25 text-canvas hover:border-canvas hover:bg-canvas/5"
                >
                  {dict.cta.secondary}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
