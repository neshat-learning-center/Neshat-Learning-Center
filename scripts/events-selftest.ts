/** Self-test for the Events helpers. Run: npm run test:events */
import { tehranToIso, isoToTehranParts, dateParts, formatTime, formatTimeRange, eventPhase, availability, seatsLeft, isLimited, countdown, splitByPhase, toIcs } from "../lib/events/time";
import { normalizePhone, isValidPhone, displayPhone } from "../lib/events/phone";
import { eventStats, paymentSummary } from "../lib/events/stats";
import type { RegistrationRec, EventPaymentRec } from "../lib/events/types";

let pass = 0, fail = 0;
const eq = (n: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.log(`FAIL ${n}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`); }
};

// Iran time
eq("tehran → instant", tehranToIso("2026-11-20", "18:30"), "2026-11-20T18:30:00+03:30");
eq("instant is 15:00 UTC", new Date(tehranToIso("2026-11-20", "18:30")!).toISOString(), "2026-11-20T15:00:00.000Z");
eq("round trip", isoToTehranParts(tehranToIso("2026-11-20", "18:30")), { date: "2026-11-20", time: "18:30" });
eq("round trip across midnight", isoToTehranParts(tehranToIso("2026-03-21", "00:15")), { date: "2026-03-21", time: "00:15" });
eq("bad date rejected", tehranToIso("20-11-2026", "18:30"), null);
eq("bad time rejected", tehranToIso("2026-11-20", "6pm"), null);
eq("empty parts", isoToTehranParts(null), { date: "", time: "" });

// formatting (Jalali for fa, Gregorian for en)
const iso = tehranToIso("2026-11-20", "18:30")!;
eq("fa day/month (Jalali 29 Aban 1405)", [dateParts(iso, "fa").day, dateParts(iso, "fa").monthLong], ["۲۹", "آبان"]);
eq("fa weekday (Friday)", dateParts(iso, "fa").weekday, "جمعه");
eq("en date", dateParts(iso, "en").full, "Friday 20 November 2026");
eq("fa time uses Persian digits", formatTime(iso, "fa"), "۱۸:۳۰");
eq("en time range", formatTimeRange({ startsAt: iso, endsAt: tehranToIso("2026-11-20", "21:00")! }, "en"), "18:30 – 21:00");
eq("time is Iran time even for UTC-evening instants", formatTime("2026-11-20T21:00:00Z", "en"), "00:30");

// phases & availability
const NOW = Date.parse("2026-11-10T12:00:00Z");
const base = { startsAt: "2026-11-20T15:00:00Z", endsAt: "2026-11-20T18:00:00Z", status: "published" as const, deadline: null, capacity: 10, taken: 4, allowWaitlist: true };
eq("upcoming", eventPhase(base, NOW), "upcoming");
eq("live during the event", eventPhase(base, Date.parse("2026-11-20T16:00:00Z")), "live");
eq("past after the end", eventPhase(base, Date.parse("2026-11-20T18:00:01Z")), "past");
eq("no end → past after 3h", eventPhase({ ...base, endsAt: null }, Date.parse("2026-11-20T18:00:01Z")), "past");
eq("completed is past even if early", eventPhase({ ...base, status: "completed" }, NOW), "past");
eq("open", availability(base, NOW), "open");
eq("full + waitlist", availability({ ...base, taken: 10 }, NOW), "waitlist");
eq("full, no waitlist", availability({ ...base, taken: 10, allowWaitlist: false }, NOW), "full");
eq("closed after deadline", availability({ ...base, deadline: "2026-11-09T00:00:00Z" }, NOW), "closed");
eq("deadline defaults to the start: closed once it begins", availability(base, Date.parse("2026-11-20T15:00:01Z")), "closed");
eq("cancelled wins", availability({ ...base, status: "cancelled" }, NOW), "cancelled");
eq("unlimited never full", availability({ ...base, capacity: null, taken: 999 }, NOW), "open");
eq("seats left", seatsLeft({ capacity: 10, taken: 4 }), 6);
eq("seats left never negative", seatsLeft({ capacity: 10, taken: 12 }), 0);
eq("unlimited seats", seatsLeft({ capacity: null, taken: 3 }), null);
eq("limited: ≤5 left", isLimited({ capacity: 40, taken: 36 }), true);
eq("limited: ≤20%", isLimited({ capacity: 100, taken: 85 }), true);
eq("not limited", isLimited({ capacity: 100, taken: 20 }), false);
eq("full is not 'limited'", isLimited({ capacity: 10, taken: 10 }), false);

// countdown uses the real difference
eq("countdown 10d 3h 0m 5s", countdown("2026-11-20T15:00:05Z", Date.parse("2026-11-10T12:00:00Z")), { days: 10, hours: 3, minutes: 0, seconds: 5, done: false });
eq("countdown never negative", countdown("2026-11-01T00:00:00Z", NOW), { days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
const evs = [
  { ...base, startsAt: "2026-12-01T10:00:00Z", endsAt: null },
  { ...base, startsAt: "2026-11-15T10:00:00Z", endsAt: null },
  { ...base, startsAt: "2026-10-01T10:00:00Z", endsAt: null },
  { ...base, startsAt: "2026-09-01T10:00:00Z", endsAt: null },
  { ...base, startsAt: "2026-11-30T10:00:00Z", endsAt: null, status: "cancelled" as const },
];
const sp = splitByPhase(evs, NOW);
eq("upcoming soonest first, cancelled excluded", sp.upcoming.map((e) => e.startsAt), ["2026-11-15T10:00:00Z", "2026-12-01T10:00:00Z"]);
eq("past latest first", sp.past.map((e) => e.startsAt), ["2026-10-01T10:00:00Z", "2026-09-01T10:00:00Z"]);
eq("ics has start in UTC", toIcs({ slug: "x", startsAt: iso, endsAt: null, title: "Movie, Night" }).includes("DTSTART:20261120T150000Z"), true);

// phone — must match the SQL function
eq("0912…", normalizePhone("0912 345 6789"), "9123456789");
eq("+98", normalizePhone("+98 912 345 6789"), "9123456789");
eq("0098", normalizePhone("00989123456789"), "9123456789");
eq("Persian digits", normalizePhone("۰۹۱۲۳۴۵۶۷۸۹"), "9123456789");
eq("Arabic-Indic digits", normalizePhone("٠٩١٢٣٤٥٦٧٨٩"), "9123456789");
eq("valid mobile", isValidPhone("09123456789"), true);
eq("too short", isValidPhone("12345"), false);
eq("garbage", isValidPhone("abc"), false);
eq("foreign number ok", isValidPhone("+44 20 7946 0958"), true);
eq("display", displayPhone("9123456789"), "0912 345 6789");

// stats
const ev = { capacity: 10, isPaid: true, price: 500_000 };
const R = (id: string, status: RegistrationRec["status"], participants: number): RegistrationRec => ({ id, event_id: "e", code: id, full_name: id, phone: id, email: null, is_student: false, participants, notes: null, status, admin_note: null, created_at: "" });
const regs = [R("a", "confirmed", 2), R("b", "pending", 1), R("c", "waitlisted", 3), R("d", "rejected", 1), R("e", "confirmed", 1)];
const P = (id: string, reg: string, kind: "payment" | "refund", amount: number, voided = false): EventPaymentRec => ({ id, registration_id: reg, kind, amount, method: "cash", reference: null, paid_at: "2026-11-01", note: null, voided_at: voided ? "x" : null, void_reason: null });
const pays = [P("1", "a", "payment", 1_000_000), P("2", "b", "payment", 200_000), P("3", "e", "payment", 500_000), P("4", "e", "refund", 500_000), P("5", "a", "payment", 77, true)];
const st = eventStats(ev, regs, pays, [{ registration_id: "a", attended_participants: 2 }, { registration_id: "e", attended_participants: 0 }, { registration_id: "d", attended_participants: 1 }]);
eq("registrations", [st.totalRegistrations, st.activeRegistrations], [5, 4]);
eq("participants by status", [st.confirmedParticipants, st.pendingParticipants, st.waitlistedParticipants], [3, 1, 3]);
eq("seats: 4 taken, 6 free", [st.seatsTaken, st.seatsAvailable], [4, 6]);
eq("revenue = 1.0M + 0.2M + (0.5M − 0.5M); voided ignored", st.revenue, 1_200_000);
eq("outstanding: a paid, b owes 300k, e owes 500k (refunded)", st.outstanding, 800_000);
eq("attendance counts confirmed only: 2 of 3", [st.attended, st.attendanceRate], [2, 67]);
eq("free event has no revenue", eventStats({ capacity: null, isPaid: false, price: 0 }, regs, pays, []).revenue, 0);
eq("unlimited capacity → null seats", eventStats({ capacity: null, isPaid: false, price: 0 }, regs, [], []).seatsAvailable, null);
eq("payment status unpaid/partial/paid/refunded", [
  paymentSummary(ev, regs[3], pays).status, paymentSummary(ev, regs[1], pays).status, paymentSummary(ev, regs[0], pays).status, paymentSummary(ev, regs[4], pays).status,
], ["unpaid", "partial", "paid", "refunded"]);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
