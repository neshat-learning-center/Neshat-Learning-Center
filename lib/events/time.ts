import type { Locale } from "@/lib/i18n/config";
import type { EventItem } from "./types";

/**
 * Event times are stored as real instants (timestamptz) and always DISPLAYED
 * in Iran time (Asia/Tehran, UTC+3:30 year-round since 2022), so a visitor
 * abroad sees the same clock time the venue uses.
 */
const TZ = "Asia/Tehran";
const OFFSET = "+03:30";

/** "2026-11-20" + "18:30" (Iran wall-clock) → "2026-11-20T18:30:00+03:30" (a valid instant) */
export function tehranToIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const iso = `${date}T${time}:00${OFFSET}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/** instant → { date: "2026-11-20", time: "18:30" } in Iran time (for editing forms) */
export function isoToTehranParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}` };
}

const intlLocale = (l: Locale) => (l === "fa" ? "fa-IR" : "en-GB");

export interface DateParts {
  day: string; // "۲۴" / "24"
  month: string; // "آبان" / "Nov"
  monthLong: string;
  weekday: string; // "جمعه" / "Friday"
  year: string;
  full: string; // "جمعه ۲۴ آبان ۱۴۰۵"
}

export function dateParts(iso: string, l: Locale): DateParts {
  const d = new Date(iso);
  const f = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intlLocale(l), { timeZone: TZ, ...opts });
  const parts: DateParts = {
    day: f({ day: "numeric" }).format(d),
    month: f({ month: "short" }).format(d),
    monthLong: f({ month: "long" }).format(d),
    weekday: f({ weekday: "long" }).format(d),
    year: f({ year: "numeric" }).format(d),
    // built from parts so the order is always weekday · day · month · year (ICU's own pattern reorders under RTL)
    full: "",
  };
  parts.full = `${parts.weekday} ${parts.day} ${parts.monthLong} ${parts.year}`;
  return parts;
}

export const formatTime = (iso: string, l: Locale) =>
  new Intl.DateTimeFormat(intlLocale(l), { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

export function formatTimeRange(ev: Pick<EventItem, "startsAt" | "endsAt">, l: Locale) {
  const a = formatTime(ev.startsAt, l);
  return ev.endsAt ? `${a} – ${formatTime(ev.endsAt, l)}` : a;
}

export const formatDateTime = (iso: string, l: Locale) =>
  `${dateParts(iso, l).full} · ${formatTime(iso, l)}`;

// ---- phase / availability ------------------------------------------------------

export type Phase = "upcoming" | "live" | "past";

/** An event is "past" once its end (or start + 3 h when there's no end) has gone by. */
export function eventPhase(ev: Pick<EventItem, "startsAt" | "endsAt" | "status">, now: number): Phase {
  const start = Date.parse(ev.startsAt);
  const end = ev.endsAt ? Date.parse(ev.endsAt) : start + 3 * 3600_000;
  if (ev.status === "completed") return "past";
  if (now < start) return "upcoming";
  return now <= end ? "live" : "past";
}

export type Availability = "open" | "waitlist" | "full" | "closed" | "cancelled" | "past";

export function availability(
  ev: Pick<EventItem, "startsAt" | "endsAt" | "status" | "deadline" | "capacity" | "taken" | "allowWaitlist">,
  now: number,
): Availability {
  if (ev.status === "cancelled") return "cancelled";
  if (eventPhase(ev, now) === "past") return "past";
  if (now >= Date.parse(ev.deadline ?? ev.startsAt)) return "closed";
  if (ev.capacity != null && ev.taken >= ev.capacity) return ev.allowWaitlist ? "waitlist" : "full";
  return "open";
}

export const seatsLeft = (ev: Pick<EventItem, "capacity" | "taken">) =>
  ev.capacity == null ? null : Math.max(ev.capacity - ev.taken, 0);

/** "limited" = 5 seats or fewer, or under a fifth of the capacity */
export function isLimited(ev: Pick<EventItem, "capacity" | "taken">): boolean {
  const left = seatsLeft(ev);
  if (left == null || ev.capacity == null) return false;
  return left > 0 && (left <= 5 || left / ev.capacity <= 0.2);
}

export function countdown(targetIso: string, now: number) {
  const ms = Math.max(Date.parse(targetIso) - now, 0);
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: ms === 0 };
}

/** Split events into what's coming up (soonest first) and what has happened (latest first). */
export function splitByPhase<T extends Pick<EventItem, "startsAt" | "endsAt" | "status">>(events: T[], now: number) {
  const upcoming = events.filter((e) => e.status !== "cancelled" && eventPhase(e, now) !== "past").sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const past = events.filter((e) => e.status !== "cancelled" && eventPhase(e, now) === "past").sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  return { upcoming, past };
}

/** a minimal .ics (calendar) file so a registrant can add the event to their calendar */
export function toIcs(ev: Pick<EventItem, "slug" | "startsAt" | "endsAt"> & { title: string; venue?: string }) {
  const f = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = ev.endsAt ?? new Date(Date.parse(ev.startsAt) + 2 * 3600_000).toISOString();
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Neshat Learning Center//Events//EN", "BEGIN:VEVENT",
    `UID:${ev.slug}@neshat`, `DTSTAMP:${f(new Date().toISOString())}`, `DTSTART:${f(ev.startsAt)}`, `DTEND:${f(end)}`,
    `SUMMARY:${ev.title.replace(/[,;\n]/g, " ")}`, ev.venue ? `LOCATION:${ev.venue.replace(/[,;\n]/g, " ")}` : "", "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

/** the current instant — wrapped so server components can read the clock without tripping the render-purity lint */
export const nowMs = () => Date.now();
