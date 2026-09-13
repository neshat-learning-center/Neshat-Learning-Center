"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

export type HomeworkFormState = { error?: string; success?: boolean };

/** Teacher creates a homework assignment for one of their own classes. */
export async function createHomework(
  locale: Locale,
  classId: string,
  _prev: HomeworkFormState,
  formData: FormData,
): Promise<HomeworkFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  if (!title) return { error: "missing-fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const { error } = await supabase.from("homeworks").insert({
    class_id: classId,
    teacher_id: user.id,
    title,
    description: description || null,
    file_url: fileUrl || null,
    due_date: dueDate || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
  return { success: true };
}

/** Removes the homework row; also removes the underlying storage object when
 * the teacher attached an uploaded file (path-only, not an external link). */
export async function deleteHomework(locale: Locale, classId: string, homeworkId: string, fileUrl: string | null): Promise<void> {
  const supabase = await createClient();
  await supabase.from("homeworks").delete().eq("id", homeworkId);
  if (fileUrl && !fileUrl.startsWith("http")) {
    await supabase.storage.from("homework").remove([fileUrl]);
  }
  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
}

/** Student submits (or re-submits) their work for a homework assignment. */
export async function submitHomework(
  locale: Locale,
  homeworkId: string,
  _prev: HomeworkFormState,
  formData: FormData,
): Promise<HomeworkFormState> {
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  if (!fileUrl) return { error: "missing-file" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const { error } = await supabase
    .from("homework_submissions")
    .upsert(
      { homework_id: homeworkId, student_id: user.id, file_url: fileUrl, submitted_at: new Date().toISOString() },
      { onConflict: "homework_id,student_id" },
    );
  if (error) return { error: error.message };

  revalidatePath(`/${locale}/dashboard`);
  return { success: true };
}

/** Teacher grades one student's submission (creating the submission row first
 * if the student hadn't uploaded anything yet — e.g. an in-person hand-in). */
export async function gradeSubmission(
  locale: Locale,
  homeworkId: string,
  studentId: string,
  _prev: HomeworkFormState,
  formData: FormData,
): Promise<HomeworkFormState> {
  const gradeRaw = String(formData.get("grade") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();
  const grade = gradeRaw === "" ? null : Number(gradeRaw);
  if (grade !== null && Number.isNaN(grade)) return { error: "invalid-grade" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const { error } = await supabase.from("homework_submissions").upsert(
    {
      homework_id: homeworkId,
      student_id: studentId,
      grade,
      feedback: feedback || null,
      graded_at: new Date().toISOString(),
      graded_by: user.id,
    },
    { onConflict: "homework_id,student_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/${locale}/dashboard/homework/${homeworkId}`);
  return { success: true };
}
