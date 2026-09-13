"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { gradeSubmission, type HomeworkFormState } from "@/lib/actions/homework";

export function GradeForm({
  dict,
  locale,
  homeworkId,
  studentId,
  defaultGrade,
  defaultFeedback,
}: {
  dict: Dictionary;
  locale: Locale;
  homeworkId: string;
  studentId: string;
  defaultGrade: number | null;
  defaultFeedback: string | null;
}) {
  const [state, formAction, pending] = useActionState<HomeworkFormState, FormData>(
    gradeSubmission.bind(null, locale, homeworkId, studentId),
    {},
  );
  const h = dict.homework;

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-3">
      <input
        name="grade"
        type="number"
        min={0}
        max={100}
        step="0.5"
        dir="ltr"
        defaultValue={defaultGrade ?? ""}
        placeholder={h.grade}
        className="w-24 rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      />
      <input
        name="feedback"
        type="text"
        defaultValue={defaultFeedback ?? ""}
        placeholder={h.feedback}
        className="min-w-[12rem] flex-1 rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-ink disabled:opacity-60"
      >
        {pending ? h.savingGrade : h.saveGrade}
      </button>
      {state.success && <span className="text-xs text-accent-deep">{h.gradeSaved}</span>}
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
