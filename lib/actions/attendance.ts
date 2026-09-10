"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import type { AttendanceStatus } from "@/lib/supabase/types";

export type AttendanceFormState = { error?: string; success?: boolean };

/** Marks today's attendance for every enrollment in a class in one submit. */
export async function recordAttendance(
  locale: Locale,
  classId: string,
  _prev: AttendanceFormState,
  formData: FormData,
): Promise<AttendanceFormState> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const rows: { enrollment_id: string; session_date: string; status: AttendanceStatus }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status_")) continue;
    const enrollmentId = key.slice("status_".length);
    rows.push({
      enrollment_id: enrollmentId,
      session_date: today,
      status: value as AttendanceStatus,
    });
  }
  if (rows.length === 0) return { error: "no-students" };

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "enrollment_id,session_date" });
  if (error) return { error: error.message };

  revalidatePath(`/${locale}/dashboard/attendance/${classId}`);
  return { success: true };
}
