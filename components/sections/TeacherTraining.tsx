import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function TeacherTraining({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { training } = dict;
  return (
    <section id="training" className="section-x py-8">
      <div className="container-editorial">
        <Reveal mask>
          <div className="relative overflow-hidden rounded-md border border-line bg-accent-wash px-7 py-14 md:px-16 md:py-24">
            {/* oversized faint glyph, breaking the grid at the edge */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 end-[-2%] select-none font-en text-[10rem] font-bold leading-none text-accent/25 md:text-[16rem]"
            >
              TTC
            </span>

            <div className="relative max-w-2xl">
              <p className="eyebrow flex items-center gap-3">
                <span className="inline-block h-px w-6 bg-accent-deep" />
                {training.label}
              </p>
              <h2 className="mt-6 text-[clamp(2rem,4.4vw,3.6rem)] font-extrabold leading-[1.25] text-ink">
                {training.title}
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{training.lead}</p>
              <div className="mt-9">
                <Button href={href(locale, "/teacher-training")} variant="solid" arrow>
                  {training.cta}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
