import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import type { EventItem } from "@/lib/events/types";
import { dateParts, formatTimeRange, availability, isLimited, seatsLeft } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";
import { Reveal } from "@/components/ui/Reveal";
import { Countdown } from "./Countdown";
import { RegisterButton } from "./Register";
import { toRegisterInfo } from "./info";
import { SeatMeter, ArrowIcon, eventTitle, pickL } from "./shared";

/** "Coming up": the next event, counted down to the second, plus the two after it. */
export function UpcomingBand({ ev, after, locale, now }: { ev: EventItem; after: EventItem[]; locale: Locale; now: number }) {
  const t = makeET(locale);
  const d = dateParts(ev.startsAt, locale);
  const state = availability(ev, now);
  const nowIso = new Date(now).toISOString();
  const limited = isLimited(ev);
  const left = seatsLeft(ev);
  const dl = ev.deadline ? dateParts(ev.deadline, locale) : null;
  const deadlineSoon = ev.deadline && Date.parse(ev.deadline) - now < 7 * 86400_000 && Date.parse(ev.deadline) > now;
  const nf = (n: number) => n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");

  return (
    <section id="upcoming" className="relative scroll-mt-32 overflow-hidden bg-slate text-canvas">
      <span aria-hidden className="pointer-events-none absolute -bottom-40 -start-40 h-[26rem] w-[26rem] rounded-full border border-canvas/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-20 -start-20 h-[16rem] w-[16rem] rounded-full border border-canvas/10" />
      <div className="section-x relative py-20 md:py-28">
        <div className="container-editorial">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 !text-accent"><span className="inline-block h-px w-8 bg-accent" />{t("secUpcoming")} · {t("startsIn")}</p>
          </Reveal>

          <Reveal delay={100} className="mt-8"><Countdown target={ev.startsAt} nowIso={nowIso} locale={locale} tone="canvas" size="lg" /></Reveal>

          <div className="mt-14 grid gap-12 lg:grid-cols-12">
            <Reveal delay={150} className="lg:col-span-7">
              <Link href={href(locale, `/events/${ev.slug}`)} className="group block">
                <h2 className="ev-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.02] text-canvas transition-colors group-hover:text-accent">{eventTitle(ev, locale)}</h2>
              </Link>
              <p className="mt-4 text-lg text-canvas/70">{d.full} · {formatTimeRange(ev, locale)}</p>
              {(pickL(ev.venue, locale) || ev.address) && <p className="mt-1 text-canvas/60">{pickL(ev.venue, locale)}{ev.address ? ` — ${ev.address}` : ""}</p>}
              {pickL(ev.summary, locale) && <p className="mt-6 max-w-xl leading-relaxed text-canvas/75">{pickL(ev.summary, locale)}</p>}
            </Reveal>

            <Reveal delay={250} className="lg:col-span-5">
              <div className="border border-canvas/20 p-7 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  {limited && left != null && (
                    <span className="bg-accent px-2.5 py-1 text-xs font-bold text-slate">{t("limitedSeats")} · {nf(left)}</span>
                  )}
                  {state === "waitlist" && <span className="border border-accent px-2.5 py-1 text-xs font-bold text-accent">{t("av_waitlist")}</span>}
                </div>
                <div className="mt-5"><SeatMeter ev={ev} l={locale} tone="dark" /></div>
                {dl && (
                  <p className="mt-5 border-t border-canvas/15 pt-5 text-sm text-canvas/70">
                    {t("deadline")}: <b className="text-canvas">{dl.day} {dl.monthLong}</b>
                    {deadlineSoon && ev.deadline && (
                      <span className="mt-3 block"><span className="mb-1 block text-xs uppercase tracking-wider text-canvas/50">{t("closesIn")}</span><Countdown target={ev.deadline} nowIso={nowIso} locale={locale} tone="canvas" size="sm" /></span>
                    )}
                  </p>
                )}
                <div className="mt-7 flex flex-wrap gap-4">
                  <RegisterButton info={toRegisterInfo(ev, locale, now)} locale={locale} state={state} className="[&_button:first-child]:min-w-[11rem] [&>button:last-child]:text-canvas/70" />
                </div>
              </div>
            </Reveal>
          </div>

          {after.length > 0 && (
            <div className="mt-16 border-t border-canvas/15 pt-8">
              <ul className="grid gap-6 md:grid-cols-2">
                {after.map((e) => {
                  const p = dateParts(e.startsAt, locale);
                  return (
                    <li key={e.id}>
                      <Link href={href(locale, `/events/${e.slug}`)} className="group flex items-baseline gap-5">
                        <span className="ev-display w-14 shrink-0 text-4xl text-accent">{p.day}</span>
                        <span className="min-w-0 flex-1 border-b border-canvas/15 pb-4">
                          <span className="block text-xs uppercase tracking-wider text-canvas/50">{p.monthLong} · {p.weekday}</span>
                          <span className="mt-1 block truncate text-lg font-bold text-canvas group-hover:text-accent">{eventTitle(e, locale)}</span>
                        </span>
                        <ArrowIcon className="shrink-0 text-canvas/50 transition-transform group-hover:translate-x-1 group-hover:text-accent rtl:group-hover:-translate-x-1" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
