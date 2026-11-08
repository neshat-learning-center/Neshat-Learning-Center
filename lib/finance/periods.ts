import type { Locale } from "@/lib/i18n/config";
import { toJalali, toGregorian, daysInJalaliMonth, JALALI_MONTH_NAMES_FA, toPersianDigits } from "@/lib/jalali";

export type Calendar = "jalali" | "gregorian";
export type Preset = "this_month" | "last_month" | "last_3_months" | "this_year" | "custom";

/** Inclusive ISO date range, "YYYY-MM-DD". */
export interface Range {
  from: string;
  to: string;
}
export interface Month {
  y: number;
  m: number; // 1-12 in the chosen calendar
}

const pad = (n: number) => String(n).padStart(2, "0");
/** ISO from LOCAL date parts (never toISOString, which would shift by timezone). */
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (iso: string, n: number) => {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};
export const inRange = (iso: string, r: Range) => iso >= r.from && iso <= r.to;

/** Today's calendar date in Iran, regardless of the server's timezone. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(now);
}

export function monthOf(iso: string, cal: Calendar): Month {
  const d = parseIso(iso);
  if (cal === "gregorian") return { y: d.getFullYear(), m: d.getMonth() + 1 };
  const j = toJalali(d);
  return { y: j.jy, m: j.jm };
}

export const monthKey = ({ y, m }: Month) => `${y}-${pad(m)}`;
export const parseMonthKey = (key: string): Month | null => {
  const mt = /^(\d{4})-(\d{2})$/.exec(key);
  if (!mt) return null;
  const m = Number(mt[2]);
  return m >= 1 && m <= 12 ? { y: Number(mt[1]), m } : null;
};

export function addMonths({ y, m }: Month, n: number): Month {
  const idx = y * 12 + (m - 1) + n;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

export function monthRange(cal: Calendar, mo: Month): Range {
  if (cal === "gregorian") {
    const last = new Date(mo.y, mo.m, 0).getDate();
    return { from: `${mo.y}-${pad(mo.m)}-01`, to: `${mo.y}-${pad(mo.m)}-${pad(last)}` };
  }
  const from = toGregorian(mo.y, mo.m, 1);
  const to = toGregorian(mo.y, mo.m, daysInJalaliMonth(mo.y, mo.m));
  return { from: isoOf(from), to: isoOf(to) };
}

const EN_JALALI = ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];

export function monthLabel(cal: Calendar, mo: Month, locale: Locale): string {
  if (cal === "jalali") {
    return locale === "fa" ? `${JALALI_MONTH_NAMES_FA[mo.m - 1]} ${toPersianDigits(mo.y)}` : `${EN_JALALI[mo.m - 1]} ${mo.y}`;
  }
  return new Date(mo.y, mo.m - 1, 1).toLocaleDateString(locale === "fa" ? "fa-IR-u-ca-gregory" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Every month from `a` to `b` inclusive. */
export function monthsBetween(a: Month, b: Month): Month[] {
  const out: Month[] = [];
  let cur = a;
  for (let i = 0; i < 600 && (cur.y < b.y || (cur.y === b.y && cur.m <= b.m)); i++) {
    out.push(cur);
    cur = addMonths(cur, 1);
  }
  return out;
}

export function monthsInRange(cal: Calendar, r: Range): Month[] {
  return monthsBetween(monthOf(r.from, cal), monthOf(r.to, cal));
}

/** Resolve a quick filter to a concrete range, relative to `today` (ISO). */
export function presetRange(preset: Exclude<Preset, "custom">, today: string, cal: Calendar): Range {
  const cur = monthOf(today, cal);
  switch (preset) {
    case "this_month":
      return monthRange(cal, cur);
    case "last_month":
      return monthRange(cal, addMonths(cur, -1));
    case "last_3_months":
      return { from: monthRange(cal, addMonths(cur, -2)).from, to: monthRange(cal, cur).to };
    case "this_year":
      return { from: monthRange(cal, { y: cur.y, m: 1 }).from, to: monthRange(cal, { y: cur.y, m: 12 }).to };
  }
}

const isIso = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** URL query → range. `range=custom&from=&to=` or one of the presets. */
export function rangeFromParams(
  sp: { range?: string; from?: string; to?: string },
  today: string,
  cal: Calendar,
  fallback: Exclude<Preset, "custom"> = "this_month",
): { preset: Preset; range: Range } {
  if (sp.range === "custom" && isIso(sp.from) && isIso(sp.to)) {
    const [from, to] = sp.from <= sp.to ? [sp.from, sp.to] : [sp.to, sp.from];
    return { preset: "custom", range: { from, to } };
  }
  const p = (["this_month", "last_month", "last_3_months", "this_year"] as const).find((x) => x === sp.range) ?? fallback;
  return { preset: p, range: presetRange(p, today, cal) };
}
