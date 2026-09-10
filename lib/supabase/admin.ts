import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./config";

/**
 * Service-role client — bypasses RLS entirely. Only import this from server
 * actions, and only for the handful of operations the anon key genuinely
 * can't do (creating or deleting a user's login via the Auth admin API).
 * Never import this into a client component or route it through an API
 * response; the `server-only` import above makes an accidental client-side
 * import a build error rather than a leaked secret.
 */
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
