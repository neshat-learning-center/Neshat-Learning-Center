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
