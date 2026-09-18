import type { Course } from "./types";

/**
 * SEED / SAMPLE courses for layout. Editable via the admin dashboard.
 * No prices or fabricated details are shown on the public site by default.
 *
 * A course is the catalog/marketing entry only — language, category, level,
 * age group, cover image, recommended books. Teacher, schedule, and
 * in-person/online are all class-level concerns (see content/demo classes on
 * the course detail page), since one course can run as several classes.
 */
export const courses: Course[] = [
  {
    slug: "english-conversation-adults",
    title: { fa: "مکالمهٔ انگلیسی بزرگسالان", en: "English Conversation — Adults" },
    language: "english",
    category: "conversation",
    level: { fa: "متوسط", en: "Intermediate" },
    age: "adults",
    bookSlugs: ["neshat-conversation-notebook", "everyday-vocabulary"],
    summary: {
      fa: "تمرکز بر گفت‌وگوی روان و طبیعی در موقعیت‌های واقعی.",
      en: "Focused on fluent, natural conversation in real situations.",
    },
  },
  {
    slug: "ielts-intensive",
    title: { fa: "آیلتس فشرده", en: "IELTS Intensive" },
    language: "english",
    category: "ielts",
    level: { fa: "پیشرفته", en: "Advanced" },
    age: "adults",
    bookSlugs: ["ielts-writing-guide"],
    summary: {
      fa: "آمادگی هدفمند برای چهار مهارت آزمون آیلتس.",
      en: "Targeted preparation across all four IELTS skills.",
    },
  },
  {
    slug: "german-a1",
    title: { fa: "آلمانی پایه A1", en: "German A1" },
    language: "german",
    category: "general",
    level: { fa: "پایه", en: "Beginner" },
    age: "adults",
    bookSlugs: ["german-first-steps"],
    summary: {
      fa: "شروع اصولی آلمانی، از الفبا تا جمله‌سازی روزمره.",
      en: "A solid start in German, from the alphabet to everyday sentences.",
    },
  },
  {
    slug: "turkish-conversation",
    title: { fa: "مکالمهٔ ترکی استانبولی", en: "Turkish Conversation" },
    language: "turkish",
    category: "conversation",
    level: { fa: "پایه تا متوسط", en: "Beginner–Intermediate" },
    age: "adults",
    summary: {
      fa: "مکالمهٔ کاربردی برای سفر، کار و زندگی.",
      en: "Practical conversation for travel, work, and life.",
    },
  },
  {
    slug: "kids-english",
    title: { fa: "انگلیسی کودکان", en: "English for Kids" },
    language: "english",
    category: "kids",
    level: { fa: "خردسال", en: "Young learners" },
    age: "kids",
    bookSlugs: ["stories-for-kids"],
    summary: {
      fa: "یادگیری زبان از راه بازی، داستان و فعالیت گروهی.",
      en: "Learning through play, stories, and group activity.",
    },
  },
  {
    slug: "teens-english",
    title: { fa: "انگلیسی نوجوانان", en: "English for Teens" },
    language: "english",
    category: "kids",
    level: { fa: "متوسط", en: "Intermediate" },
    age: "teens",
    summary: {
      fa: "پلی میان درس مدرسه و زبانِ واقعی و روزمره.",
      en: "A bridge between school lessons and real, everyday language.",
    },
  },
];
