import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import type { SessionCtx } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile, AttendanceStatus } from "@/lib/supabase/types";
import { listMaterialsForClasses, resolveMaterialUrl } from "@/lib/data/materials";
import {
  demoStudentClasses,
  demoAttendance,
  demoMaterials,
  demoAnnouncements,
  demoTeacherClasses,
  demoTeacherStudents,
  demoAdminStats,
} from "@/content/demo";

export interface StudentData {
  classes: {
    id: string;
    title: string;
    teacher: string;
    schedule: string;
    mode: "online" | "offline";
    level: string;
    progress: number;
    onlineMeetingUrl?: string;
  }[];
  attendance: { present: number; absent: number; late: number };
  materials: { title: string; kind: string; url: string }[];
  announcements: { title: string; body: string; when: string }[];
}

export interface TeacherData {
  classes: { id: string; title: string; students: number; schedule: string; mode: "online" | "offline" }[];
  students: { name: string; klass: string; level: string }[];
  materials: { title: string; kind: string; url: string }[];
  announcements: { title: string; body: string; when: string }[];
}

export interface AdminData {
  stats: { key: string; value: number | null }[];
}

/** Small localized "N days ago" formatter — no invented libraries needed for this. */
export function relativeTime(iso: string, locale: Locale): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays <= 0) return locale === "fa" ? "امروز" : "today";
  if (diffDays === 1) return locale === "fa" ? "دیروز" : "yesterday";
  if (diffDays < 7) return locale === "fa" ? `${diffDays} روز پیش` : `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return locale === "fa" ? `${weeks} هفته پیش` : `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US");
}

async function getAnnouncementsFor(
  audience: "student" | "teacher",
  classIds: string[],
  locale: Locale,
): Promise<{ title: string; body: string; when: string }[]> {
  const supabase = await createClient();
  const orClause =
    classIds.length > 0
      ? `class_id.is.null,class_id.in.(${classIds.join(",")})`
      : "class_id.is.null";
  const { data } = await supabase
    .from("announcements")
    .select("title, body, created_at")
    .in("audience", ["all", audience])
    .or(orClause)
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    data?.map((a) => ({
      title: a.title,
      body: a.body ?? "",
      when: relativeTime(a.created_at, locale),
    })) ?? []
  );
}

export async function getStudentData(session: SessionCtx, locale: Locale): Promise<StudentData> {
  if (session.demo) {
    return {
      classes: demoStudentClasses.map((c) => ({
        id: c.id,
        title: pick(c.title, locale),
        teacher: pick(c.teacher, locale),
        schedule: pick(c.schedule, locale),
        mode: c.mode,
        level: pick(c.level, locale),
        progress: c.progress,
        onlineMeetingUrl: c.onlineMeetingUrl,
      })),
      attendance: demoAttendance,
      materials: demoMaterials.map((m) => ({ title: pick(m.title, locale), kind: m.kind, url: "" })),
      announcements: demoAnnouncements.map((a) => ({
        title: pick(a.title, locale),
        body: pick(a.body, locale),
        when: pick(a.when, locale),
      })),
    };
  }

  const empty: StudentData = {
    classes: [],
    attendance: { present: 0, absent: 0, late: 0 },
    materials: [],
    announcements: [],
  };
  if (!session.id) return empty;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("enrollments")
      .select("id, level, progress, classes(id, title, schedule, online_meeting_url, teacher:profiles(full_name))");

    const classes =
      data?.map((e) => {
        const rel = e.classes as unknown;
        const c = ((Array.isArray(rel) ? rel[0] : rel) as Record<string, unknown> | undefined) ?? {};
        const teacherRel = c.teacher as unknown;
        const teacher = (Array.isArray(teacherRel) ? teacherRel[0] : teacherRel) as
          | { full_name?: string }
          | undefined;
        return {
          id: String(c.id ?? e.id),
          title: String(c.title ?? ""),
          teacher: teacher?.full_name ?? "",
          schedule: String(c.schedule ?? ""),
          mode: (c.online_meeting_url ? "online" : "offline") as "online" | "offline",
          level: String(e.level ?? ""),
          progress: Number(e.progress ?? 0),
          onlineMeetingUrl: (c.online_meeting_url as string) ?? undefined,
        };
      }) ?? [];

    const classIds = classes.map((c) => c.id);
    const enrollmentIds = data?.map((e) => e.id) ?? [];

    // attendance — counted across every enrollment this student has
    const attendance = { present: 0, absent: 0, late: 0 };
    if (enrollmentIds.length > 0) {
      const { data: attRows } = await supabase
        .from("attendance")
        .select("status")
        .in("enrollment_id", enrollmentIds);
      for (const row of attRows ?? []) {
        const status = row.status as AttendanceStatus;
        if (status === "present" || status === "absent" || status === "late") attendance[status] += 1;
      }
    }

    // materials for the student's classes, with a real (signed, if needed) download URL
    const materialRows = await listMaterialsForClasses(classIds);
    const materials = await Promise.all(
      materialRows.map(async (m) => ({ title: m.title, kind: m.kind, url: await resolveMaterialUrl(m.url) })),
    );

    const announcements = await getAnnouncementsFor("student", classIds, locale);

    return { classes, attendance, materials, announcements };
  } catch {
    return empty;
  }
}

export async function getTeacherData(session: SessionCtx, locale: Locale): Promise<TeacherData> {
  if (session.demo) {
    return {
      classes: demoTeacherClasses.map((c) => ({
        id: c.id,
        title: pick(c.title, locale),
        students: c.students,
        schedule: pick(c.schedule, locale),
        mode: c.mode,
      })),
      students: demoTeacherStudents.map((s) => ({
        name: pick(s.name, locale),
        klass: pick(s.klass, locale),
        level: pick(s.level, locale),
      })),
      materials: demoMaterials.map((m) => ({ title: pick(m.title, locale), kind: m.kind, url: "" })),
      announcements: demoAnnouncements.map((a) => ({
        title: pick(a.title, locale),
        body: pick(a.body, locale),
        when: pick(a.when, locale),
      })),
    };
  }

  const empty: TeacherData = { classes: [], students: [], materials: [], announcements: [] };
  if (!session.id) return empty;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("classes")
      .select("id, title, schedule, online_meeting_url, enrollments(count)")
      .eq("teacher_id", session.id);

    const classes =
      data?.map((c) => {
        const countRel = c.enrollments as unknown;
        const countRow = (Array.isArray(countRel) ? countRel[0] : countRel) as { count?: number } | undefined;
        return {
          id: String(c.id),
          title: String(c.title ?? ""),
          students: countRow?.count ?? 0,
          schedule: String(c.schedule ?? ""),
          mode: (c.online_meeting_url ? "online" : "offline") as "online" | "offline",
        };
      }) ?? [];

    const classIds = classes.map((c) => c.id);

    let students: TeacherData["students"] = [];
    if (classIds.length > 0) {
      const { data: enrollmentRows } = await supabase
        .from("enrollments")
        .select("level, student:profiles(full_name), classes(title)")
        .in("class_id", classIds);
      students =
        enrollmentRows?.map((e) => {
          const studentRel = e.student as unknown;
          const student = (Array.isArray(studentRel) ? studentRel[0] : studentRel) as
            | { full_name?: string }
            | undefined;
          const classRel = e.classes as unknown;
          const klass = (Array.isArray(classRel) ? classRel[0] : classRel) as { title?: string } | undefined;
          return {
            name: student?.full_name ?? "",
            klass: klass?.title ?? "",
            level: e.level ?? "",
          };
        }) ?? [];
    }

    const materialRows = await listMaterialsForClasses(classIds);
    const materials = await Promise.all(
      materialRows.map(async (m) => ({ title: m.title, kind: m.kind, url: await resolveMaterialUrl(m.url) })),
    );

    const announcements = await getAnnouncementsFor("teacher", classIds, locale);

    return { classes, students, materials, announcements };
  } catch {
    return empty;
  }
}

/** Full profile row for the signed-in user, for the profile edit page. Null in demo mode. */
export async function getMyProfile(session: SessionCtx): Promise<Profile | null> {
  if (session.demo || !session.id) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", session.id).maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getAdminData(session: SessionCtx, locale: Locale): Promise<AdminData> {
  const labels = demoAdminStats.map((s) => pick(s.key, locale));
  if (session.demo) {
    return { stats: labels.map((key) => ({ key, value: null })) };
  }
  try {
    const supabase = await createClient();
    const [students, teachers, courses, classes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }).eq("status", "active"),
    ]);
    const counts = [students.count, teachers.count, courses.count, classes.count];
    return { stats: labels.map((key, i) => ({ key, value: counts[i] ?? 0 })) };
  } catch {
    return { stats: labels.map((key) => ({ key, value: null })) };
  }
}
