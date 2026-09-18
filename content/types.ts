import type { Localized } from "@/lib/i18n/config";

/** The real language a course is taught in — a course's "type" (exam prep,
 * conversation, kids, etc.) is tracked separately via CourseCategory, since
 * e.g. an IELTS or Kids course is still taught in a specific language.
 * See content/languages.ts for the full list + labels — extend that array
 * (not just this type) to add a new language. */
export type CourseLanguage =
  | "english"
  | "german"
  | "turkish"
  | "french"
  | "arabic"
  | "spanish"
  | "italian"
  | "russian"
  | "chinese"
  | "japanese"
  | "korean"
  | "portuguese"
  | "dutch"
  | "swedish"
  | "greek"
  | "polish"
  | "hindi"
  | "urdu"
  | "hebrew"
  | "azerbaijani";

/** Still used by books/teachers, which weren't part of the course/class
 * restructuring — a course's real language plus the historically-conflated
 * pseudo-language categories (exam prep, kids, etc.) books can also be tagged with. */
export type LanguageKey = CourseLanguage | "ielts" | "conversation" | "kids" | "teacher-training";

/** A course's "type" — see content/course-categories.ts for the full list +
 * labels — extend that array (not just this type) to add a new category. */
export type CourseCategory =
  | "general"
  | "conversation"
  | "ielts"
  | "toefl"
  | "business"
  | "kids"
  | "teacher-training"
  | "private"
  | "intensive"
  | "grammar"
  | "academic"
  | "translation";

export type AgeGroup = "kids" | "teens" | "adults";

export interface Category {
  slug: string;
  /** Discovery tiles filter courses by either dimension. */
  filter: { by: "language"; value: CourseLanguage } | { by: "category"; value: CourseCategory };
  title: Localized;
  /** short editorial descriptor, not marketing fluff */
  note: Localized;
  /** decorative English/native glyph shown large in the tile */
  glyph: string;
  image?: string; // real photography path — placeholder used when absent
}

export interface Course {
  slug: string;
  title: Localized;
  language: CourseLanguage;
  category: CourseCategory;
  level: Localized;
  age: AgeGroup;
  /** cover image — shown on the course card/detail page, not tied to a class */
  image?: string;
  /** recommended books' slugs — a course can have more than one */
  bookSlugs?: string[];
  summary: Localized;
}

export interface Teacher {
  slug: string;
  name: Localized;
  languages: Localized; // display string e.g. "انگلیسی، آیلتس"
  specialty: Localized;
  bio: Localized;
  image?: string;
}

export interface Book {
  slug: string;
  title: Localized;
  language: LanguageKey;
  level: Localized;
  kind: Localized; // e.g. "کتاب کار" / "Workbook"
  description?: Localized;
  fileUrl?: string; // real downloadable file — set via admin dashboard
  cover?: string;
  /** two brand-tinted colors used for the designed placeholder cover */
  spine: [string, string];
}

export interface Post {
  slug: string;
  title: Localized;
  category: Localized;
  excerpt: Localized;
  /** article body as an array of paragraphs per locale */
  body?: { fa: string[]; en: string[] };
  minRead: number;
  image?: string;
}

export interface SiteConfig {
  name: Localized;
  city: Localized;
  /** short, natural-language address — not the full formal/GPS string */
  address?: Localized;
  /** link to the institute's location on a map */
  mapUrl?: string;
  /** founding year is intentionally optional — never invented */
  foundedYear?: number;
  email?: string;
  /** one or more real contact numbers, shown in the order given */
  phones?: string[];
  instagram?: string;
  telegram?: string;
}
