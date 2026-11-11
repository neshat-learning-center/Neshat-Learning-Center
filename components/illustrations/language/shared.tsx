import type { CSSProperties, ReactNode } from "react";

/**
 * Shared vocabulary for the seven language scenes, so they read as one family:
 * flat shapes, no outlines except 1.5px hairlines, one soft drop shadow, the
 * Neshat palette, and a single character construction (head + shoulders).
 */
export const P = {
  accent: "var(--color-accent)",
  tint: "var(--color-accent-tint)",
  wash: "var(--color-accent-wash)",
  slate: "var(--color-slate)",
  slateSoft: "var(--color-slate-soft)",
  ink: "var(--color-ink)",
  inkSoft: "var(--color-ink-soft)",
  muted: "var(--color-muted)",
  paper: "var(--color-paper)",
  canvas: "var(--color-canvas)",
  sand: "var(--color-sand)",
  sandDeep: "var(--color-sand-deep)",
  line: "var(--color-line)",
  lineStrong: "var(--color-line-strong)",
  skinA: "#e9b88e",
  skinB: "#c48a5d",
  skinC: "#f3d0ae",
};

const num = (n: number) => String(n);

/** An element that pops in (staggered) when its scene becomes active. `float` adds a gentle idle drift. */
export function Pop({ d = 0, float, fd = 0, children }: { d?: number; float?: 1 | 2 | 3; fd?: number; children: ReactNode }) {
  const style = { ["--d" as string]: `${d}ms` } as CSSProperties;
  const fs = { ["--fd" as string]: `${fd}s` } as CSSProperties;
  return (
    <g className="li-pop" style={style}>
      {float ? <g className={`li-float li-float-${float}`} style={fs}>{children}</g> : children}
    </g>
  );
}

/** A rounded letter block (alphabet tile). */
export function Tile({ x, y, ch, s = 44, fill = P.paper, ink = P.ink, rot = 0, fs }: { x: number; y: number; ch: string; s?: number; fill?: string; ink?: string; rot?: number; fs?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={s * 0.24} fill={fill} filter="url(#li-sh)" />
      <text y={(fs ?? s * 0.54) * 0.34} textAnchor="middle" fontSize={fs ?? s * 0.54} fontWeight="800" fill={ink} style={{ fontFamily: "var(--font-en)" }}>
        {ch}
      </text>
    </g>
  );
}

/** Speech bubble with a tail on the bottom-left (`l`) or bottom-right (`r`). */
export function Bubble({ x, y, w, h, tail = "l", fill = P.paper, children }: { x: number; y: number; w: number; h: number; tail?: "l" | "r"; fill?: string; children?: ReactNode }) {
  const tx = tail === "l" ? x + 24 : x + w - 24;
  const dir = tail === "l" ? -1 : 1;
  return (
    <g filter="url(#li-sh)">
      <rect x={x} y={y} width={w} height={h} rx={Math.min(16, h / 2)} fill={fill} />
      <path d={`M${tx - 9} ${y + h - 2}L${tx + dir * 10} ${y + h + 15}L${tx + 9} ${y + h - 2}Z`} fill={fill} />
      {children}
    </g>
  );
}

export function Star({ cx, cy, r = 8, fill = P.accent, rot = 0 }: { cx: number; cy: number; r?: number; fill?: string; rot?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${num(+(cx + Math.cos(a) * rr).toFixed(2))},${num(+(cy + Math.sin(a) * rr).toFixed(2))}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} transform={`rotate(${rot} ${cx} ${cy})`} strokeLinejoin="round" stroke={fill} strokeWidth="1.5" />;
}

export function Pencil({ x, y, rot = -30, len = 90, body = P.accent }: { x: number; y: number; rot?: number; len?: number; body?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="0" y="-5" width="12" height="10" rx="3" fill={P.slate} />
      <rect x="12" y="-5" width="6" height="10" fill={P.lineStrong} />
      <rect x="18" y="-5" width={len - 18} height="10" fill={body} />
      <path d={`M${len} -5L${len + 15} 0L${len} 5Z`} fill={P.tint} />
      <path d={`M${len + 9.5} -1.8L${len + 15} 0L${len + 9.5} 1.8Z`} fill={P.slate} />
      <rect x="18" y="-5" width={len - 18} height="3" fill={P.paper} opacity="0.35" />
    </g>
  );
}

/** Flat open book seen from the front, centred on (x, y = bottom of the spine). */
export function OpenBook({ x, y, w = 200, h = 100, cover = P.slate }: { x: number; y: number; w?: number; h?: number; cover?: string }) {
  const hw = w / 2;
  const left = `M${x} ${y}L${x - hw} ${y - h * 0.16}L${x - hw} ${y - h}Q${x - hw / 2} ${y - h * 0.9} ${x} ${y - h * 0.78}Z`;
  const right = `M${x} ${y}L${x + hw} ${y - h * 0.16}L${x + hw} ${y - h}Q${x + hw / 2} ${y - h * 0.9} ${x} ${y - h * 0.78}Z`;
  const lines = [0.62, 0.5, 0.38];
  return (
    <g filter="url(#li-sh)">
      <path d={`M${x - hw - 7} ${y - h * 0.1}L${x} ${y + 9}L${x + hw + 7} ${y - h * 0.1}L${x + hw + 7} ${y - h * 0.16}L${x} ${y + 2}L${x - hw - 7} ${y - h * 0.16}Z`} fill={cover} />
      <path d={left} fill={P.paper} />
      <path d={right} fill={P.canvas} />
      <path d={`M${x} ${y}V${y - h * 0.78}`} stroke={P.lineStrong} strokeWidth="1.5" />
      {lines.map((k, i) => (
        <g key={i}>
          <path d={`M${x - hw + 16} ${y - h * (k + 0.2)}Q${x - hw / 2} ${y - h * (k + 0.14)} ${x - 14} ${y - h * (k + 0.1)}`} stroke={P.sandDeep} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d={`M${x + 14} ${y - h * (k + 0.1)}Q${x + hw / 2} ${y - h * (k + 0.14)} ${x + hw - 16} ${y - h * (k + 0.2)}`} stroke={P.sandDeep} strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      ))}
    </g>
  );
}

/** A tidy stack of closed books; `x` is the left edge, `y` the table surface. */
export function BookStack({ x, y, w = 88, colors = [P.slate, P.accent, P.paper] }: { x: number; y: number; w?: number; colors?: string[] }) {
  const t = 16;
  return (
    <g filter="url(#li-sh)">
      {colors.map((col, i) => {
        const yy = y - (i + 1) * t;
        const off = [0, 8, 3][i % 3];
        const ww = w - [0, 12, 6][i % 3];
        return (
          <g key={i}>
            <rect x={x + off} y={yy} width={ww} height={t} rx="3" fill={col} />
            <rect x={x + off + 11} y={yy} width="5" height={t} fill={col === P.slate ? P.accent : P.slate} opacity={col === P.slate ? 1 : 0.85} />
            <rect x={x + off + ww - 4} y={yy + 2} width="2" height={t - 4} fill={P.paper} opacity="0.35" />
          </g>
        );
      })}
    </g>
  );
}

export type Hair = "bun" | "curly" | "short" | "long";

/** One character construction for every scene: head and shoulders. `look` nudges eyes toward who they're facing. */
export function Bust({ cx, by, skin = P.skinA, hair = "short", top = P.accent, look = 0, glasses, mouth = "smile", scale = 1 }: {
  cx: number; by: number; skin?: string; hair?: Hair; top?: string; look?: -1 | 0 | 1; glasses?: boolean; mouth?: "smile" | "open"; scale?: number;
}) {
  const hy = by - 78;
  const e = look * 3;
  return (
    <g transform={`translate(${cx} ${by}) scale(${scale}) translate(${-cx} ${-by})`}>
      {hair === "long" && <path d={`M${cx - 22} ${hy} q0 -26 22 -26 q22 0 22 26 v38 q-7 6 -14 4 v-30 h-16 v30 q-7 2 -14 -4z`} fill={P.slate} />}
      <path d={`M${cx - 52} ${by}Q${cx - 52} ${by - 48} ${cx} ${by - 48}Q${cx + 52} ${by - 48} ${cx + 52} ${by}Z`} fill={top} />
      <rect x={cx - 8} y={by - 58} width="16" height="16" rx="6" fill={skin} />
      <circle cx={cx} cy={hy} r="21" fill={skin} />
      {hair === "bun" && (
        <>
          <circle cx={cx} cy={hy - 28} r="9" fill={P.slate} />
          <path d={`M${cx - 21.5} ${hy - 2}a21.5 21.5 0 0 1 43 0q-21 -9 -43 0z`} fill={P.slate} />
        </>
      )}
      {hair === "short" && <path d={`M${cx - 21.5} ${hy - 1}a21.5 21.5 0 0 1 43 0q-6 -9 -21.5 -9t-21.5 9z`} fill={P.slate} />}
      {hair === "curly" &&
        [-16, -8, 0, 8, 16].map((dx, i) => <circle key={i} cx={cx + dx} cy={hy - 15 - (i % 2 ? 4 : 0)} r="8.5" fill={P.slate} />)}
      {hair === "long" && <path d={`M${cx - 21.5} ${hy - 2}a21.5 21.5 0 0 1 43 0q-10 -12 -22 -10t-21 10z`} fill={P.slate} />}
      <circle cx={cx - 7 + e} cy={hy + 1} r="1.9" fill={P.slate} />
      <circle cx={cx + 7 + e} cy={hy + 1} r="1.9" fill={P.slate} />
      <circle cx={cx - 12 + e} cy={hy + 8} r="3.6" fill={P.tint} opacity="0.9" />
      <circle cx={cx + 12 + e} cy={hy + 8} r="3.6" fill={P.tint} opacity="0.9" />
      {mouth === "smile" ? (
        <path d={`M${cx - 5 + e} ${hy + 8}q5 5 10 0`} stroke={P.slate} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      ) : (
        <path d={`M${cx - 4.5 + e} ${hy + 7.5}q4.5 8 9 0z`} fill={P.slate} />
      )}
      {glasses && (
        <g fill="none" stroke={P.slate} strokeWidth="1.6">
          <circle cx={cx - 7 + e} cy={hy + 1} r="6.2" />
          <circle cx={cx + 7 + e} cy={hy + 1} r="6.2" />
          <path d={`M${cx - 0.8 + e} ${hy + 1}h1.6`} />
        </g>
      )}
    </g>
  );
}

/** A sleeve + hand reaching from a shoulder to a point (waving / pointing / holding). */
export function Arm({ from, to, sleeve = P.accent, skin = P.skinA, bend = 0 }: { from: [number, number]; to: [number, number]; sleeve?: string; skin?: string; bend?: number }) {
  const mx = (from[0] + to[0]) / 2 + bend;
  const my = (from[1] + to[1]) / 2 - Math.abs(bend) * 0.4;
  return (
    <g strokeLinecap="round" fill="none">
      <path d={`M${from[0]} ${from[1]}Q${mx} ${my} ${to[0]} ${to[1]}`} stroke={sleeve} strokeWidth="15" />
      <path d={`M${mx + (to[0] - mx) * 0.55} ${my + (to[1] - my) * 0.55}L${to[0]} ${to[1]}`} stroke={skin} strokeWidth="9" />
      <circle cx={to[0]} cy={to[1]} r="6" fill={skin} stroke="none" />
    </g>
  );
}

export function Tulip({ x, y, h = 70, petal = P.accent }: { x: number; y: number; h?: number; petal?: string }) {
  return (
    <g>
      <path d={`M${x} ${y}Q${x - 6} ${y - h * 0.55} ${x} ${y - h}`} stroke={P.slate} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d={`M${x} ${y - h * 0.3}q-18 -6 -22 -24q14 0 22 24z`} fill={P.sandDeep} />
      <path d={`M${x - 11} ${y - h}q-1 -17 11 -22q12 5 11 22q-11 7 -22 0z`} fill={petal} />
      <path d={`M${x} ${y - h - 22}q-3 10 0 22`} stroke={P.paper} strokeWidth="1.5" opacity="0.5" fill="none" />
    </g>
  );
}
