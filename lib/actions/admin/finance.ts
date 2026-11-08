"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import { makeT, friendlyError } from "@/lib/finance/labels";
import { parseToman, parsePercentToBp } from "@/lib/finance/money";
import { loadLedger } from "@/lib/finance/data";
import { salaryTable, paidAgainst } from "@/lib/finance/calc";
import { parseMonthKey, monthRange, todayIso } from "@/lib/finance/periods";
import {
  PAY_METHODS, SALARY_METHODS, MANUAL_EXPENSE_CATEGORIES, type PayMethod, type ExpenseCategory,
} from "@/lib/finance/types";

export type FinState = { ok?: boolean; error?: string; message?: string };

// ---- plumbing -----------------------------------------------------------------

async function guard(locale: Locale): Promise<FinState | null> {
  const t = makeT(locale);
  if (!isSupabaseConfigured()) return { error: t("notConnected") };
  const s = await getSession();
  if (!s || s.role !== "admin" || s.demo) return { error: t("forbidden") };
  return null;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const isoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const oneOf = <T extends string>(v: string, list: readonly T[]): T | null => (list as readonly string[]).includes(v) ? (v as T) : null;

function done(locale: Locale): FinState {
  revalidatePath(`/${locale}/dashboard/admin/finance`, "layout");
  return { ok: true, message: makeT(locale)("saved") };
}

/** Wrap an action body: auth guard + uniform error mapping (incl. duplicate idempotency keys). */
async function run(locale: Locale, body: (sb: Awaited<ReturnType<typeof createClient>>, t: ReturnType<typeof makeT>) => Promise<FinState | void>): Promise<FinState> {
  const denied = await guard(locale);
  if (denied) return denied;
  const t = makeT(locale);
  try {
    const sb = await createClient();
    const r = await body(sb, t);
    return r ?? done(locale);
  } catch (e) {
    const err = e as { message?: string; code?: string };
    // a double-submit that raced past the idempotency check hits the unique key — that's a success, not an error
    if (err?.code === "23505" && /client_key/i.test(err.message ?? "")) return done(locale);
    return { error: friendlyError(err?.message ?? String(e), locale) };
  }
}

const must = (r: { error: { message: string; code?: string } | null }) => {
  if (r.error) throw r.error;
};

function readMethod(fd: FormData, key = "method"): PayMethod {
  return oneOf(str(fd, key), PAY_METHODS) ?? "cash";
}

// ---- settings & rates -----------------------------------------------------------

export async function saveSettings(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const method = oneOf(str(fd, "default_salary_method"), SALARY_METHODS);
    const rate = method === "percentage" ? parsePercentToBp(str(fd, "default_salary_rate")) : parseToman(str(fd, "default_salary_rate") || "0");
    const minutes = Number(str(fd, "default_session_minutes"));
    const markup = Number(str(fd, "book_markup_percent"));
    const low = Number(str(fd, "low_stock_threshold"));
    const calendar = oneOf(str(fd, "calendar"), ["jalali", "gregorian"] as const);
    const range = oneOf(str(fd, "default_report_range"), ["this_month", "last_month", "last_3_months", "this_year"] as const);
    if (!method || rate == null || !calendar || !range) return { error: t("invalidInput") };
    if (![minutes, markup, low].every((n) => Number.isInteger(n) && n >= 0) || minutes < 1) return { error: t("invalidInput") };
    must(await sb.from("fin_settings").update({
      default_salary_method: method, default_salary_rate: rate, default_session_minutes: minutes,
      book_markup_percent: markup, low_stock_threshold: low, calendar, default_report_range: range, updated_at: new Date().toISOString(),
    }).eq("id", true));
  });
}

export async function saveTeacherRate(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const teacher = str(fd, "teacher_id");
    const method = oneOf(str(fd, "method"), SALARY_METHODS);
    if (!teacher || !method) return { error: t("invalidInput") };
    const rate = method === "percentage" ? parsePercentToBp(str(fd, "rate")) : parseToman(str(fd, "rate"));
    if (rate == null) return { error: method === "percentage" ? t("invalidInput") : t("invalidAmount") };
    must(await sb.from("teacher_finance_profiles").upsert(
      { teacher_id: teacher, method, rate, updated_at: new Date().toISOString() }, { onConflict: "teacher_id" },
    ));
  });
}

// ---- salaries --------------------------------------------------------------------

/** Freeze the live calculation for one teacher + month into a statement. */
async function saveStatement(
  sb: Awaited<ReturnType<typeof createClient>>, locale: Locale, teacherId: string, periodKey: string, replace: boolean,
): Promise<"saved" | "skipped"> {
  const res = await loadLedger(locale);
  if (!res.ok) throw new Error(res.message ?? res.reason);
  const { ledger } = res;
  const mo = parseMonthKey(periodKey);
  if (!mo) throw new Error("invalid period");
  const cal = ledger.settings.calendar;
  const row = salaryTable(ledger, cal, mo).find((r) => r.teacherId === teacherId);
  if (!row) throw new Error("teacher not found");
  if (row.statement && !replace) return "skipped";
  // never recalculate something that already has payments (the database enforces this too)
  if (row.statement && paidAgainst(ledger, row.statement.id) > 0) return "skipped";
  const r = monthRange(cal, mo);
  const { error } = await sb.rpc("fin_save_salary_statement", {
    p_teacher: teacherId, p_period_key: periodKey, p_start: r.from, p_end: r.to, p_method: row.method,
    p_rate: row.rate, p_sessions: row.sessions, p_minutes: row.minutes, p_revenue: row.revenue,
    p_gross: row.calculated, p_replace: replace,
  });
  if (error) throw error;
  return "saved";
}

export async function generateStatement(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const teacher = str(fd, "teacher_id");
    const key = str(fd, "period_key");
    if (!teacher || !parseMonthKey(key)) return { error: t("invalidInput") };
    await saveStatement(sb, locale, teacher, key, str(fd, "replace") === "1");
  });
}

export async function generateAllStatements(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const key = str(fd, "period_key");
    const mo = parseMonthKey(key);
    if (!mo) return { error: t("invalidInput") };
    const res = await loadLedger(locale);
    if (!res.ok) return { error: res.message ?? t("loadError") };
    const rows = salaryTable(res.ledger, res.ledger.settings.calendar, mo);
    for (const r of rows) {
      if (r.statement || r.calculated <= 0) continue; // existing statements are never overwritten here
      await saveStatement(sb, locale, r.teacherId, key, false);
    }
  });
}

export async function recordSalaryPayment(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const amount = parseToman(str(fd, "amount"));
    const date = str(fd, "paid_at") || todayIso();
    if (!amount || amount <= 0) return { error: t("invalidAmount") };
    if (!isoDate(date)) return { error: t("invalidDate") };
    const { error } = await sb.rpc("fin_record_salary_payment", {
      p_statement: str(fd, "statement_id"), p_amount: amount, p_method: readMethod(fd), p_paid_at: date,
      p_reference: str(fd, "reference"), p_note: str(fd, "note"), p_client_key: str(fd, "client_key") || null,
    });
    if (error) throw error;
  });
}

export async function voidSalaryPayment(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb) => {
    const { error } = await sb.rpc("fin_void_salary_payment", { p_id: str(fd, "id"), p_reason: str(fd, "reason") });
    if (error) throw error;
  });
}

// ---- student payments ---------------------------------------------------------------

export async function recordStudentPayment(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const amount = parseToman(str(fd, "amount"));
    const date = str(fd, "paid_at") || todayIso();
    const kind = oneOf(str(fd, "kind"), ["payment", "refund"] as const) ?? "payment";
    const status = oneOf(str(fd, "status"), ["completed", "pending"] as const) ?? "completed";
    if (!amount || amount <= 0) return { error: t("invalidAmount") };
    if (!isoDate(date)) return { error: t("invalidDate") };
    const { error } = await sb.rpc("fin_record_student_payment", {
      p_enrollment: str(fd, "enrollment_id"), p_amount: amount, p_kind: kind, p_status: status,
      p_method: readMethod(fd), p_paid_at: date, p_reference: str(fd, "reference"), p_note: str(fd, "note"),
      p_client_key: str(fd, "client_key") || null,
    });
    if (error) throw error;
  });
}

export async function confirmStudentPayment(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const date = str(fd, "paid_at") || todayIso();
    if (!isoDate(date)) return { error: t("invalidDate") };
    const { error } = await sb.rpc("fin_confirm_student_payment", { p_id: str(fd, "id"), p_paid_at: date });
    if (error) throw error;
  });
}

export async function voidStudentPayment(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb) => {
    const { error } = await sb.rpc("fin_void_student_payment", { p_id: str(fd, "id"), p_reason: str(fd, "reason") });
    if (error) throw error;
  });
}

export async function setStudentFee(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const fee = parseToman(str(fd, "fee"));
    if (fee == null) return { error: t("invalidAmount") };
    const { error } = await sb.rpc("fin_set_student_fee", { p_enrollment: str(fd, "enrollment_id"), p_fee: fee });
    if (error) throw error;
  });
}

// ---- books ----------------------------------------------------------------------------

export async function addInventoryBook(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const price = parseToman(str(fd, "selling_price") || "0");
    if (price == null) return { error: t("invalidAmount") };
    const { error } = await sb.rpc("fin_inventory_add", { p_book: str(fd, "book_id"), p_selling: price });
    if (error) throw error;
  });
}

export async function setSellingPrice(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const price = parseToman(str(fd, "selling_price"));
    if (price == null) return { error: t("invalidAmount") };
    must(await sb.from("book_inventory").update({ selling_price: price, updated_at: new Date().toISOString() }).eq("id", str(fd, "inventory_id")));
  });
}

const posInt = (v: string) => (/^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null);

export async function recordBookPurchase(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const qty = posInt(str(fd, "quantity"));
    const cost = parseToman(str(fd, "unit_cost"));
    const date = str(fd, "date") || todayIso();
    if (!qty || cost == null) return { error: t("invalidInput") };
    if (!isoDate(date)) return { error: t("invalidDate") };
    const { error } = await sb.rpc("fin_record_book_purchase", {
      p_inventory: str(fd, "inventory_id"), p_qty: qty, p_unit_cost: cost, p_date: date, p_method: readMethod(fd),
      p_supplier: str(fd, "supplier"), p_note: str(fd, "note"), p_client_key: str(fd, "client_key") || null,
    });
    if (error) throw error;
  });
}

export async function recordBookSale(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const qty = posInt(str(fd, "quantity"));
    const price = parseToman(str(fd, "unit_price"));
    const date = str(fd, "date") || todayIso();
    if (!qty || price == null) return { error: t("invalidInput") };
    if (!isoDate(date)) return { error: t("invalidDate") };
    const { error } = await sb.rpc("fin_record_book_sale", {
      p_inventory: str(fd, "inventory_id"), p_qty: qty, p_unit_price: price, p_date: date, p_method: readMethod(fd),
      p_student: str(fd, "student_id") || null, p_buyer: str(fd, "buyer"), p_note: str(fd, "note"),
      p_client_key: str(fd, "client_key") || null,
    });
    if (error) throw error;
  });
}

export async function voidBookSale(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb) => {
    const { error } = await sb.rpc("fin_void_book_sale", { p_id: str(fd, "id"), p_reason: str(fd, "reason") });
    if (error) throw error;
  });
}

export async function voidBookPurchase(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb) => {
    const { error } = await sb.rpc("fin_void_book_purchase", { p_id: str(fd, "id"), p_reason: str(fd, "reason") });
    if (error) throw error;
  });
}

// ---- expenses & other income ---------------------------------------------------------------

function readExpense(fd: FormData, t: ReturnType<typeof makeT>) {
  const category = oneOf(str(fd, "category"), MANUAL_EXPENSE_CATEGORIES as readonly ExpenseCategory[]);
  const amount = parseToman(str(fd, "amount"));
  const date = str(fd, "expense_date") || todayIso();
  if (!category) return { error: t("invalidInput") } as const;
  if (!amount || amount <= 0) return { error: t("invalidAmount") } as const;
  if (!isoDate(date)) return { error: t("invalidDate") } as const;
  return {
    row: {
      category, amount, expense_date: date, method: readMethod(fd), description: str(fd, "description") || null,
      receipt_path: str(fd, "receipt_path") || null,
    },
  } as const;
}

export async function addExpense(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const r = readExpense(fd, t);
    if ("error" in r) return { error: r.error };
    const s = await getSession();
    must(await sb.from("expenses").insert({ ...r.row, client_key: str(fd, "client_key") || null, created_by: s?.id ?? null }));
  });
}

export async function updateExpense(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const r = readExpense(fd, t);
    if ("error" in r) return { error: r.error };
    must(await sb.from("expenses").update({ ...r.row, updated_at: new Date().toISOString() }).eq("id", str(fd, "id")).is("voided_at", null));
  });
}

export async function voidExpense(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const reason = str(fd, "reason");
    if (!reason) return { error: t("voidReason") };
    must(await sb.from("expenses").update({ voided_at: new Date().toISOString(), void_reason: reason }).eq("id", str(fd, "id")).is("voided_at", null));
  });
}

export async function addOtherIncome(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const amount = parseToman(str(fd, "amount"));
    const date = str(fd, "income_date") || todayIso();
    const source = str(fd, "source");
    if (!amount || amount <= 0) return { error: t("invalidAmount") };
    if (!isoDate(date) || !source) return { error: t("invalidInput") };
    const s = await getSession();
    must(await sb.from("other_income").insert({
      amount, income_date: date, source, method: readMethod(fd), note: str(fd, "note") || null,
      client_key: str(fd, "client_key") || null, created_by: s?.id ?? null,
    }));
  });
}

export async function voidOtherIncome(locale: Locale, _p: FinState, fd: FormData): Promise<FinState> {
  return run(locale, async (sb, t) => {
    const reason = str(fd, "reason");
    if (!reason) return { error: t("voidReason") };
    must(await sb.from("other_income").update({ voided_at: new Date().toISOString(), void_reason: reason }).eq("id", str(fd, "id")).is("voided_at", null));
  });
}
