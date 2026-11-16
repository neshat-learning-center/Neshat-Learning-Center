"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { saveEnrollmentProgress } from "@/lib/actions/join";
import { lt } from "@/lib/join/links-labels";

const input =
  "rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

/** One student's level + progress, editable by the class teacher or an admin. */
export function StudentProgressRow({
  locale,
  classId,
  enrollmentId,
  name,
  phone,
  level: level0,
  progress: progress0,
  extra,
}: {
  locale: Locale;
  classId: string;
  enrollmentId: string;
  name: string;
  phone?: string | null;
  level: string;
  progress: number;
  extra?: ReactNode;
}) {
  const t = lt(locale);
  const [level, setLevel] = useState(level0);
  const [progress, setProgress] = useState(String(progress0));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const dirty = level !== level0 || progress !== String(progress0);
  const save = () =>
    start(async () => {
      const r = await saveEnrollmentProgress(locale, classId, enrollmentId, level, Number(progress));
      setMsg(r.ok ? { ok: true, text: t("saved") } : { ok: false, text: t("failed") });
    });

  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{name}</p>
        {phone && (
          <p dir="ltr" className="text-start text-xs text-muted">
            {phone}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">{t("level")}</span>
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            maxLength={40}
            placeholder={t("levelPh")}
            dir="ltr"
            className={`${input} w-28 text-start`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">{t("progress")}</span>
          <input
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            dir="ltr"
            className={`${input} w-24 text-start`}
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-slate transition-colors hover:bg-accent-deep disabled:opacity-50"
        >
          {t("save")}
        </button>
        <span role="status" aria-live="polite" className={`min-w-14 text-xs ${msg?.ok ? "text-accent-deep" : "text-red-600"}`}>
          {msg?.text}
        </span>
        {extra}
      </div>
    </li>
  );
}
