"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import type { EventItem, EventCategory } from "@/lib/events/types";
import { dateParts, formatTimeRange } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";
import { Reveal } from "@/components/ui/Reveal";
import { EventImage, SeatMeter, AvailabilityBadge, ArrowIcon, DateBlock, eventTitle, pickL } from "./shared";

type Kind = "feature" | "pair" | "split" | "list" | "highlight";
interface Block { kind: Kind; items: EventItem[]; flip?: boolean }

const PATTERN: Kind[] = ["feature", "pair", "pair", "split", "list", "list", "list"];

/** Turns a flat list into a varied editorial sequence — never the same shape twice in a row. */
export function arrange(events: EventItem[]): Block[] {
  const blocks: Block[] = [];
  let p = 0;
  let flip = false;
  for (const ev of events) {
    if (ev.featured && blocks.length > 0) {
      blocks.push({ kind: "highlight", items: [ev] });
      continue;
    }
    const kind = PATTERN[p % PATTERN.length];
    p++;
    const last = blocks[blocks.length - 1];
    if (kind === "pair" && last?.kind === "pair" && last.items.length < 2) last.items.push(ev);
    else if (kind === "list" && last?.kind === "list" && last.items.length < 5) last.items.push(ev);
    else {
      if (kind === "split") flip = !flip;
      blocks.push({ kind, items: [ev], flip: kind === "split" ? flip : undefined });
    }
  }
  return blocks;
}

type P = { locale: Locale; now: number };

function Meta({ ev, locale }: { ev: EventItem; locale: Locale }) {
  const d = dateParts(ev.startsAt, locale);
  return (
    <p className="text-sm text-ink-soft">
      <span className="font-semibold text-ink">{d.weekday} {d.day} {d.monthLong}</span>
      <span className="mx-2 text-line-strong">/</span>
      {formatTimeRange(ev, locale)}
      {pickL(ev.venue, locale) && <><span className="mx-2 text-line-strong">/</span>{pickL(ev.venue, locale)}</>}
    </p>
  );
}

function CategoryChip({ ev, locale }: { ev: EventItem; locale: Locale }) {
  return ev.category ? <span className="text-xs font-bold uppercase tracking-wider text-accent-deep">{ev.category.title[locale]}</span> : null;
}

function MoreLink({ ev, locale }: { ev: EventItem; locale: Locale }) {
  const t = makeET(locale);
  return (
    <Link href={href(locale, `/events/${ev.slug}`)} className="group/l inline-flex items-center gap-2 text-sm font-bold text-ink">
      <span className="border-b-2 border-accent pb-0.5 transition-colors group-hover/l:border-ink">{t("viewDetails")}</span>
      <ArrowIcon className="transition-transform group-hover/l:translate-x-1 rtl:group-hover/l:-translate-x-1" />
    </Link>
  );
}

function FeatureBlock({ ev, locale, now }: { ev: EventItem } & P) {
  const d = dateParts(ev.startsAt, locale);
  return (
    <article className="group grid gap-y-6 border-t-2 border-ink pt-8 lg:grid-cols-12">
      <Link href={href(locale, `/events/${ev.slug}`)} className="relative lg:col-span-8" aria-label={eventTitle(ev, locale)}>
        <EventImage ev={ev} alt={eventTitle(ev, locale)} className="aspect-[4/3] w-full lg:aspect-[16/10]" />
        <div className="absolute start-0 top-0 bg-canvas px-4 pb-3 pt-4"><DateBlock day={d.day} month={d.monthLong} size="md" /></div>
      </Link>
      <div className="relative z-10 bg-canvas lg:col-span-4 lg:-ms-14 lg:mt-16 lg:p-8 lg:shadow-[0_0_0_1px_var(--color-line)]">
        <div className="flex flex-wrap items-center gap-3"><CategoryChip ev={ev} locale={locale} /><AvailabilityBadge ev={ev} l={locale} now={now} /></div>
        <h3 className="ev-display mt-4 text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.05] text-ink">{eventTitle(ev, locale)}</h3>
        <div className="mt-4"><Meta ev={ev} locale={locale} /></div>
        {pickL(ev.summary, locale) && <p className="mt-4 leading-relaxed text-ink-soft">{pickL(ev.summary, locale)}</p>}
        <div className="mt-5"><SeatMeter ev={ev} l={locale} /></div>
        <div className="mt-6"><MoreLink ev={ev} locale={locale} /></div>
      </div>
    </article>
  );
}

function PairItem({ ev, locale, now }: { ev: EventItem } & P) {
  return (
    <article className="group grid grid-cols-[40%_1fr] gap-5 border-t-2 border-ink pt-5 md:gap-7">
      <Link href={href(locale, `/events/${ev.slug}`)} aria-label={eventTitle(ev, locale)}>
        <EventImage ev={ev} alt="" className="aspect-[3/4] w-full" />
      </Link>
      <div className="flex min-w-0 flex-col">
        <CategoryChip ev={ev} locale={locale} />
        <h3 className="ev-display mt-2 text-[clamp(1.35rem,2.2vw,2rem)] leading-[1.1] text-ink">{eventTitle(ev, locale)}</h3>
        <div className="mt-3"><Meta ev={ev} locale={locale} /></div>
        {pickL(ev.summary, locale) && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">{pickL(ev.summary, locale)}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <AvailabilityBadge ev={ev} l={locale} now={now} />
          <MoreLink ev={ev} locale={locale} />
        </div>
      </div>
    </article>
  );
}

function SplitBlock({ ev, locale, now, flip }: { ev: EventItem; flip?: boolean } & P) {
  const d = dateParts(ev.startsAt, locale);
  return (
    <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
      <Link href={href(locale, `/events/${ev.slug}`)} aria-label={eventTitle(ev, locale)} className={`relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none ${flip ? "lg:order-2" : ""}`}>
        <span aria-hidden className={`absolute -bottom-4 h-full w-full rounded-t-full bg-accent ${flip ? "-start-4" : "-end-4"}`} />
        <EventImage ev={ev} alt={eventTitle(ev, locale)} className="aspect-[4/5] w-full rounded-t-full" />
      </Link>
      <div className="lg:col-span-7">
        <div className="flex items-end gap-6">
          <DateBlock day={d.day} month={d.monthLong} weekday={d.weekday} size="xl" />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3"><CategoryChip ev={ev} locale={locale} /><AvailabilityBadge ev={ev} l={locale} now={now} /></div>
        <h3 className="ev-display mt-3 max-w-xl text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.05] text-ink">{eventTitle(ev, locale)}</h3>
        <div className="mt-4"><Meta ev={ev} locale={locale} /></div>
        {pickL(ev.summary, locale) && <p className="mt-4 max-w-lg leading-relaxed text-ink-soft">{pickL(ev.summary, locale)}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="w-56"><SeatMeter ev={ev} l={locale} /></div>
          <MoreLink ev={ev} locale={locale} />
        </div>
      </div>
    </article>
  );
}

function ListBlock({ items, locale, now }: { items: EventItem[] } & P) {
  return (
    <ul className="border-t-2 border-ink">
      {items.map((ev) => {
        const d = dateParts(ev.startsAt, locale);
        return (
          <li key={ev.id} className="border-b border-line">
            <Link href={href(locale, `/events/${ev.slug}`)} className="group grid grid-cols-[4rem_1fr_auto] items-center gap-x-4 gap-y-1 py-5 transition-colors hover:bg-accent-wash md:grid-cols-[5.5rem_4.5rem_minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] md:gap-x-6 md:px-3">
              <div className="leading-none">
                <div className="ev-display text-4xl text-ink md:text-5xl">{d.day}</div>
                <div className="mt-1.5 text-xs font-semibold text-muted">{d.monthLong}</div>
              </div>
              <div className="ev-img hidden h-[4.5rem] w-[4.5rem] md:block"><EventImage ev={ev} alt="" className="h-full w-full" /></div>
              <div className="min-w-0">
                <CategoryChip ev={ev} locale={locale} />
                <h3 className="truncate text-lg font-extrabold text-ink md:text-xl">{eventTitle(ev, locale)}</h3>
                {pickL(ev.summary, locale) && <p className="mt-0.5 hidden truncate text-sm text-ink-soft md:block">{pickL(ev.summary, locale)}</p>}
                <p className="mt-1 text-xs text-muted md:hidden">{formatTimeRange(ev, locale)} · {pickL(ev.venue, locale)}</p>
              </div>
              <div className="hidden min-w-0 text-sm text-ink-soft md:block">
                <p className="font-medium text-ink">{formatTimeRange(ev, locale)}</p>
                <p className="truncate">{pickL(ev.venue, locale) || ev.address}</p>
              </div>
              <AvailabilityBadge ev={ev} l={locale} now={now} className="hidden md:inline-flex" />
              <span className="flex h-10 w-10 items-center justify-center border border-line-strong text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-canvas"><ArrowIcon /></span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function HighlightBlock({ ev, locale, now }: { ev: EventItem } & P) {
  const t = makeET(locale);
  const d = dateParts(ev.startsAt, locale);
  return (
    <article className="relative grid overflow-hidden bg-accent text-slate lg:grid-cols-12">
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -start-24 h-72 w-72 rounded-full border border-slate/20" />
      <div className="relative p-8 md:p-12 lg:col-span-7">
        <p className="inline-flex items-center gap-2 bg-slate px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
          <svg width="12" height="12" viewBox="0 0 22 22" aria-hidden><path d="M11 0l2.6 8.4L22 11l-8.4 2.6L11 22l-2.6-8.4L0 11l8.4-2.6z" fill="currentColor" /></svg>
          {t("secFeatured")}
        </p>
        <h3 className="ev-display mt-5 text-[clamp(2rem,4.2vw,3.8rem)] leading-[1.02]">{eventTitle(ev, locale)}</h3>
        <p className="mt-4 font-semibold">{d.full} · {formatTimeRange(ev, locale)}</p>
        <p className="text-slate/75">{pickL(ev.venue, locale)}</p>
        {pickL(ev.summary, locale) && <p className="mt-4 max-w-lg leading-relaxed text-slate/85">{pickL(ev.summary, locale)}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <AvailabilityBadge ev={ev} l={locale} now={now} className="!bg-slate !text-canvas !border-0" />
          <Link href={href(locale, `/events/${ev.slug}`)} className="inline-flex items-center gap-2 bg-slate px-6 py-3 text-sm font-bold text-canvas transition-colors hover:bg-canvas hover:text-slate">{t("viewDetails")}<ArrowIcon /></Link>
        </div>
      </div>
      <Link href={href(locale, `/events/${ev.slug}`)} aria-label={eventTitle(ev, locale)} className="relative min-h-72 lg:col-span-5"><EventImage ev={ev} alt="" className="absolute inset-0 h-full w-full" /></Link>
    </article>
  );
}

export function EventsExplorer({
  events, categories, locale, now,
}: { events: EventItem[]; categories: EventCategory[]; locale: Locale; now: number }) {
  const t = makeET(locale);
  const [active, setActive] = useState("all");
  const nf = (n: number) => n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) if (e.category) m.set(e.category.slug, (m.get(e.category.slug) ?? 0) + 1);
    return m;
  }, [events]);
  const shown = useMemo(() => (active === "all" ? events : events.filter((e) => e.category?.slug === active)), [events, active]);
  const blocks = useMemo(() => arrange(shown), [shown]);

  return (
    <section id="explore" className="section-x scroll-mt-32 py-20 md:py-28">
      <div className="container-editorial">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow flex items-center gap-3"><span className="inline-block h-px w-8 bg-accent" />{t("secExplore")}</p>
              <h2 className="ev-display mt-4 text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.02] text-ink">{t("secExplore")}</h2>
              <p className="mt-3 text-lg text-ink-soft">{t("secExploreLead")}</p>
            </div>
            <p className="ev-display text-7xl leading-none text-accent md:text-8xl" aria-hidden>{nf(shown.length)}</p>
          </div>
        </Reveal>

        <div className="mt-10 border-y border-line py-4">
          <div role="tablist" aria-label={t("category")} className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {[{ slug: "all", label: t("all"), count: events.length }, ...categories.map((c) => ({ slug: c.slug, label: c.title[locale], count: counts.get(c.slug) ?? 0 }))].map((c) => {
              const on = active === c.slug;
              return (
                <button key={c.slug} type="button" role="tab" aria-selected={on} onClick={() => setActive(c.slug)}
                  className={`shrink-0 border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${on ? "-translate-y-0.5 border-ink bg-ink text-canvas" : "border-line-strong text-ink-soft hover:-translate-y-0.5 hover:border-ink hover:text-ink"} ${c.count === 0 && !on ? "opacity-45" : ""}`}>
                  {c.label}
                  <sup className={`ms-1.5 text-[0.65rem] font-bold ${on ? "text-accent" : "text-muted"}`}>{nf(c.count)}</sup>
                </button>
              );
            })}
          </div>
        </div>

        <div key={active} className="ev-in mt-14 flex flex-col gap-16 md:gap-24">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center gap-5 border border-dashed border-line-strong py-20 text-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden><circle cx="28" cy="28" r="26" stroke="var(--color-line-strong)" strokeWidth="2" /><circle cx="28" cy="28" r="9" fill="var(--color-accent)" /></svg>
              <p className="max-w-sm text-ink-soft">{events.length === 0 ? t("emptyAll") : t("empty")}</p>
              {active !== "all" && <button type="button" onClick={() => setActive("all")} className="border-b-2 border-accent pb-0.5 text-sm font-bold text-ink">{t("all")}</button>}
            </div>
          ) : (
            blocks.map((b, i) =>
              b.kind === "feature" ? <FeatureBlock key={b.items[0].id} ev={b.items[0]} locale={locale} now={now} />
              : b.kind === "pair" ? (
                <div key={b.items[0].id} className="grid gap-12 md:grid-cols-2 md:gap-10">{b.items.map((e) => <PairItem key={e.id} ev={e} locale={locale} now={now} />)}</div>
              )
              : b.kind === "split" ? <SplitBlock key={b.items[0].id} ev={b.items[0]} flip={b.flip} locale={locale} now={now} />
              : b.kind === "highlight" ? <HighlightBlock key={b.items[0].id} ev={b.items[0]} locale={locale} now={now} />
              : <ListBlock key={`${b.items[0].id}-${i}`} items={b.items} locale={locale} now={now} />,
            )
          )}
        </div>
      </div>
    </section>
  );
}
