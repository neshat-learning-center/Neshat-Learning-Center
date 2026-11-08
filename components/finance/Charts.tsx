"use client";

import { useState } from "react";

export interface Datum {
  label: string;
  /** one value per series, same order as `series` */
  values: number[];
  /** shown in the readout, already formatted */
  tips: string[];
}
export interface Series {
  name: string;
  color: string;
}

const H = 220;
const PAD = { l: 6, r: 6, t: 12, b: 30 };
const SLOT = 64; // viewBox px per category — keeps labels legible at any width

/**
 * Dependency-free SVG bar chart. Responsive by construction: the drawing is
 * sized to its data (so text stays readable), scales down to fit a phone, and
 * scrolls sideways only when there are many months. Instead of a floating
 * tooltip (which can't be hovered on touch screens) a readout line above the
 * chart shows the selected month — tap/click/hover/focus a bar to change it.
 * Drawn left→right regardless of page direction; only text is localised.
 */
export function BarChart({ data, series, empty }: { data: Datum[]; series: Series[]; empty: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const all = data.flatMap((d) => d.values);
  if (data.length === 0 || all.every((v) => v === 0)) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted">{empty}</div>;
  }
  const active = picked ?? data.length - 1;
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  const span = max - min || 1;
  const W = Math.max(300, data.length * SLOT + PAD.l + PAD.r);
  const innerH = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + ((max - v) / span) * innerH;
  const zero = y(0);
  const band = (W - PAD.l - PAD.r) / data.length;
  const bw = Math.min(30, (band * 0.72) / series.length);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-sand/60 px-3 py-2 text-xs" aria-live="polite">
        <span className="font-bold text-ink">{data[active].label}</span>
        {series.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5 text-ink-soft">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
            {s.name}: <b className="text-ink" dir="auto">{data[active].tips[i]}</b>
          </span>
        ))}
      </div>
      <div className="overflow-x-auto" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ minWidth: Math.min(W, data.length * 44) }} role="img">
          <line x1={PAD.l} x2={W - PAD.r} y1={zero} y2={zero} stroke="var(--color-line-strong)" />
          {data.map((d, i) => {
            const cx = PAD.l + band * i + band / 2;
            const on = i === active;
            return (
              <g
                key={i}
                onClick={() => setPicked(i)}
                onMouseEnter={() => setPicked(i)}
                onFocus={() => setPicked(i)}
                tabIndex={0}
                role="button"
                aria-label={`${d.label}: ${d.tips.join(" / ")}`}
                className="cursor-pointer outline-none"
              >
                <rect x={PAD.l + band * i} y={0} width={band} height={H} fill={on ? "var(--color-sand)" : "transparent"} opacity={0.7} />
                {d.values.map((v, s) => {
                  const x = cx - (bw * series.length) / 2 + bw * s;
                  const top = Math.min(y(v), zero);
                  return <rect key={s} x={x + 1} y={top} width={Math.max(bw - 2, 1)} height={Math.max(Math.abs(y(v) - zero), v === 0 ? 0 : 1)} rx={3} fill={series[s].color} />;
                })}
                <text x={cx} y={H - 10} textAnchor="middle" fontSize={12} fontWeight={on ? 700 : 400} fill={on ? "var(--color-ink)" : "var(--color-muted)"}>{d.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/** Ranked horizontal bars (course revenue, book sales). Wraps cleanly on narrow screens. */
export function HBarChart({ rows, color, empty }: { rows: { label: string; value: number; tip: string }[]; color: string; empty: string }) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (rows.length === 0 || max <= 0) {
    return <div className="flex h-32 items-center justify-center text-sm text-muted">{empty}</div>;
  }
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.slice(0, 8).map((r, i) => (
        <li key={i}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
            <span className="min-w-0 break-words font-medium text-ink">{r.label}</span>
            <span className="text-xs text-muted">{r.tip}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sand-deep" dir="ltr">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max((Math.max(r.value, 0) / max) * 100, 1.5)}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
