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
  const price = String(formData.get("price") ?? "").trim();

  return {
    slug: String(formData.get("slug") ?? "").trim() || slugify(title_en || title_fa),
    title: { fa: title_fa, en: title_en },
    language: String(formData.get("language") ?? "").trim(),
    category: String(formData.get("category") ?? "general").trim(),
    level: {
      fa: String(formData.get("level_fa") ?? "").trim(),
      en: String(formData.get("level_en") ?? "").trim(),
    },
    age_group: String(formData.get("age_group") ?? "").trim() || null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    summary: {
      fa: String(formData.get("summary_fa") ?? "").trim(),
      en: String(formData.get("summary_en") ?? "").trim(),
    },
    price: price ? Number(price) : null,
    duration: String(formData.get("duration") ?? "").trim() || null,
  };
}

async function syncCourseBooks(courseId: string, formData: FormData) {
  const supabase = await createClient();
  const bookIds = formData.getAll("book_ids").map(String);
  await supabase.from("course_books").delete().eq("course_id", courseId);
  if (bookIds.length > 0) {
    await supabase.from("course_books").insert(bookIds.map((book_id) => ({ course_id: courseId, book_id })));
  }
}

export async function createCourse(
  locale: Locale,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").insert(readCourseFields(formData)).select("id").single();
  if (error) return { error: error.message };
  await syncCourseBooks(data.id, formData);
  revalidatePath(`/${locale}/dashboard/admin/courses`);
  redirect(`/${locale}/dashboard/admin/courses/${data.id}/edit`);
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
  await syncCourseBooks(id, formData);
  revalidatePath(`/${locale}/dashboard/admin/courses`);
  revalidatePath(`/${locale}/courses/${fields.slug}`);
  redirect(`/${locale}/dashboard/admin/courses/${id}/edit`);
}

export async function deleteCourse(locale: Locale, id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/courses`);
  redirect(`/${locale}/dashboard/admin/courses`);
}
