import type { Locale } from "@/lib/i18n/config";
import type { EventItem } from "@/lib/events/types";
import { seatsLeft, availability } from "@/lib/events/time";
import { pickL } from "./shared";
import type { RegisterInfo } from "./Register";

export function toRegisterInfo(ev: EventItem, l: Locale, now: number): RegisterInfo {
  return {
    id: ev.id,
    slug: ev.slug,
    title: pickL(ev.title, l),
    venue: pickL(ev.venue, l) || undefined,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    isPaid: ev.isPaid,
    price: ev.price,
    maxPerRegistration: ev.maxPerRegistration,
    seatsLeft: seatsLeft(ev),
    waitlist: availability(ev, now) === "waitlist",
  };
}

/** Hero photographs: real event photos first (the tagged event's own cover leads); the component fills any gaps with its editorial ones. */
export function pickHeroPhotos(tagEvent: EventItem | null, upcoming: EventItem[], past: EventItem[]): string[] {
  const pool = [tagEvent?.cover, ...upcoming.map((e) => e.cover), ...past.flatMap((e) => [e.cover, ...e.gallery.map((g) => g.url)])];
  return [...new Set(pool.filter((u): u is string => !!u))].slice(0, 3);
}
