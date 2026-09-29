/**
 * Gregorian ⇄ Jalali (Iranian/Shamsi) calendar conversion, built entirely on
 * the JS engine's own ICU Persian-calendar support (`Intl` with the
 * `u-ca-persian` extension) rather than a hand-rolled leap-year algorithm —
 * this guarantees it agrees with how the rest of the site already displays
 * Jalali dates (e.g. via plain `toLocaleDateString("fa-IR", ...)`, which
 * defaults to this same calendar). Validated against known reference dates:
 * 1404-01-01 ↔ 2025-03-21, 1403-01-01 ↔ 2024-03-20 (a leap year), etc.
 */

export interface JalaliDate {
  jy: number;
  jm: number; // 1–12
  jd: number; // 1–31
}

const toJalaliFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** The Jalali calendar date for any Gregorian `Date` (time-of-day ignored). */
export function toJalali(date: Date): JalaliDate {
  const parts = toJalaliFormatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { jy: get("year"), jm: get("month"), jd: get("day") };
}

function jalaliDayOfYear(jm: number, jd: number): number {
  return jm <= 6 ? (jm - 1) * 31 + jd : 6 * 31 + (jm - 7) * 30 + jd;
}

/** The Gregorian `Date` (local midnight) for a given Jalali calendar date. */
export function toGregorian(jy: number, jm: number, jd: number): Date {
  let guess = new Date(jy + 621, 2, 21); // Nowruz is always within a day or two of March 21
  const targetDOY = jalaliDayOfYear(jm, jd);
  for (let i = 0; i < 15; i++) {
    const g = toJalali(guess);
    if (g.jy === jy && g.jm === jm && g.jd === jd) return guess;
    const dayDiff = (g.jy - jy) * 365 + (jalaliDayOfYear(g.jm, g.jd) - targetDOY);
    if (dayDiff === 0) return guess;
    guess = new Date(guess.getTime() - dayDiff * 86_400_000);
  }
  return guess;
}

/** How many days are in a given Jalali month (29–31), leap years included. */
export function daysInJalaliMonth(jy: number, jm: number): number {
  const thisMonthStart = toGregorian(jy, jm, 1);
  const [nextJy, nextJm] = jm === 12 ? [jy + 1, 1] : [jy, jm + 1];
  const nextMonthStart = toGregorian(nextJy, nextJm, 1);
  return Math.round((nextMonthStart.getTime() - thisMonthStart.getTime()) / 86_400_000);
}

export const JALALI_MONTH_NAMES_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Plain latin-digit number → Persian-digit string, e.g. 1405 → "۱۴۰۵". */
export function toPersianDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}
