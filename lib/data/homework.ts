import { createClient } from "@/lib/supabase/server";
import type { HomeworkRow, HomeworkSubmissionRow } from "@/lib/supabase/types";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

/** External links are used as-is; uploaded files get a short-lived signed URL. */
export async function resolveHomeworkUrl(path: string): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("homework").createSignedUrl(path, SIGNED_URL_TTL);
    return data?.signedUrl ?? "";
  } catch {
    return "";
  }
}

export async function listHomeworkForClass(classId: string): Promise<HomeworkRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("homeworks")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Homework across every class a teacher teaches — for their profile overview. */
export async function listHomeworkForClasses(classIds: string[]): Promise<HomeworkRow[]> {
  if (classIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("homeworks")
    .select("*")
    .in("class_id", classIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getHomeworkById(homeworkId: string): Promise<HomeworkRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("homeworks").select("*").eq("id", homeworkId).maybeSingle();
  return data ?? null;
}

/** Homework across every class a student is enrolled in, with that student's
 * own submission (if any) attached. */
export async function listHomeworkForStudent(
  classIds: string[],
  studentId: string,
): Promise<{ homework: HomeworkRow; submission: HomeworkSubmissionRow | null }[]> {
  if (classIds.length === 0) return [];
  const supabase = await createClient();
  const { data: homeworks } = await supabase
    .from("homeworks")
    .select("*")
    .in("class_id", classIds)
    .order("created_at", { ascending: false });
  if (!homeworks || homeworks.length === 0) return [];

  const { data: submissions } = await supabase
    .from("homework_submissions")
    .select("*")
    .eq("student_id", studentId)
    .in("homework_id", homeworks.map((h) => h.id));
  const byHomework = new Map(submissions?.map((s) => [s.homework_id, s]) ?? []);

  return homeworks.map((h) => ({ homework: h, submission: byHomework.get(h.id) ?? null }));
}

export interface RosterSubmission {
  studentId: string;
  studentName: string;
  submission: HomeworkSubmissionRow | null;
}

/** Every student enrolled in a homework's class, with their submission (if any)
 * — a full roster, not just the students who already submitted. */
export async function listSubmissionsForHomework(homeworkId: string, classId: string): Promise<RosterSubmission[]> {
  const supabase = await createClient();
  const [{ data: enrollments }, { data: submissions }] = await Promise.all([
    supabase.from("enrollments").select("student_id, student:profiles(full_name)").eq("class_id", classId),
    supabase.from("homework_submissions").select("*").eq("homework_id", homeworkId),
  ]);

  const byStudent = new Map(submissions?.map((s) => [s.student_id, s]) ?? []);

  return (
    enrollments?.map((e) => {
      const rel = e.student as unknown;
      const student = (Array.isArray(rel) ? rel[0] : rel) as { full_name?: string } | undefined;
      return {
        studentId: e.student_id,
        studentName: student?.full_name ?? "—",
        submission: byStudent.get(e.student_id) ?? null,
      };
    }) ?? []
  );
}

export interface ScoreRow {
  submissionId: string;
  homeworkTitle: string;
  classTitle: string;
  grade: number;
  feedback: string | null;
  gradedAt: string | null;
}

/** Every graded submission for one student, across all their classes. */
export async function listStudentScores(studentId: string): Promise<ScoreRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("homework_submissions")
    .select("id, grade, feedback, graded_at, homework:homeworks(title, class:classes(title))")
    .eq("student_id", studentId)
    .not("grade", "is", null)
    .order("graded_at", { ascending: false });

  return (
    data?.map((row) => {
      const hwRel = row.homework as unknown;
      const hw = (Array.isArray(hwRel) ? hwRel[0] : hwRel) as { title?: string; class?: unknown } | undefined;
      const classRel = hw?.class;
      const klass = (Array.isArray(classRel) ? classRel[0] : classRel) as { title?: string } | undefined;
      return {
        submissionId: row.id,
        homeworkTitle: hw?.title ?? "",
        classTitle: klass?.title ?? "",
        grade: Number(row.grade),
        feedback: row.feedback,
        gradedAt: row.graded_at,
      };
    }) ?? []
  );
}

/** Every graded submission a teacher has given, across all their classes. */
export async function listTeacherScores(teacherId: string): Promise<(ScoreRow & { studentName: string })[]> {
  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, title").eq("teacher_id", teacherId);
  const classIds = classes?.map((c) => c.id) ?? [];
  if (classIds.length === 0) return [];
  const classTitleById = new Map(classes?.map((c) => [c.id, c.title]) ?? []);

  const { data: homeworks } = await supabase.from("homeworks").select("id, title, class_id").in("class_id", classIds);
  if (!homeworks || homeworks.length === 0) return [];
  const homeworkById = new Map(homeworks.map((h) => [h.id, h]));

  const { data: submissions } = await supabase
    .from("homework_submissions")
    .select("id, homework_id, grade, feedback, graded_at, student:profiles(full_name)")
    .in("homework_id", homeworks.map((h) => h.id))
    .not("grade", "is", null)
    .order("graded_at", { ascending: false });

  return (
    submissions?.map((row) => {
      const rel = row.student as unknown;
      const student = (Array.isArray(rel) ? rel[0] : rel) as { full_name?: string } | undefined;
      const hw = homeworkById.get(row.homework_id);
      return {
        submissionId: row.id,
        homeworkTitle: hw?.title ?? "",
        classTitle: (hw ? classTitleById.get(hw.class_id) : "") ?? "",
        grade: Number(row.grade),
        feedback: row.feedback,
        gradedAt: row.graded_at,
        studentName: student?.full_name ?? "—",
      };
    }) ?? []
  );
}
