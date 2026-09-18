"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";

export type AdminFormState = { error?: string };

/** Students register themselves at /signup — admin can edit or remove an account. */
export async function updateStudent(
  locale: Locale,
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      avatar_url: String(formData.get("avatar_url") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/${locale}/dashboard/admin/students`);
  redirect(`/${locale}/dashboard/admin/students`);
}

export async function deleteStudent(locale: Locale, id: string): Promise<void> {
  if (!isServiceRoleConfigured()) {
    throw new Error("service-role-missing");
  }
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id); // cascades to delete the profiles row
  revalidatePath(`/${locale}/dashboard/admin/students`);
  redirect(`/${locale}/dashboard/admin/students`);
}
