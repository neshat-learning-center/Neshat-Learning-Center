/**
 * Create / edit / archive an event through the SAME form-parsing code the admin
 * form uses, against the real migration on an in-process Postgres.
 * Run: npm run test:events:integration
 */
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { parseEventForm } from "../lib/events/parse";
import { makeET } from "../lib/events/labels";

const t = makeET("en");
let pass = 0, fail = 0;
const ok = (n: string, c: boolean, extra = "") => { if (c) pass++; else { fail++; console.log("FAIL", n, extra); } };

const db = new PGlite();
await db.exec(`
create schema auth; create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create table storage.buckets(id text primary key, name text, public boolean);
create table storage.objects(id serial primary key, bucket_id text, name text);
create type role as enum ('admin','teacher','student');
create table public.profiles(id uuid primary key, role role not null default 'student', full_name text);
create function public.is_admin() returns boolean language sql stable as $$ select true $$;
`);
await db.exec(fs.readFileSync(path.join(import.meta.dirname, "../supabase/migrations/0016_events.sql"), "utf8"));

const form = (o: Record<string, string>) => { const fd = new FormData(); for (const [k, v] of Object.entries(o)) fd.set(k, v); return fd; };
const good = {
  title_fa: "شب فیلم", title_en: "Movie Night", category_id: "", summary_fa: "خلاصه", summary_en: "Summary", description_fa: "یک\n\nدو", description_en: "One\n\nTwo",
  venue_fa: "نشاط", venue_en: "Neshat", address: "Shiraz", map_url: "https://maps.example/x", organizer_fa: "تیم", organizer_en: "Team",
  start_date: "2026-12-05", start_time: "18:30", end_date: "", end_time: "21:00", deadline_date: "2026-12-04", deadline_time: "23:59",
  capacity: "30", max_per_registration: "4", allow_waitlist: "on", auto_confirm: "on", is_paid: "on", price: "۴۵۰٬۰۰۰", status: "published", is_featured: "on",
  program_json: JSON.stringify([{ time: "18:30", fa: "شروع", en: "Start" }, { time: "20:00", fa: "", en: "" }]),
  gallery_json: JSON.stringify([{ url: "https://x.test/a.webp", caption: "A" }, { url: "javascript:alert(1)", caption: "bad" }]),
  req_fa: "یک\n\nدو\n", req_en: "one\ntwo", cover_url: "https://x.test/c.webp",
};

// ---- create ----------------------------------------------------------------------
const p = parseEventForm(form(good), t);
if ("error" in p) throw new Error("good form rejected: " + p.error);
ok("slug from the English title", p.slug === "movie-night");
ok("start is 18:30 Iran time = 15:00 UTC", p.row.starts_at === "2026-12-05T18:30:00+03:30" && new Date(p.row.starts_at as string).toISOString() === "2026-12-05T15:00:00.000Z");
ok("end time alone means same day", p.row.ends_at === "2026-12-05T21:00:00+03:30");
ok("deadline is the evening before", p.row.registration_deadline === "2026-12-04T23:59:00+03:30");
ok("Persian-digit price parsed to integer Toman", p.row.price === 450000 && p.row.is_paid === true);
ok("empty programme rows dropped", (p.row.program as unknown[]).length === 1);
ok("unsafe gallery URLs dropped", p.gallery.length === 1 && p.gallery[0].url === "https://x.test/a.webp");
ok("requirements split into lines, blanks removed", JSON.stringify(p.row.requirements) === JSON.stringify({ fa: ["یک", "دو"], en: ["one", "two"] }));

const payload = { ...p.row, slug: "movie-night" };
const cols = Object.keys(payload).join(", ");
const ins = await db.query(`insert into events (${cols}) select ${cols} from jsonb_populate_record(null::events, $1::jsonb) returning id, slug, price, capacity, status, is_featured, title`, [JSON.stringify(payload)]);
const id = (ins.rows[0] as { id: string }).id;
ok("the parsed row is accepted by the real table (types + constraints)", !!id);
ok("persisted values round-trip", (ins.rows[0] as { price: number }).price === 450000 && (ins.rows[0] as { capacity: number }).capacity === 30);
await db.query(`insert into event_gallery(event_id,url,caption,sort_order) values ($1,$2,$3,0)`, [id, p.gallery[0].url, p.gallery[0].caption]);

// ---- edit ------------------------------------------------------------------------
const p2 = parseEventForm(form({ ...good, title_en: "Movie Night (moved)", capacity: "", is_paid: "", price: "", start_date: "2026-12-12", deadline_date: "2026-12-11", is_featured: "" }), t);
if ("error" in p2) throw new Error(p2.error);
await db.query(`update events set title=$2::jsonb, capacity=$3, is_paid=$4, price=$5, starts_at=$6, ends_at=$7, registration_deadline=$8, is_featured=$9 where id=$1`,
  [id, JSON.stringify(p2.row.title), p2.row.capacity, p2.row.is_paid, p2.row.price, p2.row.starts_at, p2.row.ends_at, p2.row.registration_deadline, p2.row.is_featured]);
const upd = (await db.query(`select title->>'en' as en, capacity, is_paid, price, is_featured from events where id=$1`, [id])).rows[0] as Record<string, unknown>;
ok("edit saved: new title, unlimited capacity, now free", upd.en === "Movie Night (moved)" && upd.capacity === null && upd.is_paid === false && upd.price === 0 && upd.is_featured === false);

// ---- validation ------------------------------------------------------------------
const bad = (o: Record<string, string>) => parseEventForm(form({ ...good, ...o }), t);
ok("no title rejected", "error" in bad({ title_fa: "", title_en: "" }));
ok("end before start rejected", "error" in bad({ end_time: "17:00" }));
ok("deadline after the event rejected", "error" in bad({ deadline_date: "2026-12-06" }));
ok("paid without price rejected", "error" in bad({ price: "" }));
ok("paid with price 0 rejected", "error" in bad({ price: "0" }));
ok("capacity 0 rejected", "error" in bad({ capacity: "0" }));
ok("capacity 2.5 rejected", "error" in bad({ capacity: "2.5" }));
ok("bad start date rejected", "error" in bad({ start_date: "05/12/2026" }));
ok("bad program JSON rejected", "error" in bad({ program_json: "{nope" }));
ok("unknown status falls back to draft", (bad({ status: "hacked" }) as unknown as { row: { status: string } }).row.status === "draft");
ok("free event ignores a stray price", (bad({ is_paid: "", price: "999" }) as unknown as { row: { price: number } }).row.price === 0);
ok("Persian-only title still gets a slug fallback (empty → generated by the action)", (bad({ title_en: "", slug: "" }) as unknown as { slug: string }).slug === "");
ok("blank category stored as null", (p.row.category_id as unknown) === null);

// ---- archive / delete rules --------------------------------------------------------
await db.exec(`update events set status='published' where id='${id}'`);
await db.query(`select event_register($1, 'Sara Ahmadi', '09123456789', null, false, 1, '')`, [id]).catch(() => undefined);
// (the event is in the future in 2026; if the clock is past it, registration is closed — the delete rule below still holds)
const regs = (await db.query(`select count(*)::int n from event_registrations where event_id=$1`, [id])).rows[0] as { n: number };
if (regs.n > 0) {
  let blocked = false;
  try { await db.query(`delete from events where id=$1`, [id]); } catch { blocked = true; }
  ok("an event with registrations cannot be deleted", blocked);
}
await db.query(`update events set status='archived', is_featured=false where id=$1`, [id]);
ok("it can be archived instead", ((await db.query(`select status from events where id=$1`, [id])).rows[0] as { status: string }).status === "archived");
const other = (await db.query(`insert into events(slug,title,starts_at) values ('empty','{}', now()+interval '3 days') returning id`)).rows[0] as { id: string };
await db.query(`delete from events where id=$1`, [other.id]);
ok("an event with no registrations can be deleted", (await db.query(`select count(*)::int n from events where slug='empty'`)).rows[0] as unknown as { n: number } && ((await db.query(`select count(*)::int n from events where slug='empty'`)).rows[0] as { n: number }).n === 0);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
