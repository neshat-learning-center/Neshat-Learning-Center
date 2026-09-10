export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fa";

export const dir: Record<Locale, "rtl" | "ltr"> = {
  fa: "rtl",
  en: "ltr",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Pick a localized value from a {fa,en} content field. */
export function pick<T>(field: { fa: T; en: T }, locale: Locale): T {
  return field[locale];
}

export type Localized<T = string> = { fa: T; en: T };
