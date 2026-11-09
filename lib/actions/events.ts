"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import { makeET, friendlyEventError } from "@/lib/events/labels";
import { isValidPhone, normalizePhone } from "@/lib/events/phone";
import type { RegStatus } from "@/lib/events/types";

export type RegisterState = {
  ok?: boolean;
  error?: string;
  /** field to highlight */
  field?: "name" | "phone" | "email" | "participants";
  code?: string;
  status?: RegStatus;
  position?: number;
  name?: string;
  participants?: number;
};

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Public registration. All the rules (capacity, waitlist, duplicates, deadline) are enforced in the database. */
export async function registerForEvent(locale: Locale, eventId: string, _prev: RegisterState, fd: FormData): Promise<RegisterState> {
  const t = makeET(locale);
  if (!isSupabaseConfigured()) return { error: t("e_notConnected") };

  // honeypot: a real person never fills this hidden field
  if (str(fd, "website")) return { ok: true, code: "NSH-000000", status: "pending", name: str(fd, "full_name"), participants: 1 };

  const name = str(fd, "full_name");
  const phone = str(fd, "phone");
  const email = str(fd, "email");
  const participants = Number(str(fd, "participants") || "1");
  if (name.length < 2) return { error: t("e_name"), field: "name" };
  if (!isValidPhone(phone)) return { error: t("e_phone"), field: "phone" };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: t("e_email"), field: "email" };
  if (!Number.isInteger(participants) || participants < 1) return { error: t("e_participants"), field: "participants" };

  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc("event_register", {
      p_event: eventId, p_name: name, p_phone: phone, p_email: email || null,
      p_student: str(fd, "is_student") === "on", p_participants: participants, p_notes: str(fd, "notes") || null,
    });
    if (error) return { error: friendlyEventError(error.message, locale) };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { error: t("e_generic") };
    return { ok: true, code: row.out_code, status: row.out_status, position: row.out_position || undefined, name, participants };
  } catch {
    return { error: t("e_generic") };
  }
}

export type LookupState = {
  ok?: boolean;
  error?: string;
  cancelled?: boolean;
  code?: string;
  name?: string;
  status?: RegStatus;
  participants?: number;
  position?: number;
  due?: number;
  paid?: number;
  phone?: string;
};

export async function lookupRegistration(locale: Locale, _prev: LookupState, fd: FormData): Promise<LookupState> {
  const t = makeET(locale);
  if (!isSupabaseConfigured()) return { error: t("e_notConnected") };
  const code = str(fd, "code").toUpperCase();
  const phone = str(fd, "phone");
  if (!code || !isValidPhone(phone)) return { error: t("notFound") };
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc("event_lookup", { p_code: code, p_phone: phone });
    if (error) return { error: friendlyEventError(error.message, locale) };
    const r = Array.isArray(data) ? data[0] : data;
    if (!r) return { error: t("notFound") };
    return {
      ok: true, code, phone, name: r.out_name, status: r.out_status, participants: Number(r.out_participants),
      position: Number(r.out_position) || undefined, due: Number(r.out_due), paid: Number(r.out_paid),
    };
  } catch {
    return { error: t("e_generic") };
  }
}

export async function cancelOwnRegistration(locale: Locale, _prev: LookupState, fd: FormData): Promise<LookupState> {
  const t = makeET(locale);
  if (!isSupabaseConfigured()) return { error: t("e_notConnected") };
  try {
    const sb = await createClient();
    const { error } = await sb.rpc("event_cancel_own", { p_code: str(fd, "code").toUpperCase(), p_phone: normalizePhone(str(fd, "phone")) });
    if (error) return { error: friendlyEventError(error.message, locale) };
    return { ok: true, cancelled: true, status: "cancelled" };
  } catch {
    return { error: t("e_generic") };
  }
}
