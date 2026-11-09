import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import type { EventItem } from "@/lib/events/types";
import { nowMs, splitByPhase } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";
import { Reveal } from "@/components/ui/Reveal";
import { PhotoComposition } from "@/components/events/EventsHero";
import { pickHeroPhotos } from "@/components/events/info";
import { ArrowIcon } from "@/components/events/shared";

/**
 * Home-page doorway into Events & Experiences — the same art direction as the
 * Events hero (headline, layered photographs, floating tag), so the two always
 * match. The tag and photos come from real events; before there are any, a
 * quiet fallback message and editorial photographs are shown.
 */
export function EventsTeaser({ events, locale }: { events: EventItem[]; locale: Locale }) {
  const t = makeET(locale);
  const fa = locale === "fa";
  const now = nowMs();
  const { upcoming, past } = splitByPhase(events, now);
  const tagEvent = upcoming.find((e) => e.featured) ?? upcoming[0] ?? null;
  const photos = pickHeroPhotos(tagEvent, upcoming, past);

  return (
    <section id="events" className="section-x relative overflow-hidden border-y border-line bg-sand/40 py-20 md:py-28">
      <div className="container-editorial grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="relative lg:col-span-6 lg:pe-6">
          <span aria-hidden className="absolute -start-5 top-1 hidden h-24 w-[3px] bg-accent md:block lg:-start-8" />
          <Reveal><p className="eyebrow">{t("heroKicker")}</p></Reveal>
          <Reveal delay={80}>
            <h2 className={`ev-hero-title mt-6 text-ink ${fa ? "text-[clamp(2.8rem,5.6vw,5rem)]" : "text-[clamp(2.5rem,4.8vw,4.4rem)]"}`}>
              {fa ? (
                <>
                  {t("heroLine1")}
                  <br />
                  فراتر از{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">یادگیری</span>
                    <span aria-hidden className="absolute inset-x-[-0.04em] bottom-[0.14em] z-0 h-[0.3em] bg-accent/90" />
                  </span>
                </>
              ) : (
                <>
                  More Than Learning.
                  <br />A World of{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">Experiences.</span>
                    <span aria-hidden className="absolute inset-x-[-0.03em] bottom-[0.1em] z-0 h-[0.3em] bg-accent/90" />
                  </span>
                </>
              )}
            </h2>
          </Reveal>
          <Reveal delay={160}><p className="mt-7 max-w-md text-lg leading-[1.95] text-ink-soft">{t("heroLead")}</p></Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5">
            <Link href={href(locale, "/events")} className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden bg-ink px-9 py-[1.05rem] text-[0.95rem] font-bold text-canvas transition-colors duration-500 hover:text-slate sm:w-auto sm:justify-start">
              <span aria-hidden className="absolute inset-0 bg-accent transition-transform duration-500 ease-[var(--ease-out-soft)] ltr:-translate-x-full rtl:translate-x-full group-hover:translate-x-0" />
              <span className="relative">{t("explore")}</span>
              <ArrowIcon className="relative transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
            {past.length > 0 && (
              <Link href={`${href(locale, "/events")}#memories`} className="group inline-flex items-center gap-2 text-[0.95rem] font-semibold text-ink-soft transition-colors hover:text-ink">
                <span className="border-b border-ink/30 pb-0.5 transition-colors group-hover:border-accent">{t("heroMemories")}</span>
                <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            )}
          </Reveal>
        </div>

        <PhotoComposition locale={locale} tagEvent={tagEvent} now={now} photos={photos} className="lg:col-span-6" />
      </div>
    </section>
  );
}
