"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/lib/supabase/types";

export type ProfileFormState = { error?: string; success?: boolean };

export async function updateProfile(
  locale: Locale,
  role: Role,
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  if (!isSupabaseConfigured()) return { error: "not-configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const update: Record<string, unknown> = {
    full_name: String(formData.get("name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    avatar_url: String(formData.get("avatar_url") ?? "").trim() || null,
  };

  if (role === "teacher") {
    update.bio = {
      fa: String(formData.get("bio_fa") ?? "").trim(),
      en: String(formData.get("bio_en") ?? "").trim(),
    };
    update.specialty = {
      fa: String(formData.get("specialty_fa") ?? "").trim(),
      en: String(formData.get("specialty_en") ?? "").trim(),
    };
    update.languages = {
      fa: String(formData.get("languages_fa") ?? "").trim(),
      en: String(formData.get("languages_en") ?? "").trim(),
    };
    const slug = String(formData.get("slug") ?? "").trim();
    if (slug) update.slug = slug;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/${locale}/dashboard/profile`);
  return { success: true };
}
