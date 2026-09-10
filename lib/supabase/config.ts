export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
// Server-only — never prefixed with NEXT_PUBLIC_, never sent to the browser.
// Needed only for admin actions the anon key can't do (creating/deleting a
// teacher's login). Get it from Supabase → Settings → API → "service_role".
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * When Supabase env vars are absent the app still runs: auth-gated areas fall
 * back to a clearly-labelled demo mode so the UI is reviewable before a backend
 * is connected. Set the two NEXT_PUBLIC_SUPABASE_* vars to switch to real data.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Whether admin-only account operations (create/delete a teacher login) are available. */
export function isServiceRoleConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}
