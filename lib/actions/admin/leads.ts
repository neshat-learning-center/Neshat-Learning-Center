"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

export async function markLeadContacted(locale: Locale, id: string, contacted: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("leads").update({ contacted }).eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/leads`);
}

export async function deleteLead(locale: Locale, id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath(`/${locale}/dashboard/admin/leads`);
}
