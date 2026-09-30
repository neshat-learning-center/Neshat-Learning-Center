"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/config";
import { PLACEMENT_QUESTIONS } from "@/content/placementTest";
import { CEFR_LABELS, type CefrLevel } from "@/content/cefr";
import { levelFromScore } from "@/lib/placement";
import { getCoursesByLevel } from "@/lib/data/public";
import type { Course } from "@/content/types";
import type { PlacementAnswer } from "@/lib/supabase/types";

export type StartAttemptState = { error?: string; attemptId?: string };

/** Step 1: personal info alone is already a usable lead — saved right away
 * so a visitor who drops off before finishing the quiz still shows up in
 * the admin dashboard. */
export async function startPlacementAttempt(
  locale: Locale,
  _prev: StartAttemptState,
  formData: FormData,
): Promise<StartAttemptState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) return { error: "missing-fields" };
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!isSupabaseConfigured()) {
    // Demo mode: nothing to persist to yet — the quiz still runs below.
    return { attemptId: "demo" };
  }

  // Generated here (rather than read back after insert) so the row's own
  // RLS stays admin-read-only — no public select policy is needed for the
  // client to learn the id it'll submit the quiz step against.
  const id = randomUUID();
  const supabase = await createClient();
  const { error } = await supabase.from("placement_attempts").insert({ id, name, phone, email, locale });
  if (error) return { error: error.message };
  return { attemptId: id };
}

export interface PlacementResult {
  score: number;
  total: number;
  level: CefrLevel;
  levelLabel: (typeof CEFR_LABELS)[CefrLevel];
  suggestions: Course[];
  /** false in demo mode or if the save failed — the score is still valid
   * and shown either way, this just means it won't appear in the dashboard. */
  saved: boolean;
}

/** Step 2: score the quiz server-side (the answer key never reaches the
 * client) and attach the result to the attempt the info step created. */
export async function submitPlacementAnswers(
  attemptId: string,
  answers: { questionId: string; selectedIndex: number }[],
): Promise<PlacementResult> {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));
  const scored: PlacementAnswer[] = PLACEMENT_QUESTIONS.map((q) => {
    const selectedIndex = answerByQuestion.get(q.id) ?? -1;
    return { questionId: q.id, selectedIndex, correct: selectedIndex === q.correctIndex };
  });
  const score = scored.filter((s) => s.correct).length;
  const total = PLACEMENT_QUESTIONS.length;
  const level = levelFromScore(score, total);

  let saved = false;
  if (isSupabaseConfigured() && attemptId !== "demo") {
    const session = await getSession();
    const studentId = session && !session.demo && session.role === "student" ? session.id : null;
    const supabase = await createClient();
    const { error } = await supabase
      .from("placement_attempts")
      .update({ score, total, level_code: level, answers: scored, student_id: studentId })
      .eq("id", attemptId);
    saved = !error;
  }

  const suggestions = await getCoursesByLevel(level);
  return { score, total, level, levelLabel: CEFR_LABELS[level], suggestions, saved };
}
