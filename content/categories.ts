import type { Category } from "./types";

/**
 * Language / course-type categories. Editable CMS content — extend or remove
 * to match what the institute actually offers. Each tile filters the course
 * list by either the real language taught, or the course's type/category —
 * see content/types.ts for why those are two separate dimensions.
 */
export const categories: Category[] = [
  {
    slug: "english",
    filter: { by: "language", value: "english" },
    title: { fa: "انگلیسی", en: "English" },
    note: { fa: "از پایه تا پیشرفته", en: "Beginner to advanced" },
    tagline: { fa: "دنیای انگلیسی را کشف کن", en: "Explore the World of English" },
    glyph: "En",
  },
  {
    slug: "german",
    filter: { by: "language", value: "german" },
    title: { fa: "آلمانی", en: "German" },
    note: { fa: "مسیر روشن یادگیری", en: "A clear learning path" },
    tagline: { fa: "زبان آلمانی را کشف کن", en: "Entdecke die deutsche Sprache" },
    glyph: "De",
  },
  {
    slug: "turkish",
    filter: { by: "language", value: "turkish" },
    title: { fa: "ترکی استانبولی", en: "Turkish" },
    note: { fa: "مکالمه از جلسهٔ اول", en: "Speaking from day one" },
    tagline: { fa: "به زبانِ استانبول حرف بزن", en: "Speak the Language of Istanbul" },
    glyph: "Tr",
  },
  {
    slug: "ielts",
    filter: { by: "category", value: "ielts" },
    title: { fa: "آیلتس", en: "IELTS" },
    note: { fa: "آمادگی هدفمند آزمون", en: "Focused exam prep" },
    tagline: { fa: "آماده شو. تمرین کن. به هدفت برس.", en: "Prepare. Practice. Achieve." },
    glyph: "IELTS",
  },
  {
    slug: "conversation",
    filter: { by: "category", value: "conversation" },
    title: { fa: "مکالمه", en: "Conversation" },
    note: { fa: "زبانِ زندگی روزمره", en: "Everyday, living language" },
    tagline: { fa: "با اعتمادبه‌نفس حرف بزن", en: "Speak with Confidence" },
    glyph: "Talk",
  },
  {
    slug: "kids",
    filter: { by: "category", value: "kids" },
    title: { fa: "کودکان و نوجوانان", en: "Kids & Teens" },
    note: { fa: "یادگیری همراه با بازی", en: "Learning through play" },
    tagline: { fa: "یادگیری می‌تواند شاد باشد", en: "Learning Can Be Fun" },
    glyph: "Kids",
  },
  {
    slug: "teacher-training",
    filter: { by: "category", value: "teacher-training" },
    title: { fa: "تربیت مدرس", en: "Teacher Training" },
    note: { fa: "مسیر حرفه‌ای تدریس", en: "The path to teaching" },
    tagline: { fa: "مدرسی الهام‌بخش شو", en: "Become an Inspiring Teacher" },
    glyph: "TTC",
  },
];
