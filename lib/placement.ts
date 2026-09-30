import { CEFR_LEVELS, type CefrLevel } from "@/content/cefr";

/** Raw score → CEFR band, by percentage correct (so the question bank's
 * size can change later without the thresholds needing to move too). */
export function levelFromScore(score: number, total: number): CefrLevel {
  if (total <= 0) return CEFR_LEVELS[0];
  const pct = Math.max(0, Math.min(1, score / total));
  const index = Math.min(CEFR_LEVELS.length - 1, Math.floor(pct * CEFR_LEVELS.length));
  return CEFR_LEVELS[index];
}
