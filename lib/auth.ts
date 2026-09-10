import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/supabase/types";

export const DEMO_COOKIE = "neshat_demo_role";

export interface SessionCtx {
  id: string | null; // null in demo mode — no real profile row to edit
  role: Role;
  name: string;
  email?: string;
  demo: boolean;
}

/**
 * Returns the current session context, or null if signed out.
 * Real mode reads Supabase auth + the profile role. Demo mode (no Supabase env)
 * reads a role cookie so the three dashboards remain reviewable.
 */
export async function getSession(): Promise<SessionCtx | null> {
  if (!isSupabaseConfigured()) {
    const store = await cookies();
    const role = store.get(DEMO_COOKIE)?.value as Role | undefined;
    if (!role) return null;
    const names: Record<Role, string> = {
      admin: "مدیر نشاط",
      teacher: "مدرس نشاط",
      student: "زبان‌آموز نشاط",
    };
    return { id: null, role, name: names[role], demo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: (profile?.role ?? "student") as Role,
    name: profile?.full_name ?? user.email ?? "",
    email: user.email ?? undefined,
    demo: false,
  };
}
