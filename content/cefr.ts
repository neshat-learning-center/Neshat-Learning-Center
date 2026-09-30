/**
 * The CEFR (Common European Framework) scale — used both to tag a course's
 * level (optional, admin-set, for placement-test suggestions) and to report
 * a placement test taker's result. Six levels is the standard scale; extend
 * this array (in order) if that ever needs to change.
 */
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export function isCefrLevel(value: string): value is CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(value);
}

export const CEFR_LABELS: Record<CefrLevel, { fa: string; en: string; noteFa: string; noteEn: string }> = {
  A1: {
    fa: "مبتدی",
    en: "Beginner",
    noteFa: "می‌توانی جملات ساده و روزمره را بفهمی و به کار ببری.",
    noteEn: "You can understand and use simple, everyday expressions.",
  },
  A2: {
    fa: "مقدماتی",
    en: "Elementary",
    noteFa: "می‌توانی دربارهٔ موضوعات آشنا و روزمره ارتباط برقرار کنی.",
    noteEn: "You can communicate on simple, familiar, everyday topics.",
  },
  B1: {
    fa: "متوسط",
    en: "Intermediate",
    noteFa: "می‌توانی در بیشتر موقعیت‌های روزمره و سفر از پس خودت بربیایی.",
    noteEn: "You can handle most situations while travelling or at work.",
  },
  B2: {
    fa: "متوسط رو به بالا",
    en: "Upper-Intermediate",
    noteFa: "می‌توانی روان و طبیعی دربارهٔ موضوعات گوناگون صحبت کنی.",
    noteEn: "You can interact fluently on a wide range of topics.",
  },
  C1: {
    fa: "پیشرفته",
    en: "Advanced",
    noteFa: "می‌توانی به‌طور روان و دقیق، حتی در موضوعات پیچیده، صحبت کنی.",
    noteEn: "You can express yourself fluently and precisely, even on complex topics.",
  },
  C2: {
    fa: "تسلط کامل",
    en: "Proficiency",
    noteFa: "تقریباً مثل یک گویشور بومی، زبان را می‌فهمی و به کار می‌بری.",
    noteEn: "You understand and use the language with near-native ease.",
  },
};
