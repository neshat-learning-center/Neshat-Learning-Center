import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import type { EventItem, EventCategory } from "@/lib/events/types";
import { dateParts, availability } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowIcon, eventTitle } from "./shared";

/** Category names drifting past — an editorial ticker. LTR strip so the loop is identical in both languages. */
export function Marquee({ categories, locale }: { categories: EventCategory[]; locale: Locale }) {
  const names = categories.map((c) => c.title[locale] || c.title.en);
  if (names.length === 0) return null;
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center gap-10 pe-10" aria-hidden={k === "b"}>
      {names.map((n, i) => (
        <span key={i} className="flex items-center gap-10 whitespace-nowrap">
          <span className="ev-display text-2xl md:text-3xl text-ink">{n}</span>
          <svg width="22" height="22" viewBox="0 0 22 22" className="shrink-0 text-accent" aria-hidden><path d="M11 0l2.6 8.4L22 11l-8.4 2.6L11 22l-2.6-8.4L0 11l8.4-2.6z" fill="currentColor" /></svg>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-ink/80 py-5" dir="ltr">
      <div className="ev-marquee flex w-max">{row("a")}{row("b")}</div>
    </div>
  );
}

/** A tiny mark echoing the Neshat logo: nested arcs sweeping under a pen stroke. */
function NeshatGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 28" className={className} fill="none" aria-hidden>
      <path d="M2 26C2 12 12 2 26 2" stroke="var(--color-accent)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9 26c0-8 6-14 14-14" stroke="var(--color-slate)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 26c0-4 3-7 7-7" stroke="var(--color-accent)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M2 26.5h36" stroke="var(--color-slate)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Temporary artwork per placement, shown until an event has its own photos. */
const ARTWORK = {
  home: {
    main: { src: "/events/hero-conversation.jpg", w: 1056, h: 1408, focus: "50% 50%" },
    side: { src: "/events/hero-travel.jpg", w: 1056, h: 1408, focus: "50% 50%" },
    third: { src: "/events/hero-whiteboard.jpg", w: 1056, h: 1408, focus: "50% 36%" },
  },
  events: {
    main: { src: "/events/hero-events-cafe.jpg", w: 960, h: 1280, focus: "50% 50%" },
    side: { src: "/events/hero-events-map.jpg", w: 960, h: 1280, focus: "50% 46%" },
    third: { src: "/events/hero-events-photos.jpg", w: 960, h: 1280, focus: "50% 30%" },
  },
} as const;

type Slot = "main" | "side" | "third";
type Art = keyof typeof ARTWORK;

function Photo({ slot, art, url, alt, className, style }: { slot: Slot; art: Art; url?: string; alt: string; className: string; style?: React.CSSProperties }) {
  const a = ARTWORK[art][slot];
  return (
    <div className={`ev-photo absolute overflow-hidden bg-sand-deep ${className}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url ?? a.src} alt={alt}
        width={a.w} height={a.h} loading="eager" decoding="async"
        className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[var(--ease-out-soft)]"
        style={{ objectPosition: url ? undefined : a.focus }}
      />
    </div>
  );
}

/** The layered photographs + floating event tag, shared by the Events hero and the home-page teaser. */
export function PhotoComposition({
  locale, tagEvent, now, photos, art = "home", className = "",
}: { locale: Locale; tagEvent: EventItem | null; now: number; photos: string[]; art?: Art; className?: string }) {
  const t = makeET(locale);
  const d = tagEvent ? dateParts(tagEvent.startsAt, locale) : null;
  const state = tagEvent ? availability(tagEvent, now) : null;
  const open = state === "open" || state === "waitlist";
  const [main, side, third] = photos;
  return (
      <div className={`group/photos relative ${className}`}>
        <div className="relative mx-auto aspect-[1/1.08] w-full max-w-[34rem] sm:aspect-[1/0.95] lg:aspect-[1/1.08] lg:max-w-none">
          {/* thin offset frame */}
          <span aria-hidden className="absolute end-[-1.1rem] top-[3%] hidden h-[84%] w-[68%] border border-ink/25 sm:block" />

          <Photo slot="main" art={art} url={main} alt={t("heroAlt1")}
            className="end-0 top-[6%] h-[84%] w-[68%] [animation-delay:150ms] [&>img]:group-hover/photos:scale-[1.035]" />
          <Photo slot="side" art={art} url={side} alt={t("heroAlt2")}
            className="start-0 bottom-[3%] h-[34%] w-[44%] border-[6px] border-canvas [animation-delay:420ms] [&>img]:group-hover/photos:scale-[1.06]" />
          <Photo slot="third" art={art} url={third} alt={t("heroAlt3")}
            className="start-[7%] top-0 h-[27%] w-[27%] border-[6px] border-canvas [animation-delay:620ms] [&>img]:group-hover/photos:scale-[1.07]" />

          {/* category caption under the composition */}
          <p aria-hidden className="ev-rise absolute -bottom-8 end-0 hidden items-center gap-3 text-[0.62rem] font-semibold tracking-[0.3em] text-muted sm:flex" style={{ animationDelay: "900ms" }} dir="ltr">
            <span className="h-px w-8 bg-accent" />CULTURE · COMMUNITY · EXPERIENCE
          </p>

        </div>
        {/* floating event tag — real data only */}
        {tagEvent && d ? (
          <Link
            href={href(locale, `/events/${tagEvent.slug}`)}
            className="ev-rise group/tag relative z-10 mt-6 flex w-full gap-4 sm:absolute sm:bottom-[8%] sm:end-[2%] sm:mt-0 sm:w-[58%] sm:max-w-[17rem] border border-ink/80 bg-canvas p-4 transition-all duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:border-accent hover:shadow-[0_14px_30px_-18px_rgba(38,37,40,0.55)] sm:p-5"
            style={{ animationDelay: "1000ms" }}
          >
            <span className="flex shrink-0 flex-col items-center border-e border-accent pe-4 leading-none">
              <span className="ev-display text-[2.1rem] text-ink sm:text-[2.6rem]">{d.day}</span>
              <span className="mt-1.5 text-[0.7rem] font-bold text-ink-soft">{d.monthLong}</span>
            </span>
            <span className="min-w-0 flex-1">
              {tagEvent.category && <span className="block truncate text-[0.7rem] font-bold text-accent-deep">{tagEvent.category.title[locale]}</span>}
              <span className="mt-1 block text-[0.95rem] font-extrabold leading-snug text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden group-hover/tag:text-accent-deep">{eventTitle(tagEvent, locale)}</span>
              <span className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink-soft">
                <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-accent" : "bg-line-strong"}`} />
                {t(`av_${state}` as "av_open")}
              </span>
            </span>
          </Link>
        ) : (
          <div className="ev-rise relative z-10 mt-6 flex w-full items-center gap-3 sm:absolute sm:bottom-[8%] sm:end-[2%] sm:mt-0 sm:w-[58%] sm:max-w-[17rem] border border-ink/80 bg-canvas p-4 sm:p-5" style={{ animationDelay: "1000ms" }}>
            <span className="h-10 w-[3px] shrink-0 bg-accent" />
            <span className="min-w-0">
              <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted">{t("heroNoEvent")}</span>
              <span className="mt-1 block text-sm font-bold leading-snug text-ink">{t("heroNoEventLead")}</span>
            </span>
          </div>
        )}
      </div>
  );
}

/**
 * Events hero — an art-directed editorial spread: the headline and a short
 * invitation on one side; on the other, layered photographs (real event
 * photos when there are any, temporary editorial ones until then) with a small
 * floating tag that always reflects real database events.
 */
export function EventsHero({
  locale, tagEvent, now, categories, photos, hasMemories,
}: { locale: Locale; tagEvent: EventItem | null; now: number; categories: EventCategory[]; photos: string[]; hasMemories: boolean }) {
  const t = makeET(locale);
  const fa = locale === "fa";
  return (
    <section className="relative overflow-hidden">
      <div className="section-x pb-20 pt-10 md:pb-28 md:pt-16 lg:pb-32">
        <div className="container-editorial grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
          {/* ---- words ---- */}
          <div className="relative lg:col-span-6 lg:pe-6">
            <span aria-hidden className="absolute -start-5 top-1 hidden h-28 w-[3px] bg-accent md:block lg:-start-8" />
            <div className="ev-rise flex items-center gap-4" style={{ animationDelay: "60ms" }}>
              <NeshatGlyph className="h-6 w-9 shrink-0" />
              <p className="eyebrow">{t("evKicker")}</p>
            </div>

            <h1 className={`ev-hero-title mt-7 text-ink ${fa ? "text-[clamp(3rem,6.6vw,6.1rem)]" : "text-[clamp(2.7rem,5.5vw,5.1rem)]"}`}>
              <Reveal mask delay={120} className="block pb-[0.06em]">{t("evLine1")}</Reveal>
              <Reveal mask delay={260} className="block pb-[0.1em]">
                {t("evLine2Pre")}{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">{t("evLine2Mark")}</span>
                  <span aria-hidden className={`absolute z-0 h-[0.3em] bg-accent/90 ${fa ? "inset-x-[-0.04em] bottom-[0.14em]" : "inset-x-[-0.03em] bottom-[0.1em]"}`} />
                </span>
              </Reveal>
            </h1>

            <p className="ev-rise mt-8 max-w-md text-lg leading-[1.95] text-ink-soft md:text-xl md:leading-[1.9]" style={{ animationDelay: "520ms" }}>{t("evLead")}</p>

            <div className="ev-rise mt-10 flex flex-wrap items-center gap-x-9 gap-y-5" style={{ animationDelay: "680ms" }}>
              <a href="#explore" className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden sm:w-auto sm:justify-start bg-ink px-9 py-[1.05rem] text-[0.95rem] font-bold text-canvas transition-colors duration-500 hover:text-slate">
                <span aria-hidden className="absolute inset-0 -z-0 bg-accent transition-transform duration-500 ease-[var(--ease-out-soft)] ltr:-translate-x-full rtl:translate-x-full group-hover:translate-x-0" />
                <span className="relative">{t("explore")}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative transition-transform duration-500 group-hover:translate-y-0.5" aria-hidden><path d="M8 3v9M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              {hasMemories && (
                <a href="#memories" className="group inline-flex items-center gap-2 text-[0.95rem] font-semibold text-ink-soft transition-colors hover:text-ink">
                  <span className="border-b border-ink/30 pb-0.5 transition-colors group-hover:border-accent">{t("heroMemories")}</span>
                  <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </a>
              )}
            </div>
          </div>

          {/* ---- photographs ---- */}
          <PhotoComposition locale={locale} tagEvent={tagEvent} now={now} photos={photos} art="events" className="lg:col-span-6" />
        </div>
      </div>
      <Marquee categories={categories} locale={locale} />
    </section>
  );
}
