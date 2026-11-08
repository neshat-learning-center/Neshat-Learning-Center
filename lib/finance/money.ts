import type { Locale } from "@/lib/i18n/config";

/**
 * All money in the accounting module is an INTEGER number of Toman.
 * Nothing here ever produces or accepts a fraction of a Toman.
 */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** "۴٬۵۰۰٬۰۰۰" / "4,500,000" / "4 500 000" → 4500000. null when it isn't a whole, non-negative number. */
export function parseToman(input: unknown): number | null {
  if (typeof input !== "string") return null;
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
  s = s.replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)));
  s = s.replace(/[,،٬\s‌]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

const grouped = (locale: Locale) =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 0, useGrouping: true });

const fmtCache: Partial<Record<Locale, Intl.NumberFormat>> = {};
function fmt(locale: Locale) {
  return (fmtCache[locale] ??= grouped(locale));
}

/** Plain grouped number with locale digits: 4500000 → "۴٬۵۰۰٬۰۰۰". */
export function formatNumber(n: number, locale: Locale): string {
  return fmt(locale).format(Math.round(n));
}

/** Money with the unit — the ONLY currency the module ever shows. */
export function formatToman(n: number, locale: Locale): string {
  const unit = locale === "fa" ? "تومان" : "Toman";
  const num = formatNumber(Math.abs(n), locale);
  // negative amounts keep the sign visually left-to-right-safe
  return `${n < 0 ? "−" : ""}${num} ${unit}`;
}

/** basis points → percent text. 2550 → "۲۵٫۵٪" / "25.5%" */
export function formatBp(bp: number, locale: Locale): string {
  const v = bp / 100;
  const s = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 2 }).format(v);
  return `${s}${locale === "fa" ? "٪" : "%"}`;
}

/** user-typed percent ("25", "25.5", "۲۵٫۵") → basis points (2550). null if invalid / out of 0–100. */
export function parsePercentToBp(input: unknown): number | null {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
  s = s.replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d))).replace(/[٫,]/g, ".").replace("٪", "").replace("%", "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const bp = Math.round(Number(s) * 100);
  return bp >= 0 && bp <= 10000 ? bp : null;
}

/** "2026-10-05" → "۱۴۰۵/۰۷/۱۳" (fa) or "5 Oct 2026" (en). Date-only, so it never shifts with the timezone. */
export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(locale === "fa" ? "fa-IR" : "en-GB", {
    timeZone: "UTC", year: "numeric", month: locale === "fa" ? "2-digit" : "short", day: locale === "fa" ? "2-digit" : "numeric",
  });
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "fa" ? "fa-IR" : "en-GB", {
    timeZone: "Asia/Tehran", dateStyle: "short", timeStyle: "short",
  });
}

/** minutes → "۹ ساعت و ۳۰ دقیقه" style label */
export function formatHours(minutes: number, locale: Locale): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const nf = (n: number) => formatNumber(n, locale);
  if (locale === "fa") return m ? `${nf(h)} ساعت و ${nf(m)} دقیقه` : `${nf(h)} ساعت`;
  return m ? `${nf(h)} h ${nf(m)} min` : `${nf(h)} h`;
}
