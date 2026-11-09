import type { EventItem, RegistrationRec, EventPaymentRec, AttendanceRec } from "./types";

export interface PaymentSummary {
  due: number;
  paid: number; // net of refunds, voided rows excluded
  refunded: number;
  status: "free" | "unpaid" | "partial" | "paid" | "refunded";
}

export function paymentSummary(ev: Pick<EventItem, "isPaid" | "price">, reg: Pick<RegistrationRec, "id" | "participants">, payments: EventPaymentRec[]): PaymentSummary {
  if (!ev.isPaid) return { due: 0, paid: 0, refunded: 0, status: "free" };
  const mine = payments.filter((p) => p.registration_id === reg.id && !p.voided_at);
  const gross = mine.filter((p) => p.kind === "payment").reduce((a, p) => a + p.amount, 0);
  const refunded = mine.filter((p) => p.kind === "refund").reduce((a, p) => a + p.amount, 0);
  const paid = gross - refunded;
  const due = ev.price * reg.participants;
  const status = refunded > 0 && paid <= 0 ? "refunded" : paid >= due && due > 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  return { due, paid, refunded, status };
}

export interface EventStats {
  totalRegistrations: number; // all rows, any status
  activeRegistrations: number;
  confirmedParticipants: number;
  pendingParticipants: number;
  waitlistedParticipants: number;
  seatsTaken: number;
  seatsAvailable: number | null; // null = unlimited
  revenue: number; // Toman, net of refunds
  outstanding: number; // still owed by pending/confirmed registrations
  attended: number;
  attendanceRate: number | null; // % of confirmed participants who showed up
}

export function eventStats(
  ev: Pick<EventItem, "capacity" | "isPaid" | "price">,
  regs: RegistrationRec[],
  payments: EventPaymentRec[],
  attendance: AttendanceRec[],
): EventStats {
  const sum = (xs: RegistrationRec[]) => xs.reduce((a, r) => a + r.participants, 0);
  const confirmed = regs.filter((r) => r.status === "confirmed");
  const pending = regs.filter((r) => r.status === "pending");
  const waitlisted = regs.filter((r) => r.status === "waitlisted");
  const seatsTaken = sum(confirmed) + sum(pending);
  const live = new Set(regs.map((r) => r.id));
  const revenue = ev.isPaid
    ? payments.filter((p) => live.has(p.registration_id) && !p.voided_at).reduce((a, p) => a + (p.kind === "payment" ? p.amount : -p.amount), 0)
    : 0;
  const outstanding = ev.isPaid
    ? [...confirmed, ...pending].reduce((a, r) => a + Math.max(paymentSummary(ev, r, payments).due - paymentSummary(ev, r, payments).paid, 0), 0)
    : 0;
  const confirmedIds = new Set(confirmed.map((r) => r.id));
  const attended = attendance.filter((a) => confirmedIds.has(a.registration_id)).reduce((s, a) => s + a.attended_participants, 0);
  const confirmedP = sum(confirmed);
  return {
    totalRegistrations: regs.length,
    activeRegistrations: confirmed.length + pending.length + waitlisted.length,
    confirmedParticipants: confirmedP,
    pendingParticipants: sum(pending),
    waitlistedParticipants: sum(waitlisted),
    seatsTaken,
    seatsAvailable: ev.capacity == null ? null : Math.max(ev.capacity - seatsTaken, 0),
    revenue,
    outstanding,
    attended,
    attendanceRate: confirmedP > 0 ? Math.round((attended / confirmedP) * 100) : null,
  };
}
