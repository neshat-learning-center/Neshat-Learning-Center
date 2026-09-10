import type { Category } from "./types";

/**
 * Language / course categories. Editable CMS content — extend or remove to match
 * what the institute actually offers.
 */
export const categories: Category[] = [
  {
    slug: "english",
    language: "english",
    title: { fa: "انگلیسی", en: "English" },
    note: { fa: "از پایه تا پیشرفته", en: "Beginner to advanced" },
    glyph: "En",
  },
  {
    slug: "german",
    language: "german",
    title: { fa: "آلمانی", en: "German" },
    note: { fa: "مسیر روشن یادگیری", en: "A clear learning path" },
    glyph: "De",
  },
  {
    slug: "turkish",
    language: "turkish",
    title: { fa: "ترکی استانبولی", en: "Turkish" },
    note: { fa: "مکالمه از جلسهٔ اول", en: "Speaking from day one" },
    glyph: "Tr",
  },
  {
    slug: "ielts",
    language: "ielts",
    title: { fa: "آیلتس", en: "IELTS" },
    note: { fa: "آمادگی هدفمند آزمون", en: "Focused exam prep" },
    glyph: "IELTS",
  },
  {
    slug: "conversation",
    language: "conversation",
    title: { fa: "مکالمه", en: "Conversation" },
    note: { fa: "زبانِ زندگی روزمره", en: "Everyday, living language" },
    glyph: "Talk",
  },
  {
    slug: "kids",
    language: "kids",
    title: { fa: "کودکان و نوجوانان", en: "Kids & Teens" },
    note: { fa: "یادگیری همراه با بازی", en: "Learning through play" },
    glyph: "Kids",
  },
  {
    slug: "teacher-training",
    language: "teacher-training",
    title: { fa: "تربیت مدرس", en: "Teacher Training" },
    note: { fa: "مسیر حرفه‌ای تدریس", en: "The path to teaching" },
    glyph: "TTC",
  },
];
