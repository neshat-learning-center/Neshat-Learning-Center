import { useId } from "react";
import type { Locale } from "@/lib/i18n/config";

/**
 * "Everything for your classes, in one place" — a custom flat illustration of the
 * student portal: a laptop showing the weekly class schedule, surrounded by the
 * things the portal holds (attendance, the next date, a video lesson, progress and
 * grades) with books on the desk. Pure SVG: crisp at any size, no images, no
 * dependencies. The laptop interface and the floating cards mirror for Persian
 * (right-to-left); upright glyphs (ticks, play button) are never mirrored.
 */

const W = 640;
const H = 440;
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const c = {
  accent: "var(--color-accent)",
  tint: "var(--color-accent-tint)",
  wash: "var(--color-accent-wash)",
  slate: "var(--color-slate)",
  slateSoft: "var(--color-slate-soft)",
  ink: "var(--color-ink)",
  muted: "var(--color-muted)",
  paper: "var(--color-paper)",
  canvas: "var(--color-canvas)",
  sand: "var(--color-sand)",
  sandDeep: "var(--color-sand-deep)",
  line: "var(--color-line)",
  lineStrong: "var(--color-line-strong)",
};

export function LearningPortalIllustration({ locale, label, className = "" }: { locale: Locale; label: string; className?: string }) {
  const rtl = locale === "fa";
  const uid = useId().replace(/:/g, "");
  const nf = (s: string) => (rtl ? s.replace(/\d/g, (d) => FA_DIGITS[Number(d)]) : s);
  const T = (fa: string, en: string) => (rtl ? fa : en);

  /** mirror a point / a box across the vertical centre of the picture (screen interior is symmetric about x = 320) */
  const px = (x: number) => (rtl ? W - x : x);
  const rx = (x: number, w: number) => (rtl ? W - x - w : x);
  /** shift for a whole floating card so its position mirrors, while its inside is laid out by `mk` */
  const shift = (centre: number) => (rtl ? W - 2 * centre : 0);
  /** inside-card mirroring helper */
  const mk = (width: number) => ({
    p: (x: number) => (rtl ? width - x : x),
    r: (x: number, w: number) => (rtl ? width - x - w : x),
    anchor: (rtl ? "end" : "start") as "end" | "start",
  });

  const days = rtl ? ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"] : ["MON", "TUE", "WED", "THU", "FRI"];
  const colX = (i: number) => 185 + i * 63;
  // [y, height, kind]  kind: a = upcoming class (yellow) · n = normal
  const blocks: [number, number, "a" | "n"][][] = [
    [[168, 30, "n"], [206, 46, "n"]],
    [[180, 42, "a"]],
    [[168, 26, "n"], [200, 52, "n"]],
    [[190, 36, "a"], [232, 22, "n"]],
    [[168, 46, "n"], [222, 32, "n"]],
  ];

  const A = mk(162);
  const D = mk(150);
  const V = mk(186);
  const ring = 2 * Math.PI * 24;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className={`h-auto w-full overflow-visible ${className}`}
      // direction is pinned to ltr so text-anchor means literal left/right; the layout itself is mirrored by hand for Persian
      style={{ fontFamily: rtl ? "var(--font-fa)" : "var(--font-en)", direction: "ltr" }}
    >
      <defs>
        <filter id={`${uid}-s`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="11" floodColor="#262528" floodOpacity="0.13" />
        </filter>
        <filter id={`${uid}-c`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#262528" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* desk surface */}
      <ellipse cx="320" cy="372" rx="236" ry="11" fill={c.ink} opacity="0.07" />
      <path d="M14 372H626" stroke={c.lineStrong} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

      {/* ───────── laptop ───────── */}
      <g filter={`url(#${uid}-s)`}>
        <rect x="125" y="54" width="390" height="262" rx="16" fill={c.slate} />
        <path d="M100 316H540L522 350Q520 356 512 356H128Q120 356 118 350Z" fill={c.sandDeep} />
        <path d="M100 316H540" stroke={c.lineStrong} strokeWidth="1.5" />
        <rect x="290" y="316" width="60" height="7" rx="3.5" fill={c.lineStrong} />
      </g>
      <rect x="135" y="64" width="370" height="242" rx="9" fill={c.paper} />

      {/* top bar */}
      <path d="M135 73a9 9 0 0 1 9-9h352a9 9 0 0 1 9 9v19H135z" fill={c.canvas} />
      {[152, 162, 172].map((x, i) => (
        <circle key={x} cx={px(x)} cy="78" r="3" fill={i === 2 ? c.accent : c.lineStrong} />
      ))}
      <rect x={rx(388, 102)} y="72" width="102" height="12" rx="6" fill={c.sandDeep} />
      <rect x={rx(388, 28)} y="72" width="28" height="12" rx="6" fill={c.tint} />

      {/* sidebar */}
      <rect x={rx(135, 40)} y="92" width="40" height="214" fill={c.canvas} />
      <path d={`M${px(175)} 92V306`} stroke={c.line} />
      <rect x={rx(142, 26)} y="102" width="26" height="26" rx="8" fill={c.tint} />
      {/* calendar */}
      <g stroke={c.ink} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x={px(155) - 7} y="108" width="14" height="13" rx="3" />
        <path d={`M${px(155) - 7} 113H${px(155) + 7}M${px(155) - 3} 106V110M${px(155) + 3} 106V110`} />
      </g>
      {/* video */}
      <g fill="none" stroke={c.muted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx={px(155)} cy="150" r="8" />
        <path d={`M${px(155) - 2} 146.5L${px(155) + 3.5} 150L${px(155) - 2} 153.5Z`} fill={c.muted} />
        {/* attendance */}
        <circle cx={px(155)} cy="184" r="8" />
        <path d={`M${px(155) - 3.5} 184l2.6 2.8l4.6-5.4`} />
        {/* progress */}
        <path d={`M${px(155) - 6} 222v-5M${px(155)} 222v-10M${px(155) + 6} 222v-7.5`} strokeWidth="2.6" />
      </g>

      {/* heading + next-class chip */}
      <rect x={rx(185, 88)} y="102" width="88" height="8" rx="4" fill={c.ink} />
      <rect x={rx(185, 54)} y="116" width="54" height="6" rx="3" fill={c.sandDeep} />
      <rect x={rx(420, 75)} y="100" width="75" height="22" rx="11" fill={c.accent} />
      <circle cx={px(432)} cy="111" r="3.2" fill={c.slate} />
      <rect x={rx(441, 44)} y="108.5" width="44" height="5" rx="2.5" fill={c.slate} opacity="0.85" />

      {/* weekly schedule */}
      {days.map((d, i) => (
        <g key={d}>
          <text x={px(colX(i) + 29)} y="146" textAnchor="middle" fontSize={rtl ? 8.5 : 7.5} fontWeight="700" fill={i === 1 || i === 3 ? c.ink : c.muted} letterSpacing={rtl ? 0 : 0.8}>
            {d}
          </text>
          <rect x={rx(colX(i), 58)} y="154" width="58" height="108" rx="7" fill={c.canvas} />
          {blocks[i].map(([y, h, k], j) => {
            const x = colX(i);
            const up = k === "a";
            return (
              <g key={j}>
                <rect x={rx(x + 4, 50)} y={y} width="50" height={h} rx="6" fill={up ? c.accent : c.sandDeep} />
                <rect x={rx(x + 10, up ? 30 : 26)} y={y + 8} width={up ? 30 : 26} height="5" rx="2.5" fill={up ? c.slate : c.lineStrong} opacity={up ? 0.9 : 1} />
                {h > 30 && <rect x={rx(x + 10, 20)} y={y + 17} width="20" height="4" rx="2" fill={up ? c.slate : c.lineStrong} opacity={up ? 0.45 : 0.7} />}
                {up && i === 1 && (
                  <text x={px(x + 10)} y={y + h - 7} textAnchor={rtl ? "end" : "start"} fontSize="8" fontWeight="800" fill={c.slate}>
                    {nf("18:00")}
                  </text>
                )}
                {up && <circle cx={px(x + 46)} cy={y + 10} r="3" fill={c.slate} />}
              </g>
            );
          })}
        </g>
      ))}

      {/* progress + attendance strip */}
      <rect x={rx(185, 64)} y="270" width="64" height="6" rx="3" fill={c.ink} />
      <rect x={rx(185, 140)} y="284" width="140" height="8" rx="4" fill={c.sandDeep} />
      <rect x={rx(185, 98)} y="284" width="98" height="8" rx="4" fill={c.accent} />
      <rect x={rx(340, 44)} y="270" width="44" height="6" rx="3" fill={c.lineStrong} />
      {Array.from({ length: 8 }).map((_, k) => (
        <rect key={k} x={rx(340 + k * 10.5, 8)} y="284" width="8" height="8" rx="2.4" fill={k === 5 ? c.sandDeep : c.accent} />
      ))}

      {/* ───────── floating: attendance confirmation ───────── */}
      <g transform={`translate(${shift(103)} 0)`}>
        <g className="ev-float" style={{ animationDelay: "-1.2s", animationDuration: "10s" }}>
          <g transform="translate(22 30)" filter={`url(#${uid}-c)`}>
            <rect width="162" height="60" rx="14" fill={c.paper} stroke={c.line} />
            <circle cx={A.p(30)} cy="30" r="15" fill={c.accent} />
            <path d="M-7.5 0.5l5 5l10-11" transform={`translate(${A.p(30)} 30)`} stroke={c.slate} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x={A.p(54)} y="28" textAnchor={A.anchor} fontSize="12.5" fontWeight="800" fill={c.ink}>
              {T("حاضر", "Present")}
            </text>
            <rect x={A.r(54, 60)} y="38" width="60" height="6" rx="3" fill={c.sandDeep} />
          </g>
        </g>
      </g>

      {/* ───────── floating: calendar date ───────── */}
      <g transform={`translate(${shift(542)} 0)`}>
        <g className="ev-float" style={{ animationDelay: "-4s", animationDuration: "11s" }}>
          <g transform="translate(500 18)" filter={`url(#${uid}-c)`}>
            <rect width="84" height="88" rx="14" fill={c.paper} stroke={c.line} />
            <path d="M0 14a14 14 0 0 1 14-14h56a14 14 0 0 1 14 14v14H0z" fill={c.accent} />
            <rect x="20" y="-6" width="6" height="16" rx="3" fill={c.slate} />
            <rect x="58" y="-6" width="6" height="16" rx="3" fill={c.slate} />
            <text x="42" y="19" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={c.slate} letterSpacing={rtl ? 0 : 1}>
              {T("جمعه", "FRI")}
            </text>
            <text x="42" y="63" textAnchor="middle" fontSize="30" fontWeight="800" fill={c.ink}>
              {nf("19")}
            </text>
            <text x="42" y="79" textAnchor="middle" fontSize="10" fontWeight="600" fill={c.muted} letterSpacing={rtl ? 0 : 1}>
              {T("آبان", "NOV")}
            </text>
          </g>
        </g>
      </g>

      {/* ───────── floating: progress + grade ───────── */}
      <g transform={`translate(${shift(93)} 0)`}>
        <g className="ev-float" style={{ animationDelay: "-2.6s", animationDuration: "12s" }}>
          <g transform="translate(18 196)" filter={`url(#${uid}-c)`}>
            <rect width="150" height="96" rx="14" fill={c.paper} stroke={c.line} />
            <g transform={`translate(${D.p(46)} 48)`}>
              <circle r="24" fill="none" stroke={c.sandDeep} strokeWidth="8" />
              <circle r="24" fill="none" stroke={c.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${ring * 0.78} ${ring}`} transform={rtl ? "rotate(-90) scale(1 -1)" : "rotate(-90)"} />
              <text y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill={c.ink} direction={rtl ? "rtl" : "ltr"}>
                {nf("78")}{rtl ? "٪" : "%"}
              </text>
            </g>
            <rect x={D.r(86, 48)} y="18" width="48" height="24" rx="12" fill={c.tint} />
            <path d="M0 -5L1.5 -1.6L5 -1.2L2.4 1.1L3.1 4.7L0 2.9L-3.1 4.7L-2.4 1.1L-5 -1.2L-1.5 -1.6Z" transform={`translate(${D.p(96)} 30.5)`} fill={c.accent} />
            <text x={D.p(113)} y="34.5" textAnchor="middle" fontSize="12" fontWeight="800" fill={c.ink}>
              A+
            </text>
            <rect x={D.r(86, 44)} y="54" width="44" height="6" rx="3" fill={c.sandDeep} />
            <rect x={D.r(86, 30)} y="66" width="30" height="6" rx="3" fill={c.line} />
          </g>
        </g>
      </g>

      {/* ───────── floating: video lesson ───────── */}
      <g transform={`translate(${shift(523)} 0)`}>
        <g className="ev-float" style={{ animationDelay: "-6s", animationDuration: "13s" }}>
          <g transform="translate(430 276)" filter={`url(#${uid}-c)`}>
            <rect width="186" height="94" rx="14" fill={c.slate} />
            <rect x="8" y="8" width="170" height="60" rx="9" fill={c.slateSoft} />
            <rect x={V.r(24, 70)} y="44" width="70" height="5" rx="2.5" fill={c.paper} opacity="0.22" />
            <rect x={V.r(24, 46)} y="54" width="46" height="4" rx="2" fill={c.paper} opacity="0.14" />
            <circle cx="93" cy="38" r="17" fill={c.accent} />
            <path d="M88 30.5L100 38L88 45.5Z" fill={c.slate} />
            <rect x={V.r(16, 46)} y="16" width="46" height="15" rx="7.5" fill={c.accent} />
            <circle cx={V.p(26)} cy="23.5" r="2.8" fill={c.slate} />
            <text x={V.p(34)} y="26.8" textAnchor={V.anchor} fontSize={rtl ? 8 : 7.5} fontWeight="800" fill={c.slate} letterSpacing={rtl ? 0 : 0.6}>
              {T("زنده", "LIVE")}
            </text>
            <rect x="14" y="78" width="158" height="5" rx="2.5" fill={c.paper} opacity="0.2" />
            <rect x={V.r(14, 98)} y="78" width="98" height="5" rx="2.5" fill={c.accent} />
          </g>
        </g>
      </g>

      {/* ───────── books on the desk ───────── */}
      <g transform={`translate(${shift(71)} 0)`}>
        <rect x="30" y="356" width="86" height="16" rx="3" fill={c.slate} />
        <rect x="44" y="356" width="6" height="16" fill={c.accent} />
        <rect x="104" y="356" width="2" height="16" fill={c.paper} opacity="0.25" />
        <rect x="40" y="340" width="70" height="16" rx="3" fill={c.accent} />
        <rect x="52" y="340" width="5" height="16" fill={c.slate} opacity="0.85" />
        <rect x="35" y="326" width="76" height="14" rx="3" fill={c.paper} stroke={c.lineStrong} />
        <rect x="46" y="326" width="5" height="14" fill={c.sandDeep} />
        <g transform="translate(56 318) rotate(-8)">
          <rect width="44" height="5.5" rx="2.5" fill={c.accent} />
          <path d="M44 0l7 2.75L44 5.5z" fill={c.tint} />
          <rect x="-4" width="6" height="5.5" rx="2.5" fill={c.slate} />
        </g>
      </g>
    </svg>
  );
}
