import type { Course } from "./types";

/**
 * SEED / SAMPLE courses for layout. Editable via the admin dashboard.
 * No prices or fabricated details are shown on the public site by default.
 */
export const courses: Course[] = [
  {
    slug: "english-conversation-adults",
    title: { fa: "مکالمهٔ انگلیسی بزرگسالان", en: "English Conversation — Adults" },
    language: "english",
    level: { fa: "متوسط", en: "Intermediate" },
    age: "adults",
    mode: "both",
    teacherSlug: "teacher-1",
    capacity: 12,
    schedule: { fa: "شنبه و دوشنبه", en: "Sat & Mon" },
    summary: {
      fa: "تمرکز بر گفت‌وگوی روان و طبیعی در موقعیت‌های واقعی.",
      en: "Focused on fluent, natural conversation in real situations.",
    },
  },
  {
    slug: "ielts-intensive",
    title: { fa: "آیلتس فشرده", en: "IELTS Intensive" },
    language: "ielts",
    level: { fa: "پیشرفته", en: "Advanced" },
    age: "adults",
    mode: "both",
    teacherSlug: "teacher-2",
    capacity: 8,
    schedule: { fa: "یکشنبه و سه‌شنبه", en: "Sun & Tue" },
    summary: {
      fa: "آمادگی هدفمند برای چهار مهارت آزمون آیلتس.",
      en: "Targeted preparation across all four IELTS skills.",
    },
  },
  {
    slug: "german-a1",
    title: { fa: "آلمانی پایه A1", en: "German A1" },
    language: "german",
    level: { fa: "پایه", en: "Beginner" },
    age: "adults",
    mode: "offline",
    teacherSlug: "teacher-3",
    capacity: 14,
    schedule: { fa: "پنجشنبه", en: "Thursdays" },
    summary: {
      fa: "شروع اصولی آلمانی، از الفبا تا جمله‌سازی روزمره.",
      en: "A solid start in German, from the alphabet to everyday sentences.",
    },
  },
  {
    slug: "turkish-conversation",
    title: { fa: "مکالمهٔ ترکی استانبولی", en: "Turkish Conversation" },
    language: "turkish",
    level: { fa: "پایه تا متوسط", en: "Beginner–Intermediate" },
    age: "adults",
    mode: "online",
    teacherSlug: "teacher-1",
    capacity: 12,
    schedule: { fa: "دوشنبه", en: "Mondays" },
    summary: {
      fa: "مکالمهٔ کاربردی برای سفر، کار و زندگی.",
      en: "Practical conversation for travel, work, and life.",
    },
  },
  {
    slug: "kids-english",
    title: { fa: "انگلیسی کودکان", en: "English for Kids" },
    language: "kids",
    level: { fa: "خردسال", en: "Young learners" },
    age: "kids",
    mode: "offline",
    teacherSlug: "teacher-4",
    capacity: 10,
    schedule: { fa: "چهارشنبه", en: "Wednesdays" },
    summary: {
      fa: "یادگیری زبان از راه بازی، داستان و فعالیت گروهی.",
      en: "Learning through play, stories, and group activity.",
    },
  },
  {
    slug: "teens-english",
    title: { fa: "انگلیسی نوجوانان", en: "English for Teens" },
    language: "kids",
    level: { fa: "متوسط", en: "Intermediate" },
    age: "teens",
    mode: "both",
    teacherSlug: "teacher-4",
    capacity: 12,
    schedule: { fa: "سه‌شنبه", en: "Tuesdays" },
    summary: {
      fa: "پلی میان درس مدرسه و زبانِ واقعی و روزمره.",
      en: "A bridge between school lessons and real, everyday language.",
    },
  },
];
