"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export type AdminFormState = { error?: string };

function readCourseFields(formData: FormData) {
  const title_fa = String(formData.get("title_fa") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const capacity = String(formData.get("capacity") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const teacher_id = String(formData.get("teacher_id") ?? "").trim();

  return {
    slug: String(formData.get("slug") ?? "").trim() || slugify(title_en || title_fa),
    title: { fa: title_fa, en: title_en },
    language: String(formData.get("language") ?? "").trim(),
    level: {
      fa: String(formData.get("level_fa") ?? "").trim(),
      en: String(formData.get("level_en") ?? "").trim(),
    },
    age_group: String(formData.get("age_group") ?? "").trim() || null,
    mode: String(formData.get("mode") ?? "both"),
    summary: {
      fa: String(formData.get("summary_fa") ?? "").trim(),
      en: String(formData.get("summary_en") ?? "").trim(),
    },
    schedule: {
      fa: String(formData.get("schedule_fa") ?? "").trim(),
      en: String(formData.get("schedule_en") ?? "").trim(),
    },
    capacity: capacity ? Number(capacity) : null,
    teacher_id: teacher_id || null,
    price: price ? Number(price) : null,
    duration: String(formData.get("duration") ?? "").trim() || null,
  };
}

export async function createCourse(
  locale: Locale,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert(readCourseFields(formData));
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/courses`);
  redirect(`/${locale}/dashboard/admin/courses`);
}

export async function updateCourse(
  locale: Locale,
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const fields = readCourseFields(formData);
  const { error } = await supabase.from("courses").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/courses`);
  revalidatePath(`/${locale}/courses/${fields.slug}`);
  redirect(`/${locale}/dashboard/admin/courses`);
}

export async function deleteCourse(locale: Locale, id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/courses`);
}
