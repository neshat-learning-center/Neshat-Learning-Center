"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

/** Student enrolls themselves — RLS only allows inserting a row with their
 * own student_id, and the unique(student_id, class_id) constraint makes a
 * double-click harmless rather than a duplicate enrollment. */
export async function enrollInClass(locale: Locale, courseSlug: string, classId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: cls } = await supabase.from("classes").select("capacity").eq("id", classId).maybeSingle();
  if (cls?.capacity != null) {
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId);
    if ((count ?? 0) >= cls.capacity) return;
  }

  await supabase.from("enrollments").insert({ student_id: user.id, class_id: classId });
  revalidatePath(`/${locale}/courses/${courseSlug}`);
  revalidatePath(`/${locale}/dashboard`);
}

export async function unenrollFromClass(locale: Locale, courseSlug: string, classId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("enrollments").delete().eq("class_id", classId).eq("student_id", user.id);
  revalidatePath(`/${locale}/courses/${courseSlug}`);
  revalidatePath(`/${locale}/dashboard`);
}
