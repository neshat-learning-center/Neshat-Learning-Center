"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";

export type AdminFormState = { error?: string };

export async function createTeacher(
  locale: Locale,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  if (!isServiceRoleConfigured()) return { error: "service-role-missing" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !data.user) return { error: error?.message ?? "create-failed" };

  // the handle_new_user trigger already created a 'student' profile row — promote it
  const { error: updateError } = await admin
    .from("profiles")
    .update({ role: "teacher", full_name: name })
    .eq("id", data.user.id);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/${locale}/dashboard/admin/teachers`);
  redirect(`/${locale}/dashboard/admin/teachers/${data.user.id}/edit`);
}

export async function updateTeacher(
  locale: Locale,
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    full_name: String(formData.get("name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    avatar_url: String(formData.get("avatar_url") ?? "").trim() || null,
    bio: {
      fa: String(formData.get("bio_fa") ?? "").trim(),
      en: String(formData.get("bio_en") ?? "").trim(),
    },
    specialty: {
      fa: String(formData.get("specialty_fa") ?? "").trim(),
      en: String(formData.get("specialty_en") ?? "").trim(),
    },
    languages: {
      fa: String(formData.get("languages_fa") ?? "").trim(),
      en: String(formData.get("languages_en") ?? "").trim(),
    },
  };
  const slug = String(formData.get("slug") ?? "").trim();
  if (slug) update.slug = slug;

  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/${locale}/dashboard/admin/teachers`);
  revalidatePath(`/${locale}/teachers/${slug}`);
  redirect(`/${locale}/dashboard/admin/teachers`);
}

export async function deleteTeacher(locale: Locale, id: string): Promise<void> {
  if (!isServiceRoleConfigured()) {
    throw new Error("service-role-missing");
  }
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);
  revalidatePath(`/${locale}/dashboard/admin/teachers`);
  redirect(`/${locale}/dashboard/admin/teachers`);
}
