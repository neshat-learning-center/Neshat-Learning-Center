"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";

const base =
  "w-full rounded-md border border-line-strong bg-canvas px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * A branded replacement for <input type="date"> — the native calendar
 * popup is OS chrome with zero CSS surface. Still stores/submits a plain
 * Gregorian "YYYY-MM-DD" (same as the native input, and what the DB column
 * expects); only the presentation is custom, with month/day labels shown in
 * the active locale. The public site's own Persian-calendar formatting of
 * this same value elsewhere is unaffected — that's a display step, not
 * something this input needs to replicate.
 */
export function DatePicker({
  name,
  defaultValue,
  locale,
  required,
  placeholder = "—",
  clearLabel = "پاک کردن",
  todayLabel = "امروز",
}: {
  name: string;
  defaultValue?: string | null;
  locale: Locale;
  required?: boolean;
  placeholder?: string;
  clearLabel?: string;
  todayLabel?: string;
}) {
  const initial = defaultValue ? parseISODate(defaultValue) : null;
  const [value, setValue] = useState<Date | null>(initial);
  const [viewDate, setViewDate] = useState<Date>(initial ?? new Date());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Gregorian structure throughout (same as the native input) — only the
  // month/weekday/day labels are localized, via ICU's Persian-numeral
  // formatting for fa, forced onto the Gregorian calendar so no separate
  // Jalali date-math is needed.
  const fmtLocale = locale === "fa" ? "fa-IR-u-ca-gregory" : "en-US";
  const weekStartsOn = locale === "fa" ? 6 : 0; // Saturday for fa, Sunday for en

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(fmtLocale, { month: "long", year: "numeric" }), [fmtLocale]);
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(fmtLocale, { weekday: "narrow" }), [fmtLocale]);
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(fmtLocale, { day: "numeric" }), [fmtLocale]);
  const fullFormatter = useMemo(
    () => new Intl.DateTimeFormat(fmtLocale, { day: "numeric", month: "long", year: "numeric" }),
    [fmtLocale],
  );

  const weekdayLabels = useMemo(() => {
    const sunday = new Date(2023, 0, 1); // a known Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + ((i + weekStartsOn) % 7));
      return weekdayFormatter.format(d);
    });
  }, [weekdayFormatter, weekStartsOn]);

  const gridDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewDate, weekStartsOn]);

  function commit(d: Date | null) {
    setValue(d);
    setOpen(false);
    if (d) setViewDate(d);
  }

  const today = new Date();

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value ? toISODate(value) : ""} required={required} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${base} flex cursor-pointer items-center justify-between gap-2 text-start`}
      >
        <span className={value ? "" : "text-muted/70"}>{value ? fullFormatter.format(value) : placeholder}</span>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-muted">
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div dir="ltr" className="absolute z-30 mt-2 w-72 rounded-md border border-line-strong bg-paper p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand hover:text-ink"
              aria-label="previous month"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-ink">{monthFormatter.format(viewDate)}</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand hover:text-ink"
              aria-label="next month"
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-xs text-muted">
            {weekdayLabels.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1">
            {gridDays.map((d, i) => {
              const inMonth = d.getMonth() === viewDate.getMonth();
              const isSelected = value && sameDay(d, value);
              const isToday = sameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => commit(d)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-accent font-semibold text-slate"
                      : isToday
                        ? "border border-accent-deep text-ink"
                        : inMonth
                          ? "text-ink hover:bg-sand"
                          : "text-muted/40 hover:bg-sand"
                  }`}
                >
                  {dayFormatter.format(d)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
            <button type="button" onClick={() => commit(null)} className="font-medium text-accent-deep hover:underline">
              {clearLabel}
            </button>
            <button type="button" onClick={() => commit(today)} className="font-medium text-accent-deep hover:underline">
              {todayLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
