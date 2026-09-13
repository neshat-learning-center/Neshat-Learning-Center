import { createClient } from "@/lib/supabase/server";

export interface EnrollableClass {
  id: string;
  schedule: string | null;
  teacherName: string | null;
  mode: "online" | "offline";
  enrolled: boolean;
}

/** The real Supabase course row id for a course slug — null if this course
 * only exists as seed/demo content (no live classes to enroll into). */
export async function getCourseIdBySlug(slug: string): Promise<string | null> {
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
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, schedule, online_meeting_url, teacher:profiles(full_name)")
    .eq("course_id", courseId)
    .in("status", ["upcoming", "active"]);

  if (!classes || classes.length === 0) return [];

  let enrolledIds = new Set<string>();
  if (studentId) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_id", studentId)
      .in(
        "class_id",
        classes.map((c) => c.id),
      );
    enrolledIds = new Set(enrollments?.map((e) => e.class_id) ?? []);
  }

  return classes.map((c) => {
    const rel = c.teacher as unknown;
    const teacher = (Array.isArray(rel) ? rel[0] : rel) as { full_name?: string } | undefined;
    return {
      id: c.id,
      schedule: c.schedule,
      teacherName: teacher?.full_name ?? null,
      mode: c.online_meeting_url ? "online" : "offline",
      enrolled: enrolledIds.has(c.id),
    };
  });
}
