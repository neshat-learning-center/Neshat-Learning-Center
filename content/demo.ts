import type { Localized } from "@/lib/i18n/config";

/**
 * Sample operational data for DEMO mode only (no Supabase connected).
 * Once Supabase is set up, dashboards read live data and this is unused.
 */

export interface DemoClass {
  id: string;
  title: Localized;
  teacher: Localized;
  schedule: Localized;
  mode: "offline" | "online";
  level: Localized;
  progress: number;
  onlineMeetingUrl?: string;
}

export const demoStudentClasses: DemoClass[] = [
  {
    id: "c1",
    title: { fa: "مکالمهٔ انگلیسی بزرگسالان", en: "English Conversation — Adults" },
    teacher: { fa: "نام مدرس", en: "Teacher Name" },
    schedule: { fa: "شنبه و دوشنبه · ۱۷:۳۰", en: "Sat & Mon · 17:30" },
    mode: "online",
    level: { fa: "متوسط", en: "Intermediate" },
    progress: 68,
    onlineMeetingUrl: "#", // real per-class URL comes from classes.online_meeting_url
  },
  {
    id: "c2",
    title: { fa: "آیلتس فشرده", en: "IELTS Intensive" },
    teacher: { fa: "نام مدرس", en: "Teacher Name" },
    schedule: { fa: "یکشنبه و سه‌شنبه · ۱۹:۰۰", en: "Sun & Tue · 19:00" },
    mode: "offline",
    level: { fa: "پیشرفته", en: "Advanced" },
    progress: 40,
  },
];

export const demoAttendance = { present: 22, absent: 2, late: 1 };

export const demoMaterials: { title: Localized; kind: string }[] = [
  { title: { fa: "جزوهٔ جلسهٔ ۸ (PDF)", en: "Session 8 handout (PDF)" }, kind: "pdf" },
  { title: { fa: "فایل صوتی تمرین شنیداری", en: "Listening practice audio" }, kind: "audio" },
  { title: { fa: "ویدیوی مرور گرامر", en: "Grammar review video" }, kind: "video" },
];

export const demoAnnouncements: { title: Localized; body: Localized; when: Localized }[] = [
  {
    title: { fa: "تعطیلی جلسهٔ پنجشنبه", en: "Thursday session cancelled" },
    body: { fa: "جلسهٔ این هفته به هفتهٔ بعد منتقل شد.", en: "This week's session moves to next week." },
    when: { fa: "۲ روز پیش", en: "2 days ago" },
  },
  {
    title: { fa: "شروع ثبت‌نام ترم جدید", en: "New term registration open" },
    body: { fa: "ثبت‌نام دوره‌های پاییز آغاز شد.", en: "Autumn term registration has started." },
    when: { fa: "۱ هفته پیش", en: "1 week ago" },
  },
];

export const demoTeacherClasses: {
  id: string;
  title: Localized;
  students: number;
  schedule: Localized;
  mode: "offline" | "online";
}[] = [
  {
    id: "t1",
    title: { fa: "مکالمهٔ انگلیسی بزرگسالان", en: "English Conversation — Adults" },
    students: 11,
    schedule: { fa: "شنبه و دوشنبه · ۱۷:۳۰", en: "Sat & Mon · 17:30" },
    mode: "online",
  },
  {
    id: "t2",
    title: { fa: "انگلیسی نوجوانان", en: "English for Teens" },
    students: 9,
    schedule: { fa: "سه‌شنبه · ۱۶:۰۰", en: "Tue · 16:00" },
    mode: "offline",
  },
];

export const demoTeacherStudents: { name: Localized; klass: Localized; level: Localized }[] = [
  { name: { fa: "زبان‌آموز ۱", en: "Student 1" }, klass: { fa: "مکالمهٔ بزرگسالان", en: "Adult conversation" }, level: { fa: "متوسط", en: "Intermediate" } },
  { name: { fa: "زبان‌آموز ۲", en: "Student 2" }, klass: { fa: "مکالمهٔ بزرگسالان", en: "Adult conversation" }, level: { fa: "متوسط", en: "Intermediate" } },
  { name: { fa: "زبان‌آموز ۳", en: "Student 3" }, klass: { fa: "انگلیسی نوجوانان", en: "English for Teens" }, level: { fa: "پایه", en: "Beginner" } },
];

export const demoAdminStats: { key: Localized; value: number }[] = [
  { key: { fa: "زبان‌آموزان", en: "Students" }, value: 0 },
  { key: { fa: "اساتید", en: "Teachers" }, value: 0 },
  { key: { fa: "دوره‌ها", en: "Courses" }, value: 0 },
  { key: { fa: "کلاس‌های فعال", en: "Active classes" }, value: 0 },
];
