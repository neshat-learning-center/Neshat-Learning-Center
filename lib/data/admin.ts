import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import type {
  Profile,
  CourseRow,
  ClassRow,
  BookRow,
  BlogPostRow,
  Announcement,
  Enrollment,
  Lead,
} from "@/lib/supabase/types";

/**
 * Admin-only reads: full rows (including id) for populating list tables and
 * edit forms. These only make sense against a real Supabase project — pages
 * that use them check `isSupabaseConfigured()` themselves and show a "connect
 * Supabase" notice otherwise, same as the profile page in Phase A.
 */

export async function listStudents(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** id → email, for admin lists. Requires the service-role key; returns {} without it. */
export async function getUserEmails(): Promise<Record<string, string>> {
  if (!isServiceRoleConfigured()) return {};
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const map: Record<string, string> = {};
    for (const u of data?.users ?? []) {
      if (u.email) map[u.id] = u.email;
    }
    return map;
  } catch {
    return {};
  }
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listTeachers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listStudentEnrollments(
  studentId: string,
): Promise<{ id: string; classTitle: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id, classes(title)")
    .eq("student_id", studentId);
  return (
    data?.map((e) => {
      const rel = e.classes as unknown;
      const c = (Array.isArray(rel) ? rel[0] : rel) as { title?: string } | undefined;
      return { id: e.id, classTitle: c?.title ?? "" };
    }) ?? []
  );
}

export async function listCoursesAdmin(): Promise<(CourseRow & { teacherName: string | null })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*, teacher:profiles(full_name)")
    .order("created_at", { ascending: false });
  return (
    data?.map((row) => {
      const rel = row.teacher as unknown;
      const t = (Array.isArray(rel) ? rel[0] : rel) as { full_name?: string } | undefined;
      return { ...row, teacherName: t?.full_name ?? null };
    }) ?? []
  );
}

export async function getCourseById(id: string): Promise<CourseRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listClassesAdmin(): Promise<
  (ClassRow & { courseTitle: string | null; teacherName: string | null })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("*, course:courses(title), teacher:profiles(full_name)")
    .order("created_at", { ascending: false });
  return (
    data?.map((row) => {
      const courseRel = row.course as unknown;
      const teacherRel = row.teacher as unknown;
      const course = (Array.isArray(courseRel) ? courseRel[0] : courseRel) as
        | { title?: Record<string, string> }
        | undefined;
      const teacher = (Array.isArray(teacherRel) ? teacherRel[0] : teacherRel) as
        | { full_name?: string }
        | undefined;
      return {
        ...row,
        courseTitle: course?.title ? (course.title.fa ?? course.title.en ?? null) : null,
        teacherName: teacher?.full_name ?? null,
      };
    }) ?? []
  );
}

export async function getClassById(id: string): Promise<ClassRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listClassEnrollments(
  classId: string,
): Promise<(Enrollment & { studentName: string | null })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, student:profiles(full_name)")
    .eq("class_id", classId);
  return (
    data?.map((row) => {
      const rel = row.student as unknown;
      const s = (Array.isArray(rel) ? rel[0] : rel) as { full_name?: string } | undefined;
      return { ...row, studentName: s?.full_name ?? null };
    }) ?? []
  );
}

export async function listBooksAdmin(): Promise<BookRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getBookById(id: string): Promise<BookRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listAnnouncementsAdmin(): Promise<
  (Announcement & { classTitle: string | null })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, class:classes(title)")
    .order("created_at", { ascending: false });
  return (
    data?.map((row) => {
      const rel = row.class as unknown;
      const c = (Array.isArray(rel) ? rel[0] : rel) as { title?: string } | undefined;
      return { ...row, classTitle: c?.title ?? null };
    }) ?? []
  );
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listPostsAdmin(): Promise<BlogPostRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPostById(id: string): Promise<BlogPostRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

/** For select dropdowns: id + display name. */
export async function listTeacherOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .order("full_name", { ascending: true });
  return data?.map((t) => ({ id: t.id, name: t.full_name ?? t.id })) ?? [];
}

export async function listCourseOptions(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title")
    .order("created_at", { ascending: false });
  return data?.map((c) => ({ id: c.id, title: c.title?.fa ?? c.title?.en ?? c.id })) ?? [];
}

export async function listClassOptions(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, title")
    .order("created_at", { ascending: false });
  return data?.map((c) => ({ id: c.id, title: c.title })) ?? [];
}
