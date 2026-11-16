import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";

export interface JoinPanelData {
  code: string | null;
  requireApproval: boolean;
  requests: { id: string; studentName: string; viaCode: boolean; createdAt: string }[];
}

/** Teacher/admin view of one class: its join code, approval switch and pending requests. */
export async function getJoinPanel(classId: string): Promise<JoinPanelData> {
  const empty: JoinPanelData = { code: null, requireApproval: false, requests: [] };
  if (!isSupabaseConfigured()) return empty;
  const sb = await createClient();
  const [{ data: row }, { data: reqs }] = await Promise.all([
    sb.from("class_join_codes").select("code, require_approval").eq("class_id", classId).maybeSingle(),
    sb.rpc("list_join_requests", { p_class: classId }),
  ]);
  return {
    code: row?.code ?? null,
    requireApproval: row?.require_approval ?? false,
    requests: ((reqs ?? []) as { out_id: string; out_name: string; out_via_code: boolean; out_created_at: string }[]).map((r) => ({
      id: r.out_id,
      studentName: r.out_name,
      viaCode: r.out_via_code,
      createdAt: r.out_created_at,
    })),
  };
}

export interface RequestableClass {
  id: string;
  label: string;
}
export interface StudentJoinData {
  classes: RequestableClass[];
  pending: { classId: string; label: string }[];
}

/** Student side: open classes they could ask to join, and their requests still waiting. */
export async function getStudentJoinData(studentId: string, locale: Locale): Promise<StudentJoinData> {
  const empty: StudentJoinData = { classes: [], pending: [] };
  if (!isSupabaseConfigured()) return empty;
  const sb = await createClient();
  const [{ data: classes }, { data: mine }, { data: reqs }] = await Promise.all([
    sb
      .from("classes")
      .select("id, title, title_en, schedule, schedule_en, teacher:profiles(full_name, full_name_en)")
      .in("status", ["upcoming", "active"])
      .order("created_at", { ascending: false }),
    sb.from("enrollments").select("class_id").eq("student_id", studentId),
    sb.from("class_join_requests").select("class_id, status").eq("student_id", studentId).eq("status", "pending"),
  ]);

  const enrolled = new Set((mine ?? []).map((e) => e.class_id));
  const waiting = new Set((reqs ?? []).map((r) => r.class_id));
  const one = <T,>(v: unknown) => (Array.isArray(v) ? v[0] : v) as T | undefined;

  const all = (classes ?? []).map((c) => {
    const t = one<{ full_name?: string; full_name_en?: string }>(c.teacher);
    const title = locale === "fa" ? c.title : c.title_en || c.title;
    const teacher = locale === "fa" ? t?.full_name : t?.full_name_en || t?.full_name;
    const when = locale === "fa" ? c.schedule : c.schedule_en || c.schedule;
    return { id: c.id as string, label: [title, teacher, when].filter(Boolean).join(" · ") };
  });

  return {
    classes: all.filter((c) => !enrolled.has(c.id) && !waiting.has(c.id)),
    pending: all.filter((c) => waiting.has(c.id)).map((c) => ({ classId: c.id, label: c.label })),
  };
}
