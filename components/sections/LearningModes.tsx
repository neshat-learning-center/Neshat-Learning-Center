import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionIntro } from "@/components/ui/SectionIntro";

export function LearningModes({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { modes } = dict;
  return (
    <section id="modes" className="section-x py-20 md:py-28">
      <div className="container-editorial">
        <SectionIntro
          label={modes.label}
          title={modes.title}
          titleClassName="max-w-3xl"
          action={
            <Button href={href(locale, "/classes")} variant="ghost" arrow>
              {modes.viewAll}
            </Button>
          }
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 md:gap-6">
          {/* offline */}
          <Reveal>
            <article className="flex h-full flex-col justify-between rounded-sm border border-line bg-canvas p-8 md:p-10">
              <div className="flex items-start justify-between">
                <span className="numeral text-5xl text-ink/15">01</span>
                <span className="rounded-full border border-line-strong px-3 py-1 text-xs text-ink-soft">
                  {dict.common.offline}
                </span>
              </div>
              <div className="mt-16">
                <h3 className="text-2xl font-extrabold text-ink md:text-3xl">{modes.offlineName}</h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-soft">{modes.offlineDesc}</p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {modes.offlinePoints.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-ink-soft">
                      <span className="h-px w-4 bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>

          {/* online */}
          <Reveal delay={100}>
            <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-sm border border-accent/40 bg-accent-wash p-8 md:p-10">
              <div className="flex items-start justify-between">
                <span className="numeral text-5xl text-accent-deep/30">02</span>
                <span className="flex items-center gap-2 rounded-full bg-slate px-3 py-1 text-xs text-canvas">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  {dict.common.online}
                </span>
              </div>
              <div className="mt-16">
                <h3 className="text-2xl font-extrabold text-ink md:text-3xl">{modes.onlineName}</h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-soft">{modes.onlineDesc}</p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {modes.onlinePoints.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-ink-soft">
                      <span className="h-px w-4 bg-accent-deep" />
                      {p}
                    </li>
                  ))}
                </ul>
                {/* the join-class entry point — real URL is configured per class in the dashboard */}
                <div className="mt-8">
                  <Button href={href(locale, "/login")} variant="solid" arrow>
                    {modes.joinClass}
                  </Button>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
