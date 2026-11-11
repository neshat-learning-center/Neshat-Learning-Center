import { P, Pop, Tile, Pencil, BookStack } from "./shared";

/** IELTS: an exam paper with a checklist, band score, progress bar, pencil, timer and academic books. */
export function IELTSIllustration() {
  const rows: [number, number, boolean][] = [[-60, 104, true], [-28, 82, true], [4, 112, true], [36, 66, false]];
  return (
    <>
      <Pop d={40}>
        <g transform="translate(236 176) rotate(-3)" filter="url(#li-sh)">
          <rect x="-88" y="-128" width="176" height="252" rx="10" fill={P.paper} />
          <rect x="-70" y="-108" width="74" height="10" rx="5" fill={P.ink} />
          <rect x="-70" y="-90" width="48" height="6" rx="3" fill={P.sandDeep} />
          <path d="M-70 -70H70" stroke={P.line} strokeWidth="1.5" />
          {rows.map(([y, w, done], i) => (
            <g key={i}>
              <rect x="-70" y={y - 8} width="18" height="18" rx="5" fill={done ? P.accent : P.canvas} stroke={done ? P.accent : P.lineStrong} strokeWidth="1.5" />
              {done && <path d={`M-65 ${y + 1}l4 4 7 -8`} stroke={P.slate} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
              <rect x="-40" y={y - 3} width={w} height="7" rx="3.5" fill={P.sandDeep} />
              <rect x="-40" y={y + 9} width={w * 0.6} height="5" rx="2.5" fill={P.line} />
            </g>
          ))}
          <path d="M-70 66H70" stroke={P.line} strokeWidth="1.5" />
          <rect x="-70" y="84" width="140" height="10" rx="5" fill={P.sandDeep} />
          <rect x="-70" y="84" width="98" height="10" rx="5" fill={P.accent} />
          <rect x="-70" y="102" width="40" height="6" rx="3" fill={P.lineStrong} />
          <g transform="translate(84 -108)">
            <circle r="27" fill={P.accent} />
            <text y="4" textAnchor="middle" fontSize="19" fontWeight="800" fill={P.slate} style={{ fontFamily: "var(--font-en)" }}>
              7.5
            </text>
            <text y="16" textAnchor="middle" fontSize="6.5" fontWeight="800" letterSpacing="1.2" fill={P.slate} style={{ fontFamily: "var(--font-en)" }}>
              BAND
            </text>
          </g>
        </g>
      </Pop>
      <Pop d={200}>
        <BookStack x={34} y={298} w={92} colors={[P.slate, P.paper, P.accent]} />
      </Pop>
      <Pop d={300} float={1}>
        <Pencil x={318} y={262} rot={-64} len={104} />
      </Pop>
      <Pop d={380} float={2} fd={0.8}>
        <g transform="translate(414 116)" filter="url(#li-sh)">
          <rect x="-5" y="-38" width="10" height="9" rx="2" fill={P.slate} />
          <circle r="25" fill={P.paper} />
          <circle r="25" fill="none" stroke={P.accent} strokeWidth="5" strokeDasharray="105 160" strokeLinecap="round" transform="rotate(-90)" />
          <path d="M0 0V-13M0 0L9 5" stroke={P.slate} strokeWidth="2.4" strokeLinecap="round" />
          <circle r="2.6" fill={P.slate} />
        </g>
      </Pop>
      {/* the four IELTS skills */}
      {[
        ["L", 66, 78, P.accent, P.slate, -8],
        ["R", 54, 134, P.paper, P.ink, 5],
        ["W", 76, 190, P.slate, P.paper, -4],
        ["S", 408, 214, P.tint, P.ink, 7],
      ].map(([ch, x, y, f, k, r], i) => (
        <Pop key={ch as string} d={440 + i * 60} float={((i % 3) + 1) as 1 | 2 | 3} fd={i * 0.5}>
          <Tile x={x as number} y={y as number} ch={ch as string} s={34} fill={f as string} ink={k as string} rot={r as number} />
        </Pop>
      ))}
    </>
  );
}
