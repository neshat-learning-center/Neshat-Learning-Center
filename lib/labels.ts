import type { Locale } from "@/lib/i18n/config";
import type { LanguageKey, CourseCategory } from "@/content/types";
import { categories as seedCategories } from "@/content/categories";
import { LANGUAGES } from "@/content/languages";
import { COURSE_CATEGORIES } from "@/content/course-categories";

/**
 * Pure, client-safe label lookups — no Supabase/server imports, so these can
 * be used from both server data helpers (lib/data/public.ts re-exports them)
 * and client components directly (e.g. CourseGrid's filter/badge labels).
 */

export function languageLabel(language: LanguageKey, locale: Locale): string {
  const lang = LANGUAGES.find((l) => l.value === language);
  if (lang) return lang[locale];
  // Books still use the broader, historically-conflated LanguageKey (e.g.
  // "ielts"/"kids"), which only ever matched a discovery-tile label.
  const cat = seedCategories.find((c) => c.filter.value === language);
  return cat ? cat.title[locale] : language;
}

export function categoryLabel(category: CourseCategory, locale: Locale): string {
  const cat = COURSE_CATEGORIES.find((c) => c.value === category);
  return cat ? cat[locale] : category;
}
