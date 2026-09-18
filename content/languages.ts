import type { CourseLanguage } from "./types";

/**
 * Every language a course can be taught in, with its label in both locales.
 * This drives the admin "add/edit course" language dropdown. To offer a new
 * language: add it here AND to the CourseLanguage union in content/types.ts.
 * (The homepage's discovery tiles are separate, curated marketing content —
 * see content/categories.ts — and don't need to list every language here.)
 */
export const LANGUAGES: { value: CourseLanguage; fa: string; en: string }[] = [
  { value: "english", fa: "انگلیسی", en: "English" },
  { value: "german", fa: "آلمانی", en: "German" },
  { value: "turkish", fa: "ترکی استانبولی", en: "Turkish" },
  { value: "french", fa: "فرانسوی", en: "French" },
  { value: "arabic", fa: "عربی", en: "Arabic" },
  { value: "spanish", fa: "اسپانیایی", en: "Spanish" },
  { value: "italian", fa: "ایتالیایی", en: "Italian" },
  { value: "russian", fa: "روسی", en: "Russian" },
  { value: "chinese", fa: "چینی", en: "Chinese" },
  { value: "japanese", fa: "ژاپنی", en: "Japanese" },
  { value: "korean", fa: "کره‌ای", en: "Korean" },
  { value: "portuguese", fa: "پرتغالی", en: "Portuguese" },
  { value: "dutch", fa: "هلندی", en: "Dutch" },
  { value: "swedish", fa: "سوئدی", en: "Swedish" },
  { value: "greek", fa: "یونانی", en: "Greek" },
  { value: "polish", fa: "لهستانی", en: "Polish" },
  { value: "hindi", fa: "هندی", en: "Hindi" },
  { value: "urdu", fa: "اردو", en: "Urdu" },
  { value: "hebrew", fa: "عبری", en: "Hebrew" },
  { value: "azerbaijani", fa: "آذربایجانی", en: "Azerbaijani" },
];
