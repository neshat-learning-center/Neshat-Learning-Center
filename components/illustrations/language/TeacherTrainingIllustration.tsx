import { P, Pop, Bust, Arm, Star, BookStack } from "./shared";

/** Teacher Training: a teacher presenting at a small whiteboard with materials. */
export function TeacherTrainingIllustration() {
  return (
    <>
      <Pop d={40}>
        <g filter="url(#li-sh)">
          <rect x="60" y="46" width="248" height="170" rx="10" fill={P.slate} />
          <rect x="68" y="54" width="232" height="154" rx="6" fill={P.paper} />
          <path d="M120 216L110 296M248 216L258 296" stroke={P.slate} strokeWidth="6" strokeLinecap="round" />
          <rect x="100" y="214" width="168" height="8" rx="4" fill={P.slateSoft} />
        </g>
      </Pop>
      <Pop d={180}>
        <g>
          <rect x="88" y="74" width="120" height="11" rx="5.5" fill={P.ink} />
          <rect x="88" y="94" width="84" height="7" rx="3.5" fill={P.sandDeep} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx="96" cy={124 + i * 22} r="6" fill={P.accent} />
              <rect x="112" y={120 + i * 22} width={[104, 84, 96][i]} height="7" rx="3.5" fill={P.line} />
            </g>
          ))}
          <g transform="translate(250 130)">
            <circle r="30" fill={P.wash} />
            <path d="M-20 18V6M-8 18V-6M4 18V-14M16 18V-2" stroke={P.accent} strokeWidth="8" strokeLinecap="round" />
          </g>
        </g>
      </Pop>
      <Pop d={260}>
        <BookStack x={50} y={308} w={86} colors={[P.accent, P.slate]} />
      </Pop>
      <Pop d={320}>
        <Bust cx={390} by={300} hair="long" skin={P.skinA} top={P.accent} look={-1} glasses mouth="open" scale={1.2} />
      </Pop>
      <Pop d={400}>
        <Arm from={[348, 262]} to={[304, 188]} sleeve={P.accent} skin={P.skinA} bend={-18} />
        <path d="M304 188L262 142" stroke={P.slate} strokeWidth="3.5" strokeLinecap="round" />
      </Pop>
      <Pop d={480} float={1}>
        <g transform="translate(414 100)" filter="url(#li-sh)">
          <rect x="-36" y="-22" width="72" height="44" rx="8" fill={P.paper} />
          <rect x="-26" y="-14" width="52" height="28" rx="4" fill={P.wash} />
          <path d="M-18 8l12 -10l9 6l14 -14" stroke={P.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </Pop>
      <Pop d={540} float={2} fd={0.8}>
        <Star cx={330} cy={44} r={11} />
      </Pop>
      <Pop d={600} float={3} fd={0.3}>
        <g transform="translate(34 100)" filter="url(#li-sh)">
          <circle r="21" fill={P.accent} />
          <path d="M-12 0l9 -9l9 9M-12 8l9 -9l9 9" stroke={P.slate} strokeWidth="0" fill="none" />
          <path d="M-10 -8l10 -5l10 5l-10 5zM-6 -2v7q6 5 12 0v-7" fill={P.slate} />
        </g>
      </Pop>
    </>
  );
}
