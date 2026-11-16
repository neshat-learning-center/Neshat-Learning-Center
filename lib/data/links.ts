import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";

const one = <T,>(v: unknown) => (Array.isArray(v) ? v[0] : v) as T | undefined;
const pickName = (locale: Locale, fa?: string | null, en?: string | null) => (locale === "fa" ? fa : en || fa) ?? "";

export interface RosterStudent {
  enrollmentId: string;
  studentId: string;
  name: string;
  phone: string | null;
  level: string;
  progress: number;
}

/** A class's students with the level/progress the student sees on their own dashboard. */
export async function listClassStudents(classId: string): Promise<RosterStudent[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("enrollments")
    .select("id, student_id, level, progress, student:profiles(full_name, phone)")
    .eq("class_id", classId)
    .order("created_at");
  return (data ?? []).map((e) => {
    const s = one<{ full_name?: string; phone?: string }>(e.student);
    return {
      enrollmentId: e.id as string,
      studentId: e.student_id as string,
      name: s?.full_name || "—",
      phone: s?.phone ?? null,
      level: (e.level as string) ?? "",
      progress: Number(e.progress ?? 0),
    };
  });
}

/** Enrolled count + pending join requests per class (admin list / teacher cards). */
export async function getClassCounts(classIds?: string[]): Promise<{ enrolled: Record<string, number>; pending: Record<string, number> }> {
  const out = { enrolled: {} as Record<string, number>, pending: {} as Record<string, number> };
  if (!isSupabaseConfigured()) return out;
  const sb = await createClient();
  let e = sb.from("enrollments").select("class_id");
  let r = sb.from("class_join_requests").select("class_id").eq("status", "pending");
  if (classIds) {
    if (classIds.length === 0) return out;
    e = e.in("class_id", classIds);
    r = r.in("class_id", classIds);
  }
  const [{ data: en }, { data: rq }] = await Promise.all([e, r]);
  for (const x of en ?? []) out.enrolled[x.class_id] = (out.enrolled[x.class_id] ?? 0) + 1;
  for (const x of rq ?? []) out.pending[x.class_id] = (out.pending[x.class_id] ?? 0) + 1;
  return out;
}

/** How many classes each student is in (admin students list). */
export async function getStudentClassCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};
  const sb = await createClient();
  const { data } = await sb.from("enrollments").select("student_id");
  const m: Record<string, number> = {};
  for (const x of data ?? []) m[x.student_id] = (m[x.student_id] ?? 0) + 1;
  return m;
}

export interface StudentClassRow {
  enrollmentId: string;
  classId: string;
  title: string;
  teacher: string;
  level: string;
  progress: number;
}
export interface StudentAdminView {
  classes: StudentClassRow[];
  attendance: { present: number; absent: number; late: number };
  placement: { levelCode: string | null; score: number | null; total: number | null; at: string } | null;
}

/** Everything the admin needs about one student in one place. */
export async function getStudentAdminView(studentId: string, locale: Locale): Promise<StudentAdminView> {
  const view: StudentAdminView = { classes: [], attendance: { present: 0, absent: 0, late: 0 }, placement: null };
  if (!isSupabaseConfigured()) return view;
  const sb = await createClient();
  const [{ data: enr }, { data: plc }] = await Promise.all([
    sb
      .from("enrollments")
      .select("id, level, progress, classes(id, title, title_en, teacher:profiles(full_name, full_name_en))")
      .eq("student_id", studentId),
    sb
      .from("placement_attempts")
      .select("level_code, score, total, created_at")
      .eq("student_id", studentId)
      .not("score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  view.classes = (enr ?? []).map((e) => {
    const c = one<{ id: string; title: string; title_en?: string; teacher?: unknown }>(e.classes);
    const t = one<{ full_name?: string; full_name_en?: string }>(c?.teacher);
    return {
      enrollmentId: e.id as string,
      classId: c?.id ?? "",
      title: pickName(locale, c?.title, c?.title_en),
      teacher: pickName(locale, t?.full_name, t?.full_name_en),
      level: (e.level as string) ?? "",
      progress: Number(e.progress ?? 0),
    };
  });
  const ids = (enr ?? []).map((e) => e.id as string);
  if (ids.length) {
    const { data: att } = await sb.from("attendance").select("status").in("enrollment_id", ids);
    for (const a of att ?? []) {
      const s = a.status as "present" | "absent" | "late" | "excused";
      if (s === "present" || s === "absent" || s === "late") view.attendance[s] += 1;
    }
  }
  const p = plc?.[0];
  if (p) view.placement = { levelCode: p.level_code, score: p.score, total: p.total, at: p.created_at };
  return view;
}

export interface TeacherClassRow {
  id: string;
  title: string;
  status: string;
  enrolled: number;
  capacity: number | null;
}
export async function listTeacherClassesAdmin(teacherId: string, locale: Locale): Promise<TeacherClassRow[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("classes")
    .select("id, title, title_en, status, capacity, enrollments(count)")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((c) => {
    const cnt = one<{ count?: number }>(c.enrollments);
    return {
      id: c.id as string,
      title: pickName(locale, c.title, c.title_en),
      status: c.status as string,
      enrolled: cnt?.count ?? 0,
      capacity: (c.capacity as number | null) ?? null,
    };
  });
}

export interface StudentOption {
  id: string;
  name: string;
  phone: string | null;
}
/** Every registered student, for the admin's "add to class" picker. */
export async function listStudentOptions(): Promise<StudentOption[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = await createClient();
  const { data } = await sb.from("profiles").select("id, full_name, phone").eq("role", "student").order("full_name");
  return (data ?? []).map((p) => ({ id: p.id as string, name: (p.full_name as string) || "—", phone: (p.phone as string | null) ?? null }));
}
