import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/lib/supabase/types";

export interface RosterEntry {
  enrollmentId: string;
  studentName: string;
  status: AttendanceStatus;
}

/** A class's enrolled students plus today's attendance status, if already marked. */
export async function getClassRosterForToday(classId: string): Promise<RosterEntry[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, student:profiles(full_name)")
    .eq("class_id", classId);

  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("enrollment_id, status")
    .eq("session_date", today);

  const statusByEnrollment = new Map(attendanceRows?.map((r) => [r.enrollment_id, r.status]) ?? []);

  return (
    enrollments?.map((e) => {
      const rel = e.student as unknown;
      const student = (Array.isArray(rel) ? rel[0] : rel) as { full_name?: string } | undefined;
      return {
        enrollmentId: e.id,
        studentName: student?.full_name ?? "—",
        status: statusByEnrollment.get(e.id) ?? "present",
      };
    }) ?? []
  );
}

/** Class title + whether `userId` is allowed to mark attendance for it (its teacher, or admin). */
export async function getClassForAttendance(
  classId: string,
  userId: string,
  isAdmin: boolean,
): Promise<{ title: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select("title, teacher_id").eq("id", classId).maybeSingle();
  if (!data) return null;
  if (!isAdmin && data.teacher_id !== userId) return null;
  return { title: data.title };
}
