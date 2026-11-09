import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getEvents, getEventCategories } from "@/lib/events/data";
import { splitByPhase, dateParts, nowMs } from "@/lib/events/time";
import { makeET } from "@/lib/events/labels";
import { EventsHero } from "@/components/events/EventsHero";
import { EventsSubnav } from "@/components/events/EventsSubnav";
import { FeaturedEvent } from "@/components/events/FeaturedEvent";
import { EventsExplorer } from "@/components/events/EventsExplorer";
import { UpcomingBand } from "@/components/events/UpcomingBand";
import { Memories, type Memory } from "@/components/events/Memories";
import { pickL } from "@/components/events/shared";
import { pickHeroPhotos } from "@/components/events/info";

// Events change from the admin at any time and the page shows live seats and countdowns: always read fresh.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = makeET(isLocale(locale) ? locale : "fa");
  return { title: t("eventsTitle"), description: t("eventsMeta") };
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const t = makeET(l);
  const now = nowMs();

  const [events, categories] = await Promise.all([getEvents(), getEventCategories()]);
  const { upcoming, past } = splitByPhase(events, now);

  const featured = upcoming.find((e) => e.featured) ?? null;
  const next = upcoming[0] ?? null;
  const tagEvent = featured ?? next;
  const photos = pickHeroPhotos(tagEvent, upcoming, past);
  const after = upcoming.filter((e) => e.id !== next?.id).slice(0, 2);

  const memories: Memory[] = past.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: pickL(e.title, l),
    dateLabel: `${dateParts(e.startsAt, l).monthLong} ${dateParts(e.startsAt, l).year}`,
    summary: pickL(e.summary, l),
    images: [...(e.cover ? [{ url: e.cover, caption: null }] : []), ...e.gallery.map((g) => ({ url: g.url, caption: g.caption }))],
  }));

  const nav = [
    ...(featured ? [{ id: "featured", label: t("navFeatured") }] : []),
    { id: "explore", label: t("navExplore") },
    ...(next ? [{ id: "upcoming", label: t("navUpcoming") }] : []),
    ...(memories.length ? [{ id: "memories", label: t("navMemories") }] : []),
  ];

  return (
    <>
      <EventsHero locale={l} tagEvent={tagEvent} now={now} categories={categories} photos={photos} hasMemories={memories.length > 0} />
      <EventsSubnav items={nav} />
      {featured && <FeaturedEvent ev={featured} locale={l} now={now} />}
      <EventsExplorer events={upcoming} categories={categories} locale={l} now={now} />
      {next && <UpcomingBand ev={next} after={after} locale={l} now={now} />}
      {memories.length > 0 && <Memories memories={memories} locale={l} />}
    </>
  );
}
