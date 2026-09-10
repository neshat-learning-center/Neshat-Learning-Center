import type { Localized } from "@/lib/i18n/config";

export type LanguageKey =
  | "english"
  | "german"
  | "turkish"
  | "ielts"
  | "conversation"
  | "kids"
  | "teacher-training";

export type ClassMode = "offline" | "online" | "both";
export type AgeGroup = "kids" | "teens" | "adults";

export interface Category {
  slug: string;
  language: LanguageKey;
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
  language: LanguageKey;
  level: Localized;
  age: AgeGroup;
  mode: ClassMode;
  teacherSlug?: string;
  capacity?: number;
  schedule?: Localized;
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
