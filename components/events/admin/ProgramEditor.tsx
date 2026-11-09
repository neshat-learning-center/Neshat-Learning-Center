"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { makeET } from "@/lib/events/labels";
import type { ProgramItem } from "@/lib/events/types";
import { TextInput } from "@/components/admin/fields";

/** Repeatable programme rows (time + Persian + English). Serialised into a hidden JSON field. */
export function ProgramEditor({ name, initial, locale }: { name: string; initial: ProgramItem[]; locale: Locale }) {
  const t = makeET(locale);
  const [rows, setRows] = useState<ProgramItem[]>(initial.length ? initial : []);
  const set = (i: number, patch: Partial<ProgramItem>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-ink">{t("a_programTitle")}</span>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2 border border-line p-3 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center">
          <input type="time" value={r.time} onChange={(e) => set(i, { time: e.target.value })} aria-label={t("a_progTime")} dir="ltr" className="w-full rounded-md border border-line-strong bg-canvas px-3 py-3 text-ink outline-none focus:border-accent" />
          <TextInput value={r.fa} onChange={(e) => set(i, { fa: e.target.value })} placeholder={t("a_progFa")} />
          <TextInput value={r.en} onChange={(e) => set(i, { en: e.target.value })} placeholder={t("a_progEn")} dir="ltr" className="text-start" />
          <button type="button" onClick={() => setRows((x) => x.filter((_, k) => k !== i))} className="text-sm text-red-600 hover:underline">{t("a_remove")}</button>
        </div>
      ))}
      <button type="button" onClick={() => setRows((r) => [...r, { time: "", fa: "", en: "" }])} className="w-fit border border-line-strong px-4 py-2 text-sm text-ink hover:border-ink">+ {t("a_addRow")}</button>
    </div>
  );
}
