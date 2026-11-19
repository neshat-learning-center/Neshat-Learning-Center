import type { Locale } from "@/lib/i18n/config";

/**
 * A class's weekly schedule is just "which days does it meet" — storing it
 * as a fixed set of day keys (instead of admin-typed free text) means the
 * Persian/English display text can be generated on demand, correctly, in
 * both languages, with nothing for the admin to translate by hand.
 */
export const WEEKDAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export function isWeekday(value: string): value is Weekday {
  return (WEEKDAYS as readonly string[]).includes(value);
}

const DAY_LABELS: Record<Weekday, { fa: string; en: string }> = {
  sat: { fa: "شنبه", en: "Sat" },
  sun: { fa: "یک‌شنبه", en: "Sun" },
  mon: { fa: "دوشنبه", en: "Mon" },
  tue: { fa: "سه‌شنبه", en: "Tue" },
  wed: { fa: "چهارشنبه", en: "Wed" },
  thu: { fa: "پنج‌شنبه", en: "Thu" },
  fri: { fa: "جمعه", en: "Fri" },
};

export function dayLabel(day: Weekday, locale: Locale): string {
  return DAY_LABELS[day][locale];
}

/** "شنبه، دوشنبه، چهارشنبه" / "Sat, Mon, Wed" — week-ordered, not selection-order. */
export function formatScheduleDays(days: readonly string[] | null | undefined, locale: Locale): string {
  if (!days || days.length === 0) return "";
  const selected = new Set(days);
  const ordered = WEEKDAYS.filter((d) => selected.has(d));
  const sep = locale === "fa" ? "، " : ", ";
  return ordered.map((d) => dayLabel(d, locale)).join(sep);
}

/* ── per-day times ─────────────────────────────────────────────────────────
 * A class can meet at a different time on each day (Wed 15:00–16:00 and
 * Sun 12:00–14:00). `schedule_slots` is the source of truth; `schedule_days`
 * and `start_time`/`end_time` are kept in sync on save for older readers. */
export interface Slot {
  day: Weekday;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isHHMM = (v: string) => HHMM.test(v);
export const toMinutes = (t: string) => {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

/** Slots in week order; falls back to days × the single legacy start/end for old rows. */
export function slotsOf(c: {
  schedule_slots?: unknown;
  schedule_days?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
}): Slot[] {
  const raw = Array.isArray(c.schedule_slots) ? (c.schedule_slots as Record<string, unknown>[]) : null;
  let slots: Slot[] = [];
  if (raw) {
    slots = raw
      .map((r) => ({ day: String(r.day), start: String(r.start ?? "").slice(0, 5), end: String(r.end ?? "").slice(0, 5) }))
      .filter((r): r is Slot => isWeekday(r.day) && isHHMM(r.start) && isHHMM(r.end));
  } else if (c.schedule_days?.length && c.start_time && c.end_time) {
    slots = c.schedule_days
      .filter(isWeekday)
      .map((day) => ({ day, start: c.start_time!.slice(0, 5), end: c.end_time!.slice(0, 5) }));
  }
  return WEEKDAYS.flatMap((d) => slots.filter((s) => s.day === d));
}

/** Days that share a time are grouped: [{days:[sun,wed], start, end}, …] in week order. */
export function groupSlots(slots: Slot[]): { days: Weekday[]; start: string; end: string }[] {
  const groups: { days: Weekday[]; start: string; end: string }[] = [];
  for (const s of slots) {
    const g = groups.find((x) => x.start === s.start && x.end === s.end);
    if (g) g.days.push(s.day);
    else groups.push({ days: [s.day], start: s.start, end: s.end });
  }
  return groups;
}

const JS_DAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
/** The weekday key for an ISO date ("2026-10-21" → "wed"). Date-only, timezone-safe. */
export function weekdayOfIso(iso: string): Weekday {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return JS_DAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
