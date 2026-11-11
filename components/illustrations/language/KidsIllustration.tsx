import { P, Pop, Tile, Star, Pencil, BookStack } from "./shared";

/** Kids & Teens: ABC blocks, stars, a paper plane, pencils and books - playful but tidy. */
export function KidsIllustration() {
  return (
    <>
      <Pop d={40}>
        <BookStack x={282} y={300} w={120} colors={[P.accent, P.slate, P.paper]} />
      </Pop>
      <Pop d={140}>
        <g>
          <Tile x={120} y={274} ch="A" s={70} fill={P.accent} rot={-4} />
          <Tile x={196} y={278} ch="B" s={62} fill={P.paper} rot={5} />
          <Tile x={152} y={206} ch="C" s={62} fill={P.slate} ink={P.paper} rot={-8} />
        </g>
      </Pop>
      <Pop d={300} float={1}>
        <g filter="url(#li-sh)" transform="translate(340 120) rotate(-14)">
          <path d="M-46 8L52 -26L12 40L-4 14Z" fill={P.paper} />
          <path d="M-4 14L52 -26L-14 26Z" fill={P.sandDeep} />
          <path d="M-4 14L8 38L12 40Z" fill={P.lineStrong} />
        </g>
        <path d="M60 170q40 -50 100 -30t120 -6" stroke={P.lineStrong} strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" fill="none" />
      </Pop>
      <Pop d={380} float={2} fd={0.6}>
        <Star cx={90} cy={96} r={20} />
      </Pop>
      <Pop d={440} float={3} fd={1.2}>
        <Star cx={238} cy={66} r={12} fill={P.slate} />
      </Pop>
      <Pop d={500} float={1} fd={0.4}>
        <Star cx={416} cy={64} r={10} fill={P.tint} />
      </Pop>
      <Pop d={540} float={2}>
        <Pencil x={40} y={222} rot={-70} len={86} body={P.slate} />
      </Pop>
      <Pop d={600} float={3} fd={0.9}>
        <g transform="translate(424 234)" filter="url(#li-sh)">
          <circle r="22" fill={P.accent} />
          <circle cx="-7" cy="-4" r="2.4" fill={P.slate} />
          <circle cx="7" cy="-4" r="2.4" fill={P.slate} />
          <path d="M-8 6q8 8 16 0" stroke={P.slate} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      </Pop>
    </>
  );
}
