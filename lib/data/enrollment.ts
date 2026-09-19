import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export interface EnrollableClass {
  id: string;
  schedule: string | null;
  teacherName: string | null;
  classroom: string | null;
  mode: "online" | "offline";
  /** Only populated once the viewer is enrolled in this specific class —
   * the meeting link isn't public information. */
  onlineMeetingUrl: string | null;
  enrolled: boolean;
  capacity: number | null;
  enrolledCount: number;
  full: boolean;
}

/** The real Supabase course row id for a course slug — null if this course
 * only exists as seed/demo content (no live classes to enroll into). */
export async function getCourseIdBySlug(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

/** Open classes for a course, with whether `studentId` is already enrolled
 * in each one (null studentId — e.g. not logged in as a student — means
 * "not enrolled" for all of them). */
export async function listEnrollableClasses(
  courseId: string,
  studentId: string | null,
): Promise<EnrollableClass[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, schedule, classroom, online_meeting_url, capacity, teacher:profiles(full_name)")
    .eq("course_id", courseId)
    .in("status", ["upcoming", "active"]);

  if (!classes || classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);

  let enrolledIds = new Set<string>();
  if (studentId) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_id", studentId)
      .in("class_id", classIds);
    enrolledIds = new Set(enrollments?.map((e) => e.class_id) ?? []);
  }

  // Counting every class's total enrollment (not just the viewer's own) needs
  // to see across all students — RLS on `enrollments` only lets a viewer read
  // their own row (or, for a teacher/admin, their own classes'), so this uses
  // the service-role client for the count only. Never returns raw rows to the
  // client — just the aggregated numbers below — so no student PII leaks.
  const enrolledCounts = new Map<string, number>();
  if (isServiceRoleConfigured()) {
    const admin = createAdminClient();
    const { data: allEnrollments } = await admin.from("enrollments").select("class_id").in("class_id", classIds);
    for (const e of allEnrollments ?? []) {
      enrolledCounts.set(e.class_id, (enrolledCounts.get(e.class_id) ?? 0) + 1);
    }
  }

  return classes.map((c) => {
    const rel = c.teacher as unknown;
    const teacher = (Array.isArray(rel) ? rel[0] : rel) as { full_name?: string } | undefined;
    const enrolledCount = enrolledCounts.get(c.id) ?? 0;
    const enrolled = enrolledIds.has(c.id);
    return {
      id: c.id,
      schedule: c.schedule,
      teacherName: teacher?.full_name ?? null,
      classroom: c.classroom,
      mode: c.online_meeting_url ? "online" : "offline",
      onlineMeetingUrl: enrolled ? c.online_meeting_url : null,
      enrolled,
      capacity: c.capacity,
      enrolledCount,
      full: c.capacity != null && enrolledCount >= c.capacity,
    };
  });
}
