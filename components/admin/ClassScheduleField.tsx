"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { ClassRow } from "@/lib/supabase/types";
import { Field, TimeSelect } from "@/components/admin/fields";
import { WEEKDAYS, dayLabel, slotsOf, type Weekday } from "@/lib/schedule";

type Labels = {
  scheduleDays: string;
  classTime: string;
  classStartTime: string;
  classEndTime: string;
  sameTimeAllDays: string;
};

/**
 * Meeting days + times. By default one From/To applies to every day; switch it
 * off to give each day its own time (e.g. Wed 15:00–16:00, Sun 12:00–14:00).
 * Submits: schedule_days[], same_time ("1"|"0"), then either start_time/end_time
 * or slot_start_<day>/slot_end_<day> — read by readClassFields on the server.
 */
export function ClassScheduleField({ locale, klass, labels }: { locale: Locale; klass?: ClassRow; labels: Labels }) {
  const initial = useMemo(() => slotsOf(klass ?? {}), [klass]);
  const [days, setDays] = useState<Set<Weekday>>(() => new Set(initial.map((s) => s.day)));
  const [same, setSame] = useState(() => new Set(initial.map((s) => `${s.start}-${s.end}`)).size <= 1);

  const first = initial[0];
  const slotFor = (d: Weekday) => initial.find((s) => s.day === d) ?? first;
  const picked = WEEKDAYS.filter((d) => days.has(d));

  const toggle = (d: Weekday) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  return (
    <>
      <Field label={labels.scheduleDays}>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <label key={day} className="cursor-pointer">
              <input
                type="checkbox"
                name="schedule_days"
                value={day}
                checked={days.has(day)}
                onChange={() => toggle(day)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-slate peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {dayLabel(day, locale)}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <div>
        <span className="text-sm font-medium text-ink">{labels.classTime}</span>
        <input type="hidden" name="same_time" value={same ? "1" : "0"} />

        {picked.length > 1 && (
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={same}
              onChange={(e) => setSame(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {labels.sameTimeAllDays}
          </label>
        )}

        {same || picked.length <= 1 ? (
          <div className="mt-2 grid gap-6 sm:grid-cols-2">
            <Field label={labels.classStartTime}>
              <TimeSelect name="start_time" required defaultValue={first?.start} />
            </Field>
            <Field label={labels.classEndTime}>
              <TimeSelect name="end_time" required defaultValue={first?.end} />
            </Field>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {picked.map((day) => {
              const s = slotFor(day);
              return (
                <div key={day} className="grid items-end gap-4 rounded-lg border border-line bg-sand/40 p-4 sm:grid-cols-[7rem_1fr_1fr]">
                  <span className="pb-3 text-sm font-bold text-ink">{dayLabel(day, locale)}</span>
                  <Field label={labels.classStartTime}>
                    <TimeSelect name={`slot_start_${day}`} required defaultValue={s?.start} />
                  </Field>
                  <Field label={labels.classEndTime}>
                    <TimeSelect name={`slot_end_${day}`} required defaultValue={s?.end} />
                  </Field>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
