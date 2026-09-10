import type { Post } from "./types";

/**
 * SEED / SAMPLE journal posts for the magazine layout.
 * Editable via the admin dashboard / blog CMS.
 */
export const posts: Post[] = [
  {
    slug: "speaking-from-day-one",
    title: { fa: "چرا از جلسهٔ اول باید حرف بزنیم؟", en: "Why you should speak from day one" },
    category: { fa: "نکات زبان", en: "Language tips" },
    excerpt: {
      fa: "ترسِ اشتباه‌کردن بزرگ‌ترین مانع مکالمه است؛ در این نوشته دربارهٔ عبور از آن حرف می‌زنیم.",
      en: "Fear of mistakes is the biggest barrier to speaking. Here's how to move past it.",
    },
    minRead: 4,
  },
  {
    slug: "common-mistakes-fa-speakers",
    title: { fa: "اشتباه‌های رایج فارسی‌زبان‌ها در انگلیسی", en: "Common English mistakes by Persian speakers" },
    category: { fa: "اشتباهات رایج", en: "Common mistakes" },
    excerpt: {
      fa: "چند الگوی تکرارشونده که با کمی دقت به‌سادگی برطرف می‌شوند.",
      en: "A few recurring patterns that are easy to fix with a little attention.",
    },
    minRead: 6,
  },
  {
    slug: "vocabulary-that-sticks",
    title: { fa: "واژه‌هایی که در ذهن می‌مانند", en: "Vocabulary that sticks" },
    category: { fa: "Vocabulary", en: "Vocabulary" },
    excerpt: {
      fa: "یادگیری لغت با داستان و بافت، به‌جای فهرست‌های خشک.",
      en: "Learning words through story and context, instead of dry lists.",
    },
    minRead: 5,
  },
  {
    slug: "choosing-your-first-book",
    title: { fa: "اولین کتابت را چطور انتخاب کنی؟", en: "How to choose your first book" },
    category: { fa: "معرفی کتاب", en: "Book picks" },
    excerpt: {
      fa: "راهنمای کوتاهی برای انتخاب منبعی که با سطح تو جور باشد.",
      en: "A short guide to picking a resource that matches your level.",
    },
    minRead: 4,
  },
];
