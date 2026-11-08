import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import {
  DEFAULT_SETTINGS, type Ledger, type FinSettings, type ClassInfo, type EnrollmentInfo, type SessionFact,
} from "./types";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type SB = Awaited<ReturnType<typeof createClient>>;

export type LedgerResult =
  | { ok: true; ledger: Ledger }
  | { ok: false; reason: "not_configured" | "migration" | "error"; message?: string };

const PAGE = 1000;

/** PostgREST caps a response at 1000 rows — page through so totals are never silently truncated. */
async function fetchAll(sb: SB, table: string, select = "*", order = "id"): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from(table).select(select).order(order).range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...((data as unknown as Row[]) ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const rel = <T = Row>(v: unknown): T | undefined => (Array.isArray(v) ? v[0] : (v as T | undefined));
const num = (v: unknown) => (v == null ? 0 : Number(v));

function minutesBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const d = eh * 60 + em - (sh * 60 + sm);
  return d > 0 ? d : null;
}

export async function loadLedger(locale: Locale): Promise<LedgerResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "not_configured" };
  const sb = await createClient();
  try {
    const probe = await sb.from("fin_settings").select("*").maybeSingle();
    if (probe.error) {
      const missing = probe.error.code === "42P01" || probe.error.code === "PGRST205" || /does not exist|schema cache/i.test(probe.error.message);
      return { ok: false, reason: missing ? "migration" : "error", message: probe.error.message };
    }
    const settings: FinSettings = { ...DEFAULT_SETTINGS, ...(probe.data ?? {}) };
    settings.default_salary_rate = num(settings.default_salary_rate);

    const [rates, teachers, classes, enrollments, fees, payments, statements, salaryPayments, inventory, purchases, sales, expenses, income, sessionRows] =
      await Promise.all([
        fetchAll(sb, "teacher_finance_profiles", "*", "teacher_id"),
        fetchAll(sb, "profiles", "id, full_name, full_name_en, role"),
        fetchAll(sb, "classes", "id, title, title_en, teacher_id, course_id, start_time, end_time, courses(title)"),
        fetchAll(sb, "enrollments", "id, student_id, class_id, student:profiles(full_name, full_name_en)"),
        fetchAll(sb, "student_fees", "*", "enrollment_id"),
        fetchAll(sb, "student_payments"),
        fetchAll(sb, "salary_statements"),
        fetchAll(sb, "salary_payments"),
        fetchAll(sb, "book_inventory"),
        fetchAll(sb, "book_purchases"),
        fetchAll(sb, "book_sales"),
        fetchAll(sb, "expenses"),
        fetchAll(sb, "other_income"),
        fetchAll(sb, "fin_class_sessions", "class_id, session_date", "session_date"),
      ]);

    const nameOf = (r: Row | undefined) => (locale === "en" ? r?.full_name_en || r?.full_name : r?.full_name || r?.full_name_en) ?? "—";
    const teacherRows = teachers.filter((p) => p.role === "teacher");
    const teacherName = new Map(teacherRows.map((t) => [t.id as string, nameOf(t)]));

    const classMap = new Map<string, Row>(classes.map((c) => [c.id, c]));
    const classInfos: ClassInfo[] = classes.map((c) => {
      const course = rel(c.courses);
      return {
        id: c.id,
        title: (locale === "en" ? c.title_en || c.title : c.title) ?? "—",
        teacherId: c.teacher_id ?? null,
        courseId: c.course_id ?? null,
        courseTitle: (locale === "en" ? course?.title?.en || course?.title?.fa : course?.title?.fa || course?.title?.en) ?? "—",
      };
    });
    const info = new Map(classInfos.map((c) => [c.id, c]));
    // a class inherits its course's price unless the enrollment has a fee override
    const coursePrice = new Map<string, number>();
    const courseRows = await fetchAll(sb, "courses", "id, price");
    const priceByCourse = new Map(courseRows.map((c) => [c.id as string, num(c.price)]));
    for (const c of classes) coursePrice.set(c.id, priceByCourse.get(c.course_id) ?? 0);

    const feeOverride = new Map(fees.map((f) => [f.enrollment_id as string, num(f.fee_amount)]));
    const enrollmentInfos: EnrollmentInfo[] = enrollments.map((e) => {
      const ci = info.get(e.class_id);
      return {
        id: e.id,
        studentId: e.student_id,
        studentName: nameOf(rel(e.student)),
        classId: e.class_id,
        classTitle: ci?.title ?? "—",
        courseTitle: ci?.courseTitle ?? "—",
        teacherId: ci?.teacherId ?? null,
        teacherName: (ci?.teacherId && teacherName.get(ci.teacherId)) || "—",
        fee: feeOverride.get(e.id) ?? coursePrice.get(e.class_id) ?? 0,
      };
    });

    const sessions: SessionFact[] = [];
    for (const s of sessionRows) {
      const c = classMap.get(s.class_id);
      if (!c?.teacher_id) continue;
      sessions.push({
        classId: s.class_id,
        teacherId: c.teacher_id,
        date: s.session_date,
        minutes: minutesBetween(c.start_time, c.end_time) ?? settings.default_session_minutes,
      });
    }

    const n = <T extends Row>(rows: T[], keys: string[]) =>
      rows.map((r) => ({ ...r, ...Object.fromEntries(keys.map((k) => [k, num(r[k])])) }));

    const ledger: Ledger = {
      settings,
      rates: n(rates, ["rate"]) as unknown as Ledger["rates"],
      teachers: teacherRows.map((t) => ({ id: t.id, name: nameOf(t) })),
      classes: classInfos,
      enrollments: enrollmentInfos,
      payments: n(payments, ["amount"]) as unknown as Ledger["payments"],
      statements: n(statements, ["rate", "sessions", "minutes", "revenue_base", "gross_amount"]) as unknown as Ledger["statements"],
      salaryPayments: n(salaryPayments, ["amount"]) as unknown as Ledger["salaryPayments"],
      inventory: n(inventory, ["selling_price", "last_unit_cost", "stock_qty", "stock_value"]) as unknown as Ledger["inventory"],
      purchases: n(purchases, ["quantity", "unit_cost", "total"]) as unknown as Ledger["purchases"],
      sales: n(sales, ["quantity", "unit_price", "revenue", "cogs"]) as unknown as Ledger["sales"],
      expenses: n(expenses, ["amount"]) as unknown as Ledger["expenses"],
      otherIncome: n(income, ["amount"]) as unknown as Ledger["otherIncome"],
      sessions,
    };
    return { ok: true, ledger };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

/** Books that have no inventory row yet (candidates for "add to inventory"). */
export async function listBooksNotInInventory(locale: Locale, inInventory: Set<string>) {
  const sb = await createClient();
  const books = await fetchAll(sb, "books", "id, title");
  return books
    .filter((b) => !inInventory.has(b.id))
    .map((b) => ({ id: b.id as string, title: ((locale === "en" ? b.title?.en || b.title?.fa : b.title?.fa || b.title?.en) ?? "—") as string }));
}

export async function signedReceiptUrl(path: string): Promise<string | null> {
  const sb = await createClient();
  const { data } = await sb.storage.from("receipts").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function loadAudit(limit = 100) {
  const sb = await createClient();
  const { data } = await sb.from("fin_audit_log").select("*").order("id", { ascending: false }).limit(limit);
  return (data ?? []) as Row[];
}
