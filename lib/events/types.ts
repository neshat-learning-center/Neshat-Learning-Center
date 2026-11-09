import type { Localized } from "@/lib/i18n/config";

export type EventStatus = "draft" | "published" | "completed" | "cancelled" | "archived";
export type RegStatus = "pending" | "confirmed" | "waitlisted" | "rejected" | "cancelled";

export const EVENT_STATUSES: EventStatus[] = ["draft", "published", "completed", "cancelled", "archived"];
export const REG_STATUSES: RegStatus[] = ["pending", "confirmed", "waitlisted", "rejected", "cancelled"];
export const EVENT_PAY_METHODS = ["cash", "card", "bank_transfer", "online", "other"] as const;
export type EventPayMethod = (typeof EVENT_PAY_METHODS)[number];

export interface EventCategory {
  id: string;
  slug: string;
  title: Localized;
}

export interface ProgramItem {
  time: string; // "18:30"
  fa: string;
  en: string;
}

export interface EventGalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

/** An event as the public site (and the admin) sees it. Timestamps are ISO strings (UTC). */
export interface EventItem {
  id: string;
  slug: string;
  title: Localized;
  summary: Localized | null;
  description: Localized | null;
  venue: Localized | null;
  address: string | null;
  mapUrl: string | null;
  organizer: Localized | null;
  program: ProgramItem[];
  requirements: { fa: string[]; en: string[] } | null;
  cover: string | null;
  startsAt: string;
  endsAt: string | null;
  deadline: string | null;
  capacity: number | null;
  allowWaitlist: boolean;
  autoConfirm: boolean;
  maxPerRegistration: number;
  isPaid: boolean;
  price: number; // Toman per participant
  featured: boolean;
  status: EventStatus;
  category: EventCategory | null;
  gallery: EventGalleryImage[];
  /** seats held (pending + confirmed) and people waiting — from event_availability() */
  taken: number;
  waitlisted: number;
}

export interface RegistrationRec {
  id: string;
  event_id: string;
  code: string;
  full_name: string;
  phone: string;
  email: string | null;
  is_student: boolean;
  participants: number;
  notes: string | null;
  status: RegStatus;
  admin_note: string | null;
  created_at: string;
}

export interface EventPaymentRec {
  id: string;
  registration_id: string;
  kind: "payment" | "refund";
  amount: number;
  method: EventPayMethod;
  reference: string | null;
  paid_at: string;
  note: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

export interface AttendanceRec {
  registration_id: string;
  attended_participants: number;
}
