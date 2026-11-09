import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  EventItem, EventCategory, ProgramItem, RegistrationRec, EventPaymentRec, AttendanceRec, EventStatus,
} from "./types";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type SB = Awaited<ReturnType<typeof createClient>>;

const rel = (v: unknown): Row | null => (Array.isArray(v) ? (v[0] ?? null) : ((v as Row) ?? null));
const num = (v: unknown) => (v == null ? 0 : Number(v));
const loc = (v: unknown) => (v && typeof v === "object" ? ({ fa: String((v as Row).fa ?? ""), en: String((v as Row).en ?? "") }) : null);

function mapEvent(r: Row, av?: { taken: number; waitlisted: number }): EventItem {
  const cat = rel(r.event_categories);
  const program: ProgramItem[] = Array.isArray(r.program)
    ? r.program.map((p: Row) => ({ time: String(p.time ?? ""), fa: String(p.fa ?? ""), en: String(p.en ?? "") }))
    : [];
  const req = r.requirements && typeof r.requirements === "object" ? { fa: (r.requirements.fa ?? []) as string[], en: (r.requirements.en ?? []) as string[] } : null;
  const gallery = ((r.event_gallery ?? []) as Row[])
    .slice()
    .sort((a, b) => num(a.sort_order) - num(b.sort_order))
    .map((g) => ({ id: g.id as string, url: g.url as string, caption: (g.caption as string) ?? null }));
  return {
    id: r.id,
    slug: r.slug,
    title: loc(r.title) ?? { fa: "", en: "" },
    summary: loc(r.summary),
    description: loc(r.description),
    venue: loc(r.venue),
    address: r.address ?? null,
    mapUrl: r.map_url ?? null,
    organizer: loc(r.organizer),
    program,
    requirements: req,
    cover: r.cover_url ?? null,
    startsAt: r.starts_at,
    endsAt: r.ends_at ?? null,
    deadline: r.registration_deadline ?? null,
    capacity: r.capacity == null ? null : Number(r.capacity),
    allowWaitlist: !!r.allow_waitlist,
    autoConfirm: !!r.auto_confirm,
    maxPerRegistration: num(r.max_per_registration) || 5,
    isPaid: !!r.is_paid,
    price: num(r.price),
    featured: !!r.is_featured,
    status: r.status as EventStatus,
    category: cat ? { id: cat.id, slug: cat.slug, title: loc(cat.title) ?? { fa: "", en: "" } } : null,
    gallery,
    taken: av?.taken ?? 0,
    waitlisted: av?.waitlisted ?? 0,
  };
}

const SELECT = "*, event_categories(id, slug, title), event_gallery(id, url, caption, sort_order)";

async function availabilityFor(sb: SB, ids: string[]) {
  const map = new Map<string, { taken: number; waitlisted: number }>();
  if (ids.length === 0) return map;
  const { data } = await sb.rpc("event_availability", { p_ids: ids });
  for (const r of (data ?? []) as Row[]) map.set(r.out_event, { taken: num(r.out_taken), waitlisted: num(r.out_waitlisted) });
  return map;
}

/** Every event visitors may see (published, completed, cancelled). Empty when Supabase / the migration isn't there. */
export async function getEvents(): Promise<EventItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const sb = await createClient();
    const { data, error } = await sb.from("events").select(SELECT).in("status", ["published", "completed", "cancelled"]).order("starts_at", { ascending: true });
    if (error || !data) return [];
    const av = await availabilityFor(sb, data.map((r: Row) => r.id));
    return (data as Row[]).map((r) => mapEvent(r, av.get(r.id)));
  } catch {
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const sb = await createClient();
    const { data } = await sb.from("events").select(SELECT).eq("slug", slug).in("status", ["published", "completed", "cancelled"]).maybeSingle();
    if (!data) return null;
    const av = await availabilityFor(sb, [data.id]);
    return mapEvent(data as Row, av.get(data.id));
  } catch {
    return null;
  }
}

export async function getEventCategories(): Promise<EventCategory[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const sb = await createClient();
    const { data } = await sb.from("event_categories").select("id, slug, title, sort_order").order("sort_order");
    return ((data ?? []) as Row[]).map((c) => ({ id: c.id, slug: c.slug, title: loc(c.title) ?? { fa: "", en: "" } }));
  } catch {
    return [];
  }
}

// ---- admin ---------------------------------------------------------------------------

const PAGE = 1000;
async function fetchAll(sb: SB, table: string, select = "*", order = "id", filter?: (q: any) => any): Promise<Row[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const out: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = sb.from(table).select(select).order(order).range(from, from + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...((data as unknown as Row[]) ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export type AdminLoad<T> = { ok: true; data: T } | { ok: false; reason: "not_configured" | "migration" | "error"; message?: string };

function fail(e: unknown): AdminLoad<never> {
  const err = e as { code?: string; message?: string };
  const missing = err?.code === "42P01" || err?.code === "PGRST205" || /does not exist|schema cache/i.test(err?.message ?? "");
  return { ok: false, reason: missing ? "migration" : "error", message: err?.message };
}

export interface AdminEventRow {
  event: EventItem;
  registrations: number; // active (not rejected/cancelled)
  confirmedPeople: number;
  pendingPeople: number;
  waitlistedPeople: number;
}

export async function loadAdminEvents(): Promise<AdminLoad<AdminEventRow[]>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "not_configured" };
  try {
    const sb = await createClient();
    const [events, regs] = await Promise.all([
      fetchAll(sb, "events", SELECT, "starts_at"),
      fetchAll(sb, "event_registrations", "id, event_id, status, participants", "id"),
    ]);
    const rows = events
      .map((r) => {
        const mine = regs.filter((x) => x.event_id === r.id);
        const sum = (st: string) => mine.filter((x) => x.status === st).reduce((a, x) => a + num(x.participants), 0);
        const confirmedPeople = sum("confirmed");
        const pendingPeople = sum("pending");
        const waitlistedPeople = sum("waitlisted");
        return {
          event: mapEvent(r, { taken: confirmedPeople + pendingPeople, waitlisted: waitlistedPeople }),
          registrations: mine.filter((x) => ["pending", "confirmed", "waitlisted"].includes(x.status)).length,
          confirmedPeople, pendingPeople, waitlistedPeople,
        };
      })
      .sort((a, b) => Date.parse(b.event.startsAt) - Date.parse(a.event.startsAt));
    return { ok: true, data: rows };
  } catch (e) {
    return fail(e);
  }
}

export async function loadAdminEvent(id: string): Promise<AdminLoad<EventItem | null>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "not_configured" };
  try {
    const sb = await createClient();
    const { data, error } = await sb.from("events").select(SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    return { ok: true, data: data ? mapEvent(data as Row) : null };
  } catch (e) {
    return fail(e);
  }
}

export interface RegistrationsBundle {
  event: EventItem;
  registrations: RegistrationRec[];
  payments: EventPaymentRec[];
  attendance: AttendanceRec[];
}

export async function loadEventRegistrations(id: string): Promise<AdminLoad<RegistrationsBundle | null>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "not_configured" };
  try {
    const sb = await createClient();
    const { data, error } = await sb.from("events").select(SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return { ok: true, data: null };
    const regs = await fetchAll(sb, "event_registrations", "*", "created_at", (q) => q.eq("event_id", id));
    const ids = regs.map((r) => r.id);
    const [pays, att] = ids.length
      ? await Promise.all([
          fetchAll(sb, "event_payments", "*", "created_at", (q) => q.in("registration_id", ids)),
          fetchAll(sb, "event_attendance", "*", "registration_id", (q) => q.in("registration_id", ids)),
        ])
      : [[], []];
    const num2 = <T extends Row>(rows: T[], keys: string[]) => rows.map((r) => ({ ...r, ...Object.fromEntries(keys.map((k) => [k, num(r[k])])) }));
    const registrations = num2(regs, ["participants"]) as unknown as RegistrationRec[];
    const active = registrations.filter((r) => r.status === "pending" || r.status === "confirmed");
    return {
      ok: true,
      data: {
        event: mapEvent(data as Row, {
          taken: active.reduce((a, r) => a + r.participants, 0),
          waitlisted: registrations.filter((r) => r.status === "waitlisted").reduce((a, r) => a + r.participants, 0),
        }),
        registrations,
        payments: num2(pays, ["amount"]) as unknown as EventPaymentRec[],
        attendance: num2(att, ["attended_participants"]) as unknown as AttendanceRec[],
      },
    };
  } catch (e) {
    return fail(e);
  }
}
