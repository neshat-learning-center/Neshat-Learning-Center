import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { getEventBySlug, getEvents } from "@/lib/events/data";
import { dateParts, formatTimeRange, availability, eventPhase, splitByPhase, nowMs } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";
import { formatToman } from "@/lib/finance/money";
import { Reveal } from "@/components/ui/Reveal";
import { Countdown } from "@/components/events/Countdown";
import { RegisterButton } from "@/components/events/Register";
import { EventGallery } from "@/components/events/EventGallery";
import { toRegisterInfo } from "@/components/events/info";
import { EventImage, SeatMeter, AvailabilityBadge, Kicker, ArrowIcon, DateBlock, eventTitle, pickL, localDigits } from "@/components/events/shared";

// Events change from the admin at any time and the page shows live seats and countdowns: always read fresh.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const ev = await getEventBySlug(slug);
  if (!ev) return {};
  return { title: eventTitle(ev, locale), description: pickL(ev.summary, locale) || undefined, openGraph: ev.cover ? { images: [ev.cover] } : undefined };
}

export default async function EventDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const t = makeET(l);
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();

  const now = nowMs();
  const d = dateParts(ev.startsAt, l);
  const state = availability(ev, now);
  const phase = eventPhase(ev, now);
  const info = toRegisterInfo(ev, l, now);
  const venue = pickL(ev.venue, l);
  const paragraphs = (pickL(ev.description, l) || pickL(ev.summary, l)).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const reqs = ev.requirements ? (ev.requirements[l].length ? ev.requirements[l] : ev.requirements[l === "fa" ? "en" : "fa"]) : [];
  const program = ev.program.map((p) => ({ time: p.time, text: p[l] || p[l === "fa" ? "en" : "fa"] })).filter((p) => p.text);
  const dl = ev.deadline ? dateParts(ev.deadline, l) : null;
  const nowIso = new Date(now).toISOString();
  const galleryImages = ev.gallery.map((g) => ({ url: g.url, caption: g.caption }));

  const all = await getEvents();
  const related = splitByPhase(all.filter((e) => e.id !== ev.id && (!ev.category || e.category?.id === ev.category.id)), now).upcoming.slice(0, 3);

  const facts = [
    { k: t("date"), v: <><span className="block text-lg font-extrabold text-ink">{d.weekday} {d.day} {d.monthLong}</span><span className="text-ink-soft">{formatTimeRange(ev, l)}</span></> },
    { k: t("venue"), v: <><span className="block text-lg font-extrabold text-ink">{venue || "—"}</span><span className="text-ink-soft">{ev.address}</span></> },
    { k: t("price"), v: <><span className="block text-lg font-extrabold text-ink">{ev.isPaid ? formatToman(ev.price, l) : t("free")}</span>{ev.isPaid && <span className="text-ink-soft">{t("perPerson")}</span>}</> },
    { k: t("seats"), v: <SeatMeter ev={ev} l={l} /> },
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Event", name: eventTitle(ev, l), startDate: ev.startsAt, endDate: ev.endsAt ?? undefined,
    eventStatus: ev.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: venue || undefined, address: ev.address ?? undefined }, image: ev.cover ?? undefined,
    description: pickL(ev.summary, l) || undefined,
    offers: { "@type": "Offer", price: ev.isPaid ? ev.price : 0, priceCurrency: "IRR", availability: state === "open" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {ev.status === "cancelled" && <div className="bg-red-600 px-5 py-3 text-center text-sm font-bold text-white">{t("av_cancelled")}</div>}
      {phase === "past" && ev.status !== "cancelled" && (
        <div className="bg-slate px-5 py-3 text-center text-sm text-canvas">{t("av_past")} · <Link href={`${href(l, "/events")}#memories`} className="font-bold text-accent underline-offset-4 hover:underline">{t("secMemories")}</Link></div>
      )}

      {/* hero */}
      <section className="section-x pt-8 md:pt-12">
        <div className="container-editorial">
          <Link href={href(l, "/events")} className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowIcon className="rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />{t("backToEvents")}
          </Link>

          <div className="relative mt-8 lg:mt-10">
            <span aria-hidden className="absolute -bottom-4 -end-4 hidden h-1/2 w-1/3 bg-accent md:block" />
            <EventImage ev={ev} alt={eventTitle(ev, l)} priority className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]" />
            <div className="absolute start-0 top-0 bg-canvas px-5 pb-4 pt-5 md:px-8 md:pt-7"><DateBlock day={d.day} month={d.monthLong} size="lg" /></div>
          </div>

          <Reveal className="relative z-10 -mt-8 max-w-4xl bg-canvas pe-4 pt-7 sm:pe-10 lg:-mt-20 lg:ps-12 lg:pt-10">
            <div className="flex flex-wrap items-center gap-3">
              {ev.category && <span className="border border-ink px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-ink">{ev.category.title[l]}</span>}
              <AvailabilityBadge ev={ev} l={l} now={now} />
              {phase === "live" && <span className="flex items-center gap-2 text-xs font-bold text-accent-deep"><span className="ev-live h-2 w-2 rounded-full bg-accent" />{t("live")}</span>}
            </div>
            <h1 className="ev-display mt-5 text-[clamp(2.4rem,6.4vw,5.6rem)] leading-[1] text-ink">{eventTitle(ev, l)}</h1>
            {pickL(ev.summary, l) && <p className="mt-5 max-w-2xl text-xl leading-relaxed text-ink-soft">{pickL(ev.summary, l)}</p>}
          </Reveal>
        </div>
      </section>

      {/* key facts */}
      <section className="section-x mt-12 md:mt-16">
        <div className="container-editorial">
          <dl className="grid divide-y divide-line border-y-2 border-ink sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-x-reverse">
            {facts.map((f, i) => (
              <div key={f.k} className={`px-0 py-5 sm:px-6 ${i % 2 === 0 ? "sm:border-e sm:border-line lg:border-e-0" : ""} ${i > 1 ? "sm:border-t sm:border-line lg:border-t-0" : ""} lg:first:ps-0`}>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">{f.k}</dt>
                <dd className="mt-2 text-sm">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* body */}
      <section className="section-x py-14 pb-32 md:py-20 lg:pb-20">
        <div className="container-editorial grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 lg:col-span-8">
            <Reveal>
              <Kicker>{t("about")}</Kicker>
              <div className="mt-6 max-w-2xl space-y-5 text-lg leading-[1.9] text-ink-soft">
                {paragraphs.map((p, i) => <p key={i} className={i === 0 ? "text-xl text-ink" : ""}>{p}</p>)}
              </div>
            </Reveal>

            {program.length > 0 && (
              <Reveal className="mt-16">
                <Kicker>{t("program")}</Kicker>
                <ol className="relative mt-8 border-s-2 border-ink ps-8">
                  {program.map((p, i) => (
                    <li key={i} className="relative pb-8 last:pb-0">
                      <span aria-hidden className="absolute -start-[2.55rem] top-1.5 h-4 w-4 border-2 border-ink bg-accent" />
                      {p.time && <p className="ev-display text-2xl text-ink">{localDigits(p.time, l)}</p>}
                      <p className="mt-1 text-lg text-ink-soft">{p.text}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}

            {reqs.length > 0 && (
              <Reveal className="mt-16">
                <Kicker>{t("requirements")}</Kicker>
                <ul className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                  {reqs.map((r, i) => (
                    <li key={i} className="flex gap-3 border-t border-line pt-4 text-ink-soft">
                      <svg width="18" height="18" viewBox="0 0 18 18" className="mt-1 shrink-0 text-accent-deep" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 9.5l4 4 8-9" /></svg>
                      {r}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {(pickL(ev.organizer, l) || ev.mapUrl) && (
              <Reveal className="mt-16 grid gap-8 border-t-2 border-ink pt-8 sm:grid-cols-2">
                {pickL(ev.organizer, l) && (
                  <div><p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("organizer")}</p><p className="ev-display mt-2 text-2xl text-ink">{pickL(ev.organizer, l)}</p></div>
                )}
                {(venue || ev.address || ev.mapUrl) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("location")}</p>
                    <p className="mt-2 text-ink">{venue}{ev.address ? ` — ${ev.address}` : ""}</p>
                    {ev.mapUrl && <a href={ev.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block border-b-2 border-accent pb-0.5 text-sm font-bold text-ink hover:border-ink">{t("openMap")} ↗</a>}
                  </div>
                )}
              </Reveal>
            )}

            {galleryImages.length > 0 && (
              <Reveal className="mt-16">
                <Kicker>{t("gallery")}</Kicker>
                <div className="mt-8"><EventGallery images={galleryImages} title={eventTitle(ev, l)} meta={d.full} locale={l} /></div>
              </Reveal>
            )}
          </div>

          {/* registration panel */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <div className="border-2 border-ink">
                <div className="h-1.5 bg-accent" />
                <div className="p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">{t("price")}</p>
                  <p className="ev-display mt-1 text-4xl text-ink">{ev.isPaid ? formatToman(ev.price, l) : t("free")}</p>
                  {ev.isPaid && <p className="text-sm text-muted">{t("perPerson")}</p>}
                  <div className="mt-6"><SeatMeter ev={ev} l={l} /></div>
                  {dl && phase === "upcoming" && (
                    <div className="mt-6 border-t border-line pt-5 text-sm">
                      <p className="text-muted">{t("deadline")}</p>
                      <p className="font-bold text-ink">{dl.weekday} {dl.day} {dl.monthLong}</p>
                      {state === "open" || state === "waitlist" ? <div className="mt-3"><Countdown target={ev.deadline as string} nowIso={nowIso} locale={l} size="sm" /></div> : null}
                    </div>
                  )}
                  <div id="register" className="mt-7"><RegisterButton info={info} locale={l} state={state} /></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-x border-t border-line bg-sand/60 py-16">
          <div className="container-editorial">
            <Kicker>{t("related")}</Kicker>
            <ul className="mt-8 grid gap-x-10 md:grid-cols-3">
              {related.map((e) => {
                const p = dateParts(e.startsAt, l);
                return (
                  <li key={e.id} className="border-t-2 border-ink">
                    <Link href={href(l, `/events/${e.slug}`)} className="group flex items-baseline gap-4 py-5">
                      <span className="ev-display w-12 shrink-0 text-4xl text-ink">{p.day}</span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-muted">{p.monthLong}</span><span className="block truncate font-extrabold text-ink group-hover:text-accent-deep">{eventTitle(e, l)}</span></span>
                      <ArrowIcon className="shrink-0 text-ink transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <div aria-hidden className="h-20 lg:hidden" />
      {/* mobile sticky registration bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-canvas px-5 py-3 lg:hidden">
        <div className="flex items-center gap-4">
          <div className="shrink-0 leading-tight">
            <p className="text-[0.7rem] text-muted">{t("price")}</p>
            <p className="font-extrabold text-ink">{ev.isPaid ? formatToman(ev.price, l) : t("free")}</p>
          </div>
          <RegisterButton info={info} locale={l} state={state} className="min-w-0 flex-1 [&>button:last-child]:hidden [&>button:first-child]:w-full [&>button:first-child]:py-3" />
        </div>
      </div>
    </article>
  );
}
