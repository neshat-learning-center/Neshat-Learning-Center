import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/** The yellow line that underlines the highlight word and curls into a quote tail. */
function HeroLine() {
  return (
    <svg
      viewBox="0 0 360 70"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-3 start-0 h-[0.7em] w-full overflow-visible"
    >
      <path
        d="M6 34 C 70 54, 150 54, 300 30 C 336 24, 348 30, 344 44 C 341 54, 326 55, 322 46 C 319 39, 328 30, 348 30"
        stroke="var(--color-accent)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="draw-path"
        style={{ ["--len" as string]: 760 }}
      />
    </svg>
  );
}

export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const isFa = locale === "fa";

  return (
    <section id="top" className="relative overflow-hidden">
      {/* The composition stays physically fixed left-to-right in both languages.
          Mirroring it for RTL made the character's pose read as an afterthought
          and the whole hero feel like the same template flipped — instead only
          the text block's own reading direction (set explicitly below) adapts. */}
      <div
        dir="ltr"
        className="container-editorial section-x relative flex flex-col pb-6 pt-8 md:pb-8 md:pt-10 lg:min-h-[82vh] lg:justify-center lg:py-10"
      >
        <div className="grid items-end gap-x-5 gap-y-10 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)] xl:gap-x-4 xl:grid-cols-[minmax(0,33%)_minmax(0,34%)_minmax(0,31%)]">
          {/* character — physically first, always the left/leading visual anchor */}
          <div className="relative order-2 flex justify-center lg:order-1 lg:justify-start">
            <Reveal
              delay={280}
              className="relative w-full max-w-[350px] sm:max-w-[440px] lg:max-w-[600px] xl:max-w-[660px] 2xl:max-w-[720px]"
            >
              <span className="absolute -bottom-2 start-8 -z-10 h-28 w-40 rounded-full bg-accent-tint/70 blur-2xl" />

              {/* small squiggle looping near her feet — draws itself in on load */}
              <svg
                viewBox="0 0 220 90"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-6 -start-8 h-auto w-28 sm:w-36 lg:w-44"
              >
                <path
                  d="M4 20 C 40 4, 70 4, 78 26 C 86 48, 60 56, 46 42 C 36 32, 46 20, 62 24 C 96 33, 130 60, 172 52 C 194 48, 208 34, 214 18"
                  stroke="var(--color-accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="draw-path"
                  style={{ ["--len" as string]: 520 }}
                />
              </svg>

              <Image
                src="/illustrations/neshat/hero-reading.png"
                alt=""
                width={1176}
                height={1029}
                priority
                className="illustration-float h-auto w-full drop-shadow-[0_28px_44px_rgba(38,37,40,0.16)]"
              />

              <p className="font-script absolute -top-2 start-2 -rotate-3 text-2xl text-ink sm:text-3xl">
                {dict.hero.captionBrighter}
              </p>
            </Reveal>
          </div>

          {/* text — physically second (right of the character); its own
              reading direction is restored per locale */}
          <div dir={isFa ? "rtl" : "ltr"} className="relative order-1 lg:order-2">
            <Reveal>
              <p className="eyebrow flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-accent" />
                {dict.hero.kicker}
              </p>
            </Reveal>

            <h1 className="mt-7 text-[clamp(2.4rem,5.2vw,4.4rem)] font-extrabold leading-[1.14] text-ink xl:text-[clamp(2.2rem,3.3vw,3.7rem)]">
              <Reveal as="span" className="block" delay={80}>
                {dict.hero.lineA}
              </Reveal>
              <Reveal as="span" className="relative mt-1 inline-block" delay={220}>
                <span className="relative z-10">{dict.hero.lineHighlight}</span>
                <HeroLine />
              </Reveal>
            </h1>

            <div className="mt-9">
              <Reveal delay={340}>
                <p className="max-w-[42ch] text-lg leading-relaxed text-ink-soft md:text-xl">
                  {dict.hero.sub}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button href={href(locale, "/placement")} variant="accent" arrow>
                    {dict.hero.ctaPrimary}
                  </Button>
                  <Button href={`${href(locale)}#courses`} variant="link" arrow>
                    {dict.hero.ctaSecondary}
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Shiraz illustration — desktop/PC only (lg+); below that, the
              character alone is the focal illustration */}
          <div className="relative order-3 hidden lg:col-span-2 lg:flex lg:flex-col lg:items-end lg:gap-3 xl:col-span-1">
            <Reveal delay={480}>
              <Image
                src="/illustrations/neshat/shiraz-columns.png"
                alt=""
                width={794}
                height={818}
                className="h-auto w-full max-w-[190px] opacity-90 sm:max-w-[230px] lg:max-w-[300px] xl:max-w-[340px] 2xl:max-w-[380px]"
              />
              <p className="font-script -mt-1 -rotate-2 text-end text-2xl text-ink-soft/60 xl:text-3xl">
                {dict.hero.captionShiraz}
              </p>
            </Reveal>

            {/* small vertical corner label — a normal sibling below the
                caption so it can never overlap it at any viewport width */}
            <div className="hidden flex-col items-end gap-1 xl:flex">
              {dict.hero.captionCorner.map((w) => (
                <span
                  key={w}
                  className="font-en text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* bottom hairline + scroll cue */}
      <div className="container-editorial section-x flex items-center justify-between pb-6">
        <div className="hair flex-1" />
        <span className="ms-6 flex items-center gap-2 text-xs text-muted">
          {dict.hero.scroll}
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
            <path
              d="M6 1v13M1 9l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </section>
  );
}
