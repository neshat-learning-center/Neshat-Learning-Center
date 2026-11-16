"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import { jt } from "@/lib/join/labels";

export type JoinState = { ok?: boolean; status?: string; message?: string; error?: string };

const done = (locale: Locale) => {
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/classes`, "layout");
};

function friendly(locale: Locale, msg: string): string {
  const t = jt(locale);
  const m = msg.toLowerCase();
  if (m.includes("too many")) return t("tooMany");
  if (m.includes("not allowed")) return t("generic");
  return t("generic");
}

/** Student enters a class code. All rules (rate limit, capacity, approval) live in the database function. */
export async function joinClassByCode(locale: Locale, _prev: JoinState, fd: FormData): Promise<JoinState> {
  const t = jt(locale);
  if (!isSupabaseConfigured()) return { error: t("notConnected") };
  const code = String(fd.get("code") ?? "").trim();
  if (code.replace(/[^A-Za-z0-9]/g, "").length < 6) return { error: t("invalid") };
  const sb = await createClient();
  const { data, error } = await sb.rpc("join_class_by_code", { p_code: code });
  if (error) return { error: friendly(locale, error.message) };
  const row = (Array.isArray(data) ? data[0] : data) as { out_status: string } | undefined;
  const status = row?.out_status ?? "invalid";
  done(locale);
  if (status === "joined" || status === "pending" || status === "already") {
    return { ok: true, status, message: t(status as "joined" | "pending" | "already") };
  }
  return { status, error: t(status === "full" ? "full" : status === "closed" ? "closed" : "invalid") };
}

/** "I don't have the code": ask the class's teacher to approve. */
export async function requestJoinClass(locale: Locale, _prev: JoinState, fd: FormData): Promise<JoinState> {
  const t = jt(locale);
  if (!isSupabaseConfigured()) return { error: t("notConnected") };
  const classId = String(fd.get("class_id") ?? "");
  if (!classId) return { error: t("pickPh") };
  const sb = await createClient();
  const { data, error } = await sb.rpc("request_join_class", { p_class: classId });
  if (error) return { error: friendly(locale, error.message) };
  done(locale);
  if (data === "pending") return { ok: true, status: "pending", message: t("pending") };
  if (data === "already") return { ok: true, status: "already", message: t("already") };
  return { error: t("closed") };
}

export async function cancelJoinRequest(locale: Locale, classId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = await createClient();
  await sb.rpc("cancel_join_request", { p_class: classId });
  done(locale);
}

export async function decideJoinRequest(locale: Locale, classId: string, requestId: string, approve: boolean): Promise<{ error?: string }> {
  const t = jt(locale);
  if (!isSupabaseConfigured()) return { error: t("notConnected") };
  const sb = await createClient();
  const { error } = await sb.rpc("decide_join_request", { p_request: requestId, p_approve: approve });
  if (error) return { error: error.message.toLowerCase().includes("full") ? t("classFull") : t("generic") };
  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
  return {};
}

export async function regenerateJoinCode(locale: Locale, classId: string): Promise<{ code?: string; error?: string }> {
  const t = jt(locale);
  if (!isSupabaseConfigured()) return { error: t("notConnected") };
  const sb = await createClient();
  const { data, error } = await sb.rpc("regenerate_join_code", { p_class: classId });
  if (error) return { error: t("generic") };
  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
  return { code: String(data) };
}

export async function setJoinApproval(locale: Locale, classId: string, on: boolean): Promise<{ error?: string }> {
  const t = jt(locale);
  if (!isSupabaseConfigured()) return { error: t("notConnected") };
  const sb = await createClient();
  const { error } = await sb.rpc("set_join_approval", { p_class: classId, p_on: on });
  if (error) return { error: t("generic") };
  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
  return {};
}

/** Teacher (own class) or admin sets a student's level + progress; the student sees it on their dashboard. */
export async function saveEnrollmentProgress(
  locale: Locale,
  classId: string,
  enrollmentId: string,
  level: string,
  progress: number,
): Promise<{ ok?: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { error: jt(locale)("notConnected") };
  const p = Math.round(Number(progress));
  if (!Number.isFinite(p) || p < 0 || p > 100) return { error: jt(locale)("generic") };
  const sb = await createClient();
  const { error } = await sb.rpc("set_enrollment_progress", { p_enrollment: enrollmentId, p_level: level.trim().slice(0, 40), p_progress: p });
  if (error) return { error: jt(locale)("generic") };
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/classes/${classId}`);
  revalidatePath(`/${locale}/dashboard/admin/classes/${classId}/edit`);
  return { ok: true };
}
