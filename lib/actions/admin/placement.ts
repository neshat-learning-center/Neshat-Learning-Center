"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

export async function markPlacementReviewed(locale: Locale, id: string, reviewed: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("placement_attempts").update({ reviewed }).eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/placement`);
}

export async function deletePlacementAttempt(locale: Locale, id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("placement_attempts").delete().eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/placement`);
}
