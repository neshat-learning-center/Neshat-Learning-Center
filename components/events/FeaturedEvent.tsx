import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import type { EventItem } from "@/lib/events/types";
import { dateParts, formatTimeRange, availability } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";
import { formatToman } from "@/lib/finance/money";
import { Reveal } from "@/components/ui/Reveal";
import { Parallax } from "./Parallax";
import { RegisterButton } from "./Register";
import { toRegisterInfo } from "./info";
import { EventImage, SeatMeter, AvailabilityBadge, Kicker, ArrowIcon, DateBlock, eventTitle, pickL } from "./shared";

/**
 * The spotlight. Deliberately NOT a card: an oversized photograph, a yellow
 * block offset behind it, a date as a graphic, and a copy panel that overlaps
 * the image edge.
 */
export function FeaturedEvent({ ev, locale, now }: { ev: EventItem; locale: Locale; now: number }) {
  const t = makeET(locale);
  const d = dateParts(ev.startsAt, locale);
  const state = availability(ev, now);
  const deadline = ev.deadline ? dateParts(ev.deadline, locale) : null;

  const facts: { k: string; v: React.ReactNode }[] = [
    { k: t("date"), v: <>{d.full} · {formatTimeRange(ev, locale)}</> },
    { k: t("venue"), v: pickL(ev.venue, locale) || ev.address || "—" },
    { k: t("price"), v: ev.isPaid ? `${formatToman(ev.price, locale)} · ${t("perPerson")}` : t("free") },
    ...(deadline ? [{ k: t("deadline"), v: `${deadline.day} ${deadline.monthLong}` }] : []),
  ];

  return (
    <section id="featured" className="section-x scroll-mt-32 py-20 md:py-28">
      <div className="container-editorial">
        <Reveal><Kicker>{t("secFeatured")}</Kicker></Reveal>
        <div className="mt-10 grid items-start gap-y-12 lg:grid-cols-12">
          {/* photograph */}
          <Reveal className="relative lg:col-span-7">
            <span aria-hidden className="absolute -bottom-6 -start-6 hidden h-3/5 w-3/5 bg-accent md:block" />
            <Parallax speed={0.035}>
              <Link href={href(locale, `/events/${ev.slug}`)} aria-label={eventTitle(ev, locale)} className="relative block">
                <EventImage ev={ev} alt={eventTitle(ev, locale)} className="aspect-[4/5] w-full md:aspect-[6/5]" />
                <div className="absolute start-0 top-0 bg-canvas px-5 pb-4 pt-5 md:px-7 md:pt-6">
                  <DateBlock day={d.day} month={d.monthLong} size="lg" />
                </div>
              </Link>
            </Parallax>
          </Reveal>

          {/* copy panel overlapping the photo */}
          <Reveal delay={150} className="relative z-10 lg:col-span-5 lg:-ms-24 lg:mt-24">
            <div className="bg-canvas lg:p-10 lg:shadow-[0_0_0_1px_var(--color-line)]">
              <div className="flex flex-wrap items-center gap-3">
                {ev.category && <span className="border border-ink px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-ink">{ev.category.title[locale]}</span>}
                <AvailabilityBadge ev={ev} l={locale} now={now} />
              </div>
              <h2 className="ev-display mt-5 text-[clamp(2.2rem,4.6vw,4.2rem)] leading-[1.02] text-ink">{eventTitle(ev, locale)}</h2>
              {pickL(ev.summary, locale) && <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">{pickL(ev.summary, locale)}</p>}

              <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
                {facts.map((f) => (
                  <div key={f.k} className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">{f.k}</dt>
                    <dd className="text-end font-medium text-ink">{f.v}</dd>
                  </div>
                ))}
                <div className="py-4"><SeatMeter ev={ev} l={locale} /></div>
              </dl>

              <div className="mt-8 flex flex-wrap items-start gap-4">
                <RegisterButton info={toRegisterInfo(ev, locale, now)} locale={locale} state={state} className="min-w-[12rem]" />
                <Link href={href(locale, `/events/${ev.slug}`)} className="group inline-flex items-center gap-2 px-2 py-4 text-sm font-bold text-ink">
                  <span className="border-b-2 border-accent pb-0.5 group-hover:border-ink">{t("viewDetails")}</span>
                  <ArrowIcon className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
