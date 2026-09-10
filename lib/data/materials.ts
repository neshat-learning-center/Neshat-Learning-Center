import { createClient } from "@/lib/supabase/server";
import type { Material } from "@/lib/supabase/types";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

/** External links are used as-is; uploaded files get a short-lived signed URL. */
export async function resolveMaterialUrl(path: string): Promise<string> {
  if (path.startsWith("http")) return path;
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("materials").createSignedUrl(path, SIGNED_URL_TTL);
    return data?.signedUrl ?? "";
  } catch {
    return "";
  }
}

export async function listMaterialsForClass(classId: string): Promise<Material[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Materials across every class a student is enrolled in, or a teacher teaches. */
export async function listMaterialsForClasses(classIds: string[]): Promise<Material[]> {
  if (classIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("*")
    .in("class_id", classIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}
