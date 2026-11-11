import { P, Pop, Tile, Tulip } from "./shared";

/** Turkish: an Istanbul skyline (domed mosque + minarets), a yellow tram, tulips, İ ı Ş Ğ. */
export function TurkishIllustration() {
  return (
    <>
      <Pop d={40}>
        <g>
          {/* minarets */}
          {[132, 348].map((x) => (
            <g key={x}>
              <rect x={x - 8} y="108" width="16" height="156" fill={P.paper} />
              <rect x={x + 2} y="108" width="6" height="156" fill={P.sandDeep} />
              <rect x={x - 15} y="148" width="30" height="7" rx="2" fill={P.sandDeep} />
              <path d={`M${x - 10} 108L${x} 72L${x + 10} 108Z`} fill={P.slate} />
              <rect x={x - 1.5} y="58" width="3" height="16" fill={P.accent} />
            </g>
          ))}
          {/* semi-domes */}
          <path d="M142 210a34 34 0 0 1 68 0z" fill={P.sandDeep} />
          <path d="M270 210a34 34 0 0 1 68 0z" fill={P.sandDeep} />
          {/* hall + central dome */}
          <rect x="164" y="170" width="152" height="94" fill={P.paper} />
          <path d="M168 172a72 72 0 0 1 144 0z" fill={P.paper} /><path d="M240 100a72 72 0 0 1 72 72H240z" fill={P.sandDeep} opacity="0.55" />
          <rect x="238" y="86" width="4" height="16" fill={P.accent} />
          <circle cx="240" cy="84" r="4.5" fill={P.accent} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${178 + i * 28} 262v-30a8 8 0 0 1 16 0v30z`} fill={i === 2 ? P.accent : P.tint} />
          ))}
        </g>
      </Pop>
      <Pop d={160}>
        <g className="li-tram">
          <path d="M150 224h100M150 224l-14 40M250 224l14 40" stroke={P.slate} strokeWidth="2" fill="none" opacity="0" />
          <path d="M126 236H270" stroke={P.slate} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M198 236L190 252M198 236L206 252" stroke={P.slate} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <g filter="url(#li-sh)">
            <rect x="100" y="250" width="196" height="46" rx="11" fill={P.accent} />
            <rect x="104" y="246" width="188" height="9" rx="4.5" fill={P.slate} />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={114 + i * 32} y="260" width="24" height="18" rx="5" fill={P.paper} />
            ))}
            <rect x="262" y="258" width="22" height="30" rx="5" fill={P.tint} />
            <rect x="108" y="284" width="180" height="5" fill={P.slate} opacity="0.22" />
          </g>
          {[134, 262].map((x) => (
            <g key={x}>
              <circle cx={x} cy="298" r="9" fill={P.slate} />
              <circle cx={x} cy="298" r="3.4" fill={P.paper} />
            </g>
          ))}
        </g>
      </Pop>
      <Pop d={280}>
        <path d="M30 308H450" stroke={P.slate} strokeWidth="3" strokeLinecap="round" />
      </Pop>
      <Pop d={320} float={1}>
        <Tile x={76} y={118} ch="İ" fill={P.accent} rot={-10} />
      </Pop>
      <Pop d={380} float={2} fd={0.9}>
        <Tile x={420} y={104} ch="ı" fill={P.paper} rot={7} />
      </Pop>
      <Pop d={440} float={3} fd={1.5}>
        <Tile x={58} y={194} ch="Ş" fill={P.slate} ink={P.paper} rot={6} />
      </Pop>
      <Pop d={500} float={1} fd={0.5}>
        <Tile x={424} y={180} ch="Ğ" fill={P.tint} rot={-8} />
      </Pop>
      <Pop d={560}>
        <Tulip x={390} y={304} h={70} />
        <Tulip x={414} y={304} h={54} petal={P.slate} />
      </Pop>
      {/* tile-pattern medallion */}
      <Pop d={600} float={2} fd={0.3}>
        <g transform="translate(110 56)" filter="url(#li-sh)">
          <circle r="26" fill={P.paper} />
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse key={i} cx="0" cy="-12" rx="5" ry="10" fill={i % 2 ? P.accent : P.sandDeep} transform={`rotate(${i * 45})`} />
          ))}
          <circle r="5" fill={P.slate} />
        </g>
      </Pop>
    </>
  );
}
