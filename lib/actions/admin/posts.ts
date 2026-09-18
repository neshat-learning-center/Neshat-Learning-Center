"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export type AdminFormState = { error?: string };

function readPostFields(formData: FormData) {
  const title_fa = String(formData.get("title_fa") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const minRead = String(formData.get("min_read") ?? "").trim();
  return {
    slug: String(formData.get("slug") ?? "").trim() || slugify(title_en || title_fa),
    title: { fa: title_fa, en: title_en },
    category: {
      fa: String(formData.get("category_fa") ?? "").trim(),
      en: String(formData.get("category_en") ?? "").trim(),
    },
    excerpt: {
      fa: String(formData.get("excerpt_fa") ?? "").trim(),
      en: String(formData.get("excerpt_en") ?? "").trim(),
    },
    body: {
      fa: String(formData.get("body_fa") ?? "").trim(),
      en: String(formData.get("body_en") ?? "").trim(),
    },
    min_read: minRead ? Number(minRead) : null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    published: formData.get("published") === "on",
  };
}

export async function createPost(
  locale: Locale,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").insert(readPostFields(formData));
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/journal`);
  revalidatePath(`/${locale}/journal`);
  redirect(`/${locale}/dashboard/admin/journal`);
}

export async function updatePost(
  locale: Locale,
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const fields = readPostFields(formData);
  const { error } = await supabase.from("blog_posts").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/journal`);
  revalidatePath(`/${locale}/journal`);
  revalidatePath(`/${locale}/journal/${fields.slug}`);
  redirect(`/${locale}/dashboard/admin/journal`);
}

export async function deletePost(locale: Locale, id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/journal`);
  revalidatePath(`/${locale}/journal`);
  redirect(`/${locale}/dashboard/admin/journal`);
}
