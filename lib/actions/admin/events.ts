"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { makeET, friendlyEventError } from "@/lib/events/labels";
import { parseToman } from "@/lib/finance/money";
import { parseEventForm } from "@/lib/events/parse";
import { eventPhase, nowMs } from "@/lib/events/time";
import { REG_STATUSES, EVENT_PAY_METHODS, type RegStatus } from "@/lib/events/types";

export type EvState = { ok?: boolean; error?: string; message?: string };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const oneOf = <T extends string>(v: string, list: readonly T[]): T | null => ((list as readonly string[]).includes(v) ? (v as T) : null);

async function guard(locale: Locale): Promise<{ id: string | null } | { error: string }> {
  const t = makeET(locale);
  if (!isSupabaseConfigured()) return { error: t("a_notConnected") };
  const s = await getSession();
  if (!s || s.role !== "admin" || s.demo) return { error: t("forbidden") };
  return { id: s.id };
}

function refresh(slug?: string) {
  for (const l of locales) {
    revalidatePath(`/${l}`); // the home page shows the next event too
    revalidatePath(`/${l}/events`);
    if (slug) revalidatePath(`/${l}/events/${slug}`);
    revalidatePath(`/${l}/dashboard/admin/events`, "layout");
  }
}

async function uniqueSlug(sb: Awaited<ReturnType<typeof createClient>>, base: string, ownId?: string) {
  let slug = base || `event-${Date.now().toString(36)}`;
  for (let i = 2; i < 50; i++) {
    const { data } = await sb.from("events").select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === ownId) return slug;
    slug = `${base || "event"}-${i}`;
  }
  return `${base || "event"}-${Date.now().toString(36)}`;
}

async function replaceGallery(sb: Awaited<ReturnType<typeof createClient>>, eventId: string, gallery: { url: string; caption: string | null }[]) {
  const del = await sb.from("event_gallery").delete().eq("event_id", eventId);
  if (del.error) throw del.error;
  if (gallery.length === 0) return;
  const ins = await sb.from("event_gallery").insert(gallery.map((g, i) => ({ event_id: eventId, url: g.url, caption: g.caption, sort_order: i })));
  if (ins.error) throw ins.error;
}

export async function saveEvent(locale: Locale, id: string | null, _prev: EvState, fd: FormData): Promise<EvState> {
  const g = await guard(locale);
  if ("error" in g) return { error: g.error };
  const t = makeET(locale);
  const parsed = parseEventForm(fd, t);
  if ("error" in parsed) return { error: parsed.error };

  let newId = id;
  try {
    const sb = await createClient();
    const slug = await uniqueSlug(sb, parsed.slug, id ?? undefined);
    if (id) {
      const { error } = await sb.from("events").update({ ...parsed.row, slug }).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await sb.from("events").insert({ ...parsed.row, slug, created_by: g.id }).select("id").single();
      if (error) throw error;
      newId = data.id as string;
    }
    await replaceGallery(sb, newId as string, parsed.gallery);
    refresh(slug);
  } catch (e) {
    const err = e as { message?: string; code?: string };
    if (err.code === "23514") return { error: t("invalidDates") };
    return { error: friendlyEventError(err.message ?? String(e), locale) };
  }
  if (!id) redirect(`/${locale}/dashboard/admin/events/${newId}/edit`);
  // publishing an event whose date is already behind us files it under "past" — say so instead of failing silently
  const row = parsed.row as { status: string; starts_at: string; ends_at: string | null };
  const past = row.status === "published" && eventPhase({ startsAt: row.starts_at, endsAt: row.ends_at, status: "published" }, nowMs()) === "past";
  return { ok: true, message: past ? t("a_pastWarn") : t("a_saved") };
}

/** Events with registrations are archived, never destroyed. Events without any can be deleted for real. */
export async function deleteEvent(locale: Locale, id: string): Promise<void> {
  const g = await guard(locale);
  if ("error" in g) return;
  const sb = await createClient();
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) await sb.from("events").update({ status: "archived", is_featured: false }).eq("id", id);
  refresh();
  redirect(`/${locale}/dashboard/admin/events`);
}

export async function archiveEvent(locale: Locale, id: string): Promise<void> {
  const g = await guard(locale);
  if ("error" in g) return;
  const sb = await createClient();
  await sb.from("events").update({ status: "archived", is_featured: false }).eq("id", id);
  refresh();
  redirect(`/${locale}/dashboard/admin/events`);
}

// ---- registrations -------------------------------------------------------------------

async function run(locale: Locale, body: (sb: Awaited<ReturnType<typeof createClient>>, t: ReturnType<typeof makeET>) => Promise<EvState | void>): Promise<EvState> {
  const g = await guard(locale);
  if ("error" in g) return { error: g.error };
  const t = makeET(locale);
  try {
    const sb = await createClient();
    const r = await body(sb, t);
    for (const l of locales) revalidatePath(`/${l}/dashboard/admin/events`, "layout");
    for (const l of locales) {
      revalidatePath(`/${l}`);
      revalidatePath(`/${l}/events`, "layout");
    }
    return r ?? { ok: true, message: t("a_saved") };
  } catch (e) {
    const err = e as { message?: string; code?: string };
    if (err.code === "23505" && /client_key/i.test(err.message ?? "")) return { ok: true, message: t("a_saved") };
    return { error: friendlyEventError(err.message ?? String(e), locale) };
  }
}

export async function setRegistrationStatus(locale: Locale, _p: EvState, fd: FormData): Promise<EvState> {
  return run(locale, async (sb, t) => {
    const status = oneOf(str(fd, "status"), REG_STATUSES) as RegStatus | null;
    if (!status) return { error: t("invalid") };
    const { error } = await sb.rpc("event_set_registration_status", { p_id: str(fd, "id"), p_status: status, p_note: str(fd, "note") || null });
    if (error) throw error;
  });
}

export async function recordEventPayment(locale: Locale, _p: EvState, fd: FormData): Promise<EvState> {
  return run(locale, async (sb, t) => {
    const amount = parseToman(str(fd, "amount"));
    const kind = oneOf(str(fd, "kind"), ["payment", "refund"] as const) ?? "payment";
    const method = oneOf(str(fd, "method"), EVENT_PAY_METHODS) ?? "cash";
    if (!amount || amount <= 0) return { error: t("invalid") };
    const { error } = await sb.rpc("event_record_payment", {
      p_registration: str(fd, "registration_id"), p_kind: kind, p_amount: amount, p_method: method,
      p_reference: str(fd, "reference"), p_paid_at: str(fd, "paid_at") || null, p_note: str(fd, "note"), p_client_key: str(fd, "client_key") || null,
    });
    if (error) throw error;
  });
}

export async function voidEventPayment(locale: Locale, _p: EvState, fd: FormData): Promise<EvState> {
  return run(locale, async (sb) => {
    const { error } = await sb.rpc("event_void_payment", { p_id: str(fd, "id"), p_reason: str(fd, "reason") });
    if (error) throw error;
  });
}

export async function setEventAttendance(locale: Locale, _p: EvState, fd: FormData): Promise<EvState> {
  return run(locale, async (sb, t) => {
    const n = Number(str(fd, "attended"));
    if (!Number.isInteger(n) || n < 0) return { error: t("invalid") };
    const { error } = await sb.rpc("event_set_attendance", { p_registration: str(fd, "registration_id"), p_attended: n });
    if (error) throw error;
  });
}

