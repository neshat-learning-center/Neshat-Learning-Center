import { P, Pop, Tile, Bubble, OpenBook, Star } from "./shared";

/** English: an open book spilling letters and "Hello!", with a stylised Big Ben behind. */
export function EnglishIllustration() {
  return (
    <>
      <Pop d={40}>
        <g transform="translate(388 0)">
          <rect x="-17" y="142" width="34" height="158" rx="2" fill={P.paper} /><rect x="5" y="142" width="12" height="158" fill={P.sandDeep} />
          {[158, 186, 214, 242].map((y) => (
            <rect key={y} x="-4.5" y={y} width="9" height="17" rx="4.5" fill={P.sandDeep} />
          ))}
          <rect x="-25" y="100" width="50" height="46" rx="3" fill={P.slate} />
          <circle cx="0" cy="122" r="16" fill={P.paper} />
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={i} cx={+(Math.sin((i * Math.PI) / 6) * 12).toFixed(2)} cy={+(122 - Math.cos((i * Math.PI) / 6) * 12).toFixed(2)} r="1.2" fill={P.accent} />
          ))}
          <path d="M0 122V111M0 122L7 126" stroke={P.slate} strokeWidth="2" strokeLinecap="round" />
          <path d="M-25 100L0 58L25 100Z" fill={P.slate} />
          <rect x="-2.5" y="42" width="5" height="18" rx="2.5" fill={P.accent} />
          <rect x="-25" y="144" width="50" height="6" rx="2" fill={P.slate} />
        </g>
      </Pop>
      <Pop d={120}>
        <OpenBook x={196} y={296} w={216} h={112} />
      </Pop>
      <Pop d={260} float={1}>
        <Tile x={140} y={170} ch="A" fill={P.accent} rot={-12} />
      </Pop>
      <Pop d={320} float={2} fd={0.9}>
        <Tile x={202} y={140} ch="B" rot={7} />
      </Pop>
      <Pop d={380} float={3} fd={1.6}>
        <Tile x={266} y={172} ch="C" fill={P.slate} ink={P.paper} rot={-5} />
      </Pop>
      <Pop d={440} float={1} fd={0.4}>
        <Bubble x={36} y={62} w={116} h={46}>
          <text x="94" y="92" textAnchor="middle" fontSize="19" fontWeight="800" fill={P.ink} style={{ fontFamily: "var(--font-en)" }}>
            Hello!
          </text>
        </Bubble>
      </Pop>
      <Pop d={520} float={2} fd={1.1}>
        <Bubble x={206} y={30} w={84} h={42} tail="r" fill={P.accent}>
          <text x="248" y="58" textAnchor="middle" fontSize="19" fontWeight="800" fill={P.slate} style={{ fontFamily: "var(--font-en)" }}>
            Hi!
          </text>
        </Bubble>
      </Pop>
      <Pop d={580} float={3} fd={0.6}>
        <Star cx={330} cy={150} r={9} />
      </Pop>
    </>
  );
}
