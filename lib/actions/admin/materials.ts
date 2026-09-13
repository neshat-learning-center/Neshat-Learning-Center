"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import type { MaterialKind } from "@/lib/supabase/types";

export type AdminFormState = { error?: string };

export async function createMaterial(
  locale: Locale,
  classId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "pdf") as MaterialKind;
  const url = String(formData.get("url") ?? "").trim();
  if (!title || !url) return { error: "missing-fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("materials")
    .insert({ class_id: classId, title, kind, url, uploaded_by: user?.id ?? null });
  if (error) return { error: error.message };

  // used from both the admin class-edit page and the teacher's own class page
  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
  return {};
}

/** Removes the DB row; also removes the underlying storage object when the
 * material is an uploaded file (path-only, not an external link). */
export async function deleteMaterial(
  locale: Locale,
  classId: string,
  materialId: string,
  path: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("materials").delete().eq("id", materialId);

  if (path && !path.startsWith("http")) {
    await supabase.storage.from("materials").remove([path]);
  }

  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
}
