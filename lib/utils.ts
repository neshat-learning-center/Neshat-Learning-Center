import { twMerge } from "tailwind-merge";
import type { Locale } from "./i18n/config";

/**
 * Joins class names and resolves conflicting Tailwind utilities (e.g. a
 * variant's `text-ink` vs. a caller's override `text-canvas`) by keeping the
 * last one — string concatenation order alone doesn't guarantee this, since
 * both classes have equal specificity in the compiled CSS.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(" "));
}

/** Build a locale-prefixed internal href. */
export function href(locale: Locale, path = ""): string {
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `/${locale}${clean}`;
}

/** English-only slugify — used as a fallback when an admin form leaves the slug blank. */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `item-${Date.now()}`
  );
}
