import { tehranToIso } from "./time";
import { parseToman } from "@/lib/finance/money";
import { EVENT_STATUSES } from "./types";
import type { ET } from "./labels";

/**
 * Turns the admin event form into a database row. Pure (no I/O) so every rule —
 * Iran-time dates, deadline before the event, paid ⇒ price, capacity, programme
 * rows — is unit-tested without a browser or a database round trip.
 */
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const oneOf = <T extends string>(v: string, list: readonly T[]): T | null => ((list as readonly string[]).includes(v) ? (v as T) : null);
const lines = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const pair = (fd: FormData, k: string) => ({ fa: str(fd, `${k}_fa`), en: str(fd, `${k}_en`) });

function slugOf(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export type ParsedEvent = { row: Record<string, unknown>; gallery: { url: string; caption: string | null }[]; slug: string } | { error: string };

export function parseEventForm(fd: FormData, t: ET): ParsedEvent {
  const title = pair(fd, "title");
  if (!title.fa && !title.en) return { error: t("needTitle") };

  const startsAt = tehranToIso(str(fd, "start_date"), str(fd, "start_time") || "18:00");
  if (!startsAt) return { error: t("invalidDates") };
  const endDate = str(fd, "end_date");
  const endTime = str(fd, "end_time");
  // an end time on its own means "same day"
  const endsAt = endDate || endTime ? tehranToIso(endDate || str(fd, "start_date"), endTime || "21:00") : null;
  if ((endDate || endTime) && !endsAt) return { error: t("invalidDates") };
  const dlDate = str(fd, "deadline_date");
  const deadline = dlDate ? tehranToIso(dlDate, str(fd, "deadline_time") || "23:59") : null;
  if (dlDate && !deadline) return { error: t("invalidDates") };
  if (endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) return { error: t("invalidDates") };
  if (deadline && Date.parse(deadline) > Date.parse(endsAt ?? startsAt)) return { error: t("invalidDates") };

  const isPaid = str(fd, "is_paid") === "on";
  const price = isPaid ? parseToman(str(fd, "price")) : 0;
  if (isPaid && (!price || price <= 0)) return { error: t("needPrice") };

  const capRaw = str(fd, "capacity");
  const capacity = capRaw === "" ? null : Number(capRaw);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) return { error: t("invalid") };
  const maxPer = Number(str(fd, "max_per_registration") || "5");
  if (!Number.isInteger(maxPer) || maxPer < 1) return { error: t("invalid") };
  const status = oneOf(str(fd, "status"), EVENT_STATUSES) ?? "draft";

  let program: { time: string; fa: string; en: string }[] = [];
  let gallery: { url: string; caption: string | null }[] = [];
  try {
    const p = JSON.parse(str(fd, "program_json") || "[]");
    if (Array.isArray(p)) program = p.map((x) => ({ time: String(x.time ?? "").trim(), fa: String(x.fa ?? "").trim(), en: String(x.en ?? "").trim() })).filter((x) => x.fa || x.en);
    const g = JSON.parse(str(fd, "gallery_json") || "[]");
    if (Array.isArray(g)) gallery = g.map((x) => ({ url: String(x.url ?? ""), caption: x.caption ? String(x.caption) : null })).filter((x) => /^https?:\/\//.test(x.url));
  } catch {
    return { error: t("invalid") };
  }

  const reqFa = lines(str(fd, "req_fa"));
  const reqEn = lines(str(fd, "req_en"));
  const slug = slugOf(str(fd, "slug")) || slugOf(title.en) || "";

  return {
    slug,
    gallery,
    row: {
      category_id: str(fd, "category_id") || null,
      title, summary: pair(fd, "summary"), description: pair(fd, "description"), venue: pair(fd, "venue"), organizer: pair(fd, "organizer"),
      address: str(fd, "address") || null,
      map_url: /^https?:\/\//.test(str(fd, "map_url")) ? str(fd, "map_url") : null,
      program,
      requirements: reqFa.length || reqEn.length ? { fa: reqFa, en: reqEn } : null,
      cover_url: /^https?:\/\//.test(str(fd, "cover_url")) ? str(fd, "cover_url") : null,
      starts_at: startsAt, ends_at: endsAt, registration_deadline: deadline,
      capacity, max_per_registration: maxPer,
      allow_waitlist: str(fd, "allow_waitlist") === "on",
      auto_confirm: str(fd, "auto_confirm") === "on",
      is_paid: isPaid, price: price ?? 0,
      is_featured: str(fd, "is_featured") === "on",
      status,
    },
  };
}

