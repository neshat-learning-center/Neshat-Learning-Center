"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

export type AdminFormState = { error?: string };

function readAnnouncementFields(formData: FormData) {
  const class_id = String(formData.get("class_id") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim() || null,
    audience: String(formData.get("audience") ?? "all"),
    class_id: class_id || null,
  };
}

export async function createAnnouncement(
  locale: Locale,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("announcements")
    .insert({ ...readAnnouncementFields(formData), author_id: user?.id ?? null });
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/announcements`);
  redirect(`/${locale}/dashboard/admin/announcements`);
}

export async function updateAnnouncement(
  locale: Locale,
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update(readAnnouncementFields(formData))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/announcements`);
  redirect(`/${locale}/dashboard/admin/announcements`);
}

export async function deleteAnnouncement(locale: Locale, id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/announcements`);
  redirect(`/${locale}/dashboard/admin/announcements`);
}
