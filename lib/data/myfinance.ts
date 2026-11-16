import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);

export interface MyAccountClass {
  enrollmentId: string;
  title: string;
  fee: number;
  paid: number;
  refunded: number;
  pending: number;
  remaining: number;
}
export interface MyPayment {
  id: string;
  classTitle: string;
  kind: "payment" | "refund";
  status: "completed" | "pending";
  amount: number;
  method: string;
  paidAt: string;
  reference: string | null;
}
export interface MyAccount {
  classes: MyAccountClass[];
  payments: MyPayment[];
}

/** A student's own fees and payments (voided records never appear). */
export async function getMyAccount(locale: Locale): Promise<MyAccount> {
  const empty: MyAccount = { classes: [], payments: [] };
  if (!isSupabaseConfigured()) return empty;
  try {
    const sb = await createClient();
    const [{ data: acc }, { data: pay }] = await Promise.all([sb.rpc("my_student_account"), sb.rpc("my_student_payments")]);
    return {
      classes: ((acc ?? []) as Row[]).map((r) => {
        const fee = n(r.out_fee);
        const paid = n(r.out_paid);
        const refunded = n(r.out_refunded);
        return {
          enrollmentId: String(r.out_enrollment),
          title: String((locale === "fa" ? r.out_class_title : r.out_class_title_en || r.out_class_title) ?? ""),
          fee,
          paid,
          refunded,
          pending: n(r.out_pending),
          remaining: Math.max(0, fee - (paid - refunded)),
        };
      }),
      payments: ((pay ?? []) as Row[]).map((r) => ({
        id: String(r.out_id),
        classTitle: String(r.out_class_title ?? "—"),
        kind: r.out_kind === "refund" ? "refund" : "payment",
        status: r.out_status === "pending" ? "pending" : "completed",
        amount: n(r.out_amount),
        method: String(r.out_method ?? "other"),
        paidAt: String(r.out_paid_at ?? ""),
        reference: (r.out_reference as string | null) ?? null,
      })),
    };
  } catch {
    return empty;
  }
}

export interface MySalaryStatement {
  id: string;
  periodKey: string;
  method: string;
  rate: number;
  sessions: number;
  minutes: number;
  gross: number;
  paid: number;
}
export interface MySalaryPayment {
  id: string;
  periodKey: string;
  amount: number;
  method: string;
  paidAt: string;
  reference: string | null;
}

/** A teacher's own salary statements and the payments made against them. */
export async function getMySalary(): Promise<{ statements: MySalaryStatement[]; payments: MySalaryPayment[] }> {
  const empty: { statements: MySalaryStatement[]; payments: MySalaryPayment[] } = { statements: [], payments: [] };
  if (!isSupabaseConfigured()) return empty;
  try {
    const sb = await createClient();
    const [{ data: st }, { data: pay }] = await Promise.all([sb.rpc("my_salary"), sb.rpc("my_salary_payments")]);
    return {
      statements: ((st ?? []) as Row[]).map((r) => ({
        id: String(r.out_id),
        periodKey: String(r.out_period_key),
        method: String(r.out_method),
        rate: n(r.out_rate),
        sessions: n(r.out_sessions),
        minutes: n(r.out_minutes),
        gross: n(r.out_gross),
        paid: n(r.out_paid),
      })),
      payments: ((pay ?? []) as Row[]).map((r) => ({
        id: String(r.out_id),
        periodKey: String(r.out_period_key),
        amount: n(r.out_amount),
        method: String(r.out_method ?? "other"),
        paidAt: String(r.out_paid_at ?? ""),
        reference: (r.out_reference as string | null) ?? null,
      })),
    };
  } catch {
    return empty;
  }
}
