"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export type AdminFormState = { error?: string };

function readBookFields(formData: FormData) {
  const title_fa = String(formData.get("title_fa") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  return {
    slug: String(formData.get("slug") ?? "").trim() || slugify(title_en || title_fa),
    title: { fa: title_fa, en: title_en },
    language: String(formData.get("language") ?? "").trim() || null,
    level: {
      fa: String(formData.get("level_fa") ?? "").trim(),
      en: String(formData.get("level_en") ?? "").trim(),
    },
    kind: {
      fa: String(formData.get("kind_fa") ?? "").trim(),
      en: String(formData.get("kind_en") ?? "").trim(),
    },
    description: {
      fa: String(formData.get("description_fa") ?? "").trim(),
      en: String(formData.get("description_en") ?? "").trim(),
    },
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    file_url: String(formData.get("file_url") ?? "").trim() || null,
  };
}

export async function createBook(
  locale: Locale,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").insert(readBookFields(formData));
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/books`);
  redirect(`/${locale}/dashboard/admin/books`);
}

export async function updateBook(
  locale: Locale,
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const fields = readBookFields(formData);
  const { error } = await supabase.from("books").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/books`);
  revalidatePath(`/${locale}/books/${fields.slug}`);
  redirect(`/${locale}/dashboard/admin/books`);
}

export async function deleteBook(locale: Locale, id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("books").delete().eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/books`);
}
