import { P, Pop, Tile, Bubble, OpenBook, BookStack } from "./shared";

/** German: a Brandenburg-Gate-inspired colonnade, umlaut tiles, books and "Guten Tag". */
export function GermanIllustration() {
  return (
    <>
      <Pop d={40}>
        <g>
          <rect x="140" y="134" width="200" height="126" fill={P.sand} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <rect x={142 + i * 36} y="134" width="20" height="126" rx="2" fill={P.paper} />
              <rect x={155 + i * 36} y="134" width="7" height="126" fill={P.sandDeep} />
            </g>
          ))}
          <rect x="128" y="258" width="224" height="11" rx="2" fill={P.sandDeep} />
          <rect x="128" y="112" width="224" height="24" rx="2" fill={P.sandDeep} />
          <rect x="128" y="132" width="224" height="5" fill={P.lineStrong} />
          <rect x="156" y="90" width="168" height="24" rx="2" fill={P.paper} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={170 + i * 30} y="97" width="16" height="10" rx="2" fill={P.sandDeep} />
          ))}
          {/* quadriga + victoria */}
          <g fill={P.slate}>
            <rect x="206" y="74" width="68" height="17" rx="3" />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${210 + i * 16} 74q2 -16 12 -14q-3 8 -2 14z`} />
            ))}
            <path d="M236 44L246 74H230Z" />
            <circle cx="240" cy="38" r="6" />
          </g>
        </g>
      </Pop>
      <Pop d={140}>
        <BookStack x={44} y={298} w={92} colors={[P.slate, P.accent, P.paper]} />
      </Pop>
      <Pop d={200}>
        <OpenBook x={414} y={298} w={104} h={56} />
      </Pop>
      <Pop d={280} float={1}>
        <Tile x={82} y={120} ch="Ä" fill={P.accent} rot={-10} />
      </Pop>
      <Pop d={340} float={2} fd={0.8}>
        <Tile x={398} y={136} ch="Ö" fill={P.slate} ink={P.paper} rot={8} />
      </Pop>
      <Pop d={400} float={3} fd={1.5}>
        <Tile x={64} y={190} ch="Ü" rot={6} />
      </Pop>
      <Pop d={460} float={1} fd={0.5}>
        <Tile x={420} y={208} ch="ß" fill={P.tint} rot={-7} />
      </Pop>
      <Pop d={540} float={2} fd={0.2}>
        <Bubble x={330} y={22} w={128} h={42} tail="l">
          <text x="394" y="49" textAnchor="middle" fontSize="16" fontWeight="800" fill={P.ink} style={{ fontFamily: "var(--font-en)" }}>
            Guten Tag
          </text>
        </Bubble>
      </Pop>
    </>
  );
}
