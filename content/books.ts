import type { Book } from "./types";

/**
 * SEED / SAMPLE resources. `spine` colors drive the designed placeholder cover
 * until a real `cover` image is supplied via the admin dashboard.
 */
export const books: Book[] = [
  {
    slug: "neshat-conversation-notebook",
    title: { fa: "دفترچهٔ مکالمهٔ نشاط", en: "Neshat Conversation Notebook" },
    language: "english",
    level: { fa: "متوسط", en: "Intermediate" },
    kind: { fa: "منبع نشاط", en: "Neshat resource" },
    spine: ["#2b2a2d", "#3a383c"],
  },
  {
    slug: "everyday-vocabulary",
    title: { fa: "واژگان روزمره", en: "Everyday Vocabulary" },
    language: "english",
    level: { fa: "پایه", en: "Beginner" },
    kind: { fa: "کتاب کار", en: "Workbook" },
    spine: ["#f4b223", "#dd9c0c"],
  },
  {
    slug: "german-first-steps",
    title: { fa: "قدم‌های اول آلمانی", en: "German First Steps" },
    language: "german",
    level: { fa: "پایه", en: "Beginner" },
    kind: { fa: "کتاب درسی", en: "Coursebook" },
    spine: ["#3a383c", "#55535a" ],
  },
  {
    slug: "ielts-writing-guide",
    title: { fa: "راهنمای رایتینگ آیلتس", en: "IELTS Writing Guide" },
    language: "ielts",
    level: { fa: "پیشرفته", en: "Advanced" },
    kind: { fa: "راهنما", en: "Guide" },
    spine: ["#262528", "#2b2a2d"],
  },
  {
    slug: "stories-for-kids",
    title: { fa: "قصه‌هایی برای کودکان", en: "Stories for Kids" },
    language: "kids",
    level: { fa: "خردسال", en: "Young learners" },
    kind: { fa: "کتاب داستان", en: "Storybook" },
    spine: ["#dd9c0c", "#f4b223"],
  },
];
