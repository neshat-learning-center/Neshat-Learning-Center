"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type LeadFormState = { error?: string; success?: boolean };

export async function submitLead(
  kind: "placement" | "contact",
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) return { error: "missing-fields" };

  if (!isSupabaseConfigured()) {
    // Demo mode: nothing to persist to yet — still confirm to the visitor.
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    kind,
    name,
    phone,
    email: String(formData.get("email") ?? "").trim() || null,
    language: String(formData.get("language") ?? "").trim() || null,
    level: String(formData.get("level") ?? "").trim() || null,
    message: String(formData.get("message") ?? "").trim() || null,
  });
  if (error) return { error: error.message };
  return { success: true };
}
