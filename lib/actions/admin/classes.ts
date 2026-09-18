"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import type { ClassStatus } from "@/lib/supabase/types";

export type AdminFormState = { error?: string };

function readClassFields(formData: FormData) {
  const course_id = String(formData.get("course_id") ?? "").trim();
  const teacher_id = String(formData.get("teacher_id") ?? "").trim();
  const capacity = String(formData.get("capacity") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    course_id: course_id || null,
    teacher_id: teacher_id || null,
    classroom: String(formData.get("classroom") ?? "").trim() || null,
    schedule: String(formData.get("schedule") ?? "").trim() || null,
    status: String(formData.get("status") ?? "upcoming") as ClassStatus,
    online_meeting_url: String(formData.get("online_meeting_url") ?? "").trim() || null,
    capacity: capacity ? Number(capacity) : null,
  };
}

export async function createClass(
  locale: Locale,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const fields = readClassFields(formData);
  const { error } = await supabase.from("classes").insert(fields);
  if (error) return { error: error.message };
  const returnTo = String(formData.get("return_to") ?? "").trim();
  if (returnTo) revalidatePath(`/${locale}${returnTo}`);
  revalidatePath(`/${locale}/dashboard/admin/classes`);
  redirect(`/${locale}${returnTo || "/dashboard/admin/classes"}`);
}

export async function updateClass(
  locale: Locale,
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("classes").update(readClassFields(formData)).eq("id", id);
  if (error) return { error: error.message };
  const returnTo = String(formData.get("return_to") ?? "").trim();
  if (returnTo) revalidatePath(`/${locale}${returnTo}`);
  revalidatePath(`/${locale}/dashboard/admin/classes`);
  redirect(`/${locale}${returnTo || "/dashboard/admin/classes"}`);
}

export async function deleteClass(locale: Locale, id: string, returnTo?: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", id);
  if (returnTo) revalidatePath(`/${locale}${returnTo}`);
  revalidatePath(`/${locale}/dashboard/admin/classes`);
  redirect(`/${locale}${returnTo || "/dashboard/admin/classes"}`);
}

export type EnrollState = { error?: string };

/** Enrolls a student by email — needs the service-role key to look up their account. */
export async function enrollStudent(
  locale: Locale,
  classId: string,
  _prev: EnrollState,
  formData: FormData,
): Promise<EnrollState> {
  if (!isServiceRoleConfigured()) return { error: "service-role-missing" };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "email-required" };

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) return { error: "user-not-found" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .insert({ student_id: user.id, class_id: classId });
  if (error) return { error: error.message };

  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
  return {};
}

export async function unenrollStudent(locale: Locale, classId: string, enrollmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("enrollments").delete().eq("id", enrollmentId);
  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
}
