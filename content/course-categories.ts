import type { CourseCategory } from "./types";

/**
 * Every course "type" to choose from when adding/editing a course — drives
 * the admin dropdown. To offer a new category: add it here AND to the
 * CourseCategory union in content/types.ts. (The homepage's discovery tiles
 * are separate, curated marketing content — see content/categories.ts —
 * and don't need to list every category here.)
 */
export const COURSE_CATEGORIES: { value: CourseCategory; fa: string; en: string }[] = [
  { value: "general", fa: "عمومی", en: "General" },
  { value: "conversation", fa: "مکالمه", en: "Conversation" },
  { value: "ielts", fa: "آیلتس", en: "IELTS" },
  { value: "toefl", fa: "تافل", en: "TOEFL" },
  { value: "business", fa: "زبان تجاری", en: "Business" },
  { value: "kids", fa: "کودکان و نوجوانان", en: "Kids & Teens" },
  { value: "teacher-training", fa: "تربیت مدرس", en: "Teacher Training" },
  { value: "private", fa: "خصوصی", en: "Private (one-on-one)" },
  { value: "intensive", fa: "فشرده", en: "Intensive" },
  { value: "grammar", fa: "دستور زبان", en: "Grammar" },
  { value: "academic", fa: "آکادمیک", en: "Academic" },
  { value: "translation", fa: "ترجمه", en: "Translation" },
];
