import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { LearningPortalIllustration } from "@/components/illustrations/LearningPortalIllustration";

export function StudentExperience({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { student } = dict;
  return (
    <section id="student" className="section-x py-20 md:py-28">
      <div className="container-editorial grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <Reveal>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-6 bg-accent" />
              {student.label}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-5 text-[clamp(1.9rem,4vw,3.4rem)] font-extrabold leading-[1.2] text-ink">
              {student.title}
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{student.lead}</p>
          </Reveal>
          <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {student.features.map((f, i) => (
              <Reveal as="li" key={f} delay={260 + i * 60}>
                <span className="flex items-center gap-3 text-base text-ink-soft">
                  <span className="numeral text-xs text-accent-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {f}
                </span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={520}>
            <div className="mt-10">
              <Button href={href(locale, "/login")} variant="solid" arrow>
                {student.cta}
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={160} className="lg:ps-8">
          <LearningPortalIllustration locale={locale} label={student.label} className="mx-auto max-w-[38rem]" />
        </Reveal>
      </div>
    </section>
  );
}
