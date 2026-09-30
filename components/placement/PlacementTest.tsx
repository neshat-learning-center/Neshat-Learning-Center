"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import { href } from "@/lib/utils";
import { useActionState } from "react";
import { startPlacementAttempt, submitPlacementAnswers, type PlacementResult } from "@/lib/actions/placement";
import type { PublicPlacementQuestion } from "@/content/placementTest";

const field =
  "w-full border-0 border-b border-line-strong bg-transparent px-0 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";
const labelCls = "text-sm font-medium text-ink";
const primaryBtn =
  "inline-flex w-fit items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-60";

type Step = "info" | "quiz" | "result";

function localeNumber(n: number, locale: Locale) {
  return n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
}

/** Outer component just owns a remount key, so "take it again" can reset
 * every bit of flow state (including the useActionState below, which can't
 * be reset imperatively) by simply remounting the flow from scratch. */
export function PlacementTest(props: { dict: Dictionary; locale: Locale; questions: PublicPlacementQuestion[] }) {
  const [attemptKey, setAttemptKey] = useState(0);
  return <PlacementFlow key={attemptKey} {...props} onRetake={() => setAttemptKey((k) => k + 1)} />;
}

function PlacementFlow({
  dict,
  locale,
  questions,
  onRetake,
}: {
  dict: Dictionary;
  locale: Locale;
  questions: PublicPlacementQuestion[];
  onRetake: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [scoring, startScoring] = useTransition();

  const [infoState, infoAction, infoPending] = useActionState(startPlacementAttempt.bind(null, locale), {});
  const attemptId = infoState.attemptId ?? null;
  const step: Step = result ? "result" : attemptId ? "quiz" : "info";

  const f = dict.pages.form;
  const p = dict.placement;

  function selectOption(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    if (!attemptId) return;
    startScoring(async () => {
      const payload = questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1 }));
      const res = await submitPlacementAnswers(attemptId, payload);
      setResult(res);
    });
  }

  // ---- step 1: personal info ----
  if (step === "info") {
    return (
      <div>
        <h2 className="text-2xl font-bold text-ink">{p.infoTitle}</h2>
        <p className="mt-2 max-w-lg text-ink-soft">{p.infoLead}</p>

        <form action={infoAction} className="mt-8 flex flex-col gap-7">
          <div className="grid gap-7 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelCls}>
                {f.name} <span className="text-accent-deep">*</span>
              </span>
              <input required name="name" className={field} placeholder={f.name} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={labelCls}>
                {f.phone} <span className="text-accent-deep">*</span>
              </span>
              <input required name="phone" type="tel" dir="ltr" className={`${field} text-start`} placeholder="0912…" />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className={labelCls}>{f.email}</span>
            <input name="email" type="email" dir="ltr" className={`${field} text-start`} placeholder="you@email.com" />
          </label>

          {infoState.error && (
            <p className="text-sm text-red-600">
              {infoState.error === "missing-fields" ? p.missingFields : infoState.error}
            </p>
          )}

          <button type="submit" disabled={infoPending} className={`${primaryBtn} mt-2`}>
            {infoPending ? p.starting : p.start}
          </button>
        </form>
      </div>
    );
  }

  // ---- step 2: quiz ----
  if (step === "quiz") {
    const q = questions[index];
    const selected = answers[q.id];
    const pct = Math.round(((index + 1) / questions.length) * 100);
    const isLast = index === questions.length - 1;

    return (
      <div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out-soft)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-muted">
          {p.questionLabel} {localeNumber(index + 1, locale)} {p.ofLabel} {localeNumber(questions.length, locale)}
        </p>
        <h2 dir="ltr" className="mt-3 text-start text-2xl font-bold leading-snug text-ink">
          {q.prompt}
        </h2>

        <div className="mt-7 flex flex-col gap-3">
          {q.options.map((opt, i) => {
            const on = selected === i;
            return (
              <button
                key={i}
                type="button"
                dir="ltr"
                onClick={() => selectOption(q.id, i)}
                className={`rounded-sm border px-5 py-3.5 text-start transition-colors duration-200 ${
                  on
                    ? "border-ink bg-ink text-canvas"
                    : "border-line-strong text-ink hover:border-ink/40 hover:bg-sand/60"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={selected == null || scoring}
          onClick={next}
          className={`${primaryBtn} mt-8`}
        >
          {scoring ? p.scoring : isLast ? p.finish : p.next}
        </button>
      </div>
    );
  }

  // ---- step 3: result ----
  if (result) {
    const levelText = locale === "fa" ? result.levelLabel.fa : result.levelLabel.en;
    const levelNote = locale === "fa" ? result.levelLabel.noteFa : result.levelLabel.noteEn;

    return (
      <div>
        <p className="eyebrow eyebrow-accent flex items-center gap-3">
          <span className="inline-block h-px w-6 bg-accent" />
          {p.resultTitle}
        </p>
        <p className="mt-4 max-w-lg text-ink-soft">{p.resultLead}</p>

        <div className="mt-7 flex flex-wrap items-center gap-5 rounded-sm border border-line bg-sand/50 p-6">
          <span dir="ltr" className="font-en text-5xl font-extrabold text-ink">
            {result.level}
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{levelText}</p>
            <p className="mt-1 max-w-md text-sm text-ink-soft">{levelNote}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted" dir="ltr">
          {p.scoreLabel}: {result.score}/{result.total}
        </p>
        {!result.saved && <p className="mt-2 text-xs text-muted">{p.notSavedNote}</p>}

        <h3 className="mt-12 text-lg font-bold text-ink">{p.suggestedCoursesTitle}</h3>
        {result.suggestions.length === 0 ? (
          <p className="mt-3 text-ink-soft">
            {p.noSuggestions}{" "}
            <Link href={href(locale, "/courses")} className="font-medium text-accent-deep underline-offset-4 hover:underline">
              {p.browseCourses}
            </Link>
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {result.suggestions.map((c) => (
              <Link
                key={c.slug}
                href={href(locale, `/courses/${c.slug}`)}
                className="group rounded-sm border border-line bg-canvas p-5 transition-colors duration-300 hover:border-ink/25"
              >
                <h4 className="font-bold text-ink transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  {pick(c.title, locale)}
                </h4>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{pick(c.summary, locale)}</p>
              </Link>
            ))}
          </div>
        )}

        <button type="button" onClick={onRetake} className="mt-10 text-sm font-medium text-accent-deep underline-offset-4 hover:underline">
          {p.retake}
        </button>
      </div>
    );
  }

  return null;
}
