import { redirect } from "next/navigation";
import { getSession, type SessionCtx } from "@/lib/auth";
import { href } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

/** Every /dashboard/admin/* page calls this first: must be signed in and admin. */
export async function requireAdminSession(locale: Locale): Promise<SessionCtx> {
  const session = await getSession();
  if (!session) redirect(href(locale, "/login"));
  if (session.role !== "admin") redirect(href(locale, "/dashboard"));
  return session;
}
