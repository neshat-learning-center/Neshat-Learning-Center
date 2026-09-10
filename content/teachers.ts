import type { Teacher } from "./types";

/**
 * SEED / SAMPLE teacher entries for layout and demonstration.
 * Replace with real Neshat teachers via the admin dashboard.
 * Bios are deliberately neutral — no invented credentials, years, or awards.
 */
export const teachers: Teacher[] = [
  {
    slug: "teacher-1",
    name: { fa: "نام مدرس", en: "Teacher Name" },
    languages: { fa: "انگلیسی · مکالمه", en: "English · Conversation" },
    specialty: { fa: "مکالمهٔ بزرگسالان", en: "Adult conversation" },
    bio: {
      fa: "معرفی کوتاه مدرس در این بخش قرار می‌گیرد. این متن از داشبورد مدیریت قابل ویرایش است.",
      en: "A short teacher introduction goes here. This text is editable from the admin dashboard.",
    },
  },
  {
    slug: "teacher-2",
    name: { fa: "نام مدرس", en: "Teacher Name" },
    languages: { fa: "آیلتس · انگلیسی", en: "IELTS · English" },
    specialty: { fa: "آمادگی آیلتس", en: "IELTS preparation" },
    bio: {
      fa: "معرفی کوتاه مدرس در این بخش قرار می‌گیرد. این متن از داشبورد مدیریت قابل ویرایش است.",
      en: "A short teacher introduction goes here. This text is editable from the admin dashboard.",
    },
  },
  {
    slug: "teacher-3",
    name: { fa: "نام مدرس", en: "Teacher Name" },
    languages: { fa: "آلمانی", en: "German" },
    specialty: { fa: "آلمانی پایه تا متوسط", en: "German A1–B1" },
    bio: {
      fa: "معرفی کوتاه مدرس در این بخش قرار می‌گیرد. این متن از داشبورد مدیریت قابل ویرایش است.",
      en: "A short teacher introduction goes here. This text is editable from the admin dashboard.",
    },
  },
  {
    slug: "teacher-4",
    name: { fa: "نام مدرس", en: "Teacher Name" },
    languages: { fa: "کودکان · نوجوانان", en: "Kids · Teens" },
    specialty: { fa: "آموزش کودکان", en: "Young learners" },
    bio: {
      fa: "معرفی کوتاه مدرس در این بخش قرار می‌گیرد. این متن از داشبورد مدیریت قابل ویرایش است.",
      en: "A short teacher introduction goes here. This text is editable from the admin dashboard.",
    },
  },
];
