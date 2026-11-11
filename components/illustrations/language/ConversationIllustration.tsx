import { P, Pop, Bubble, Bust, Star } from "./shared";

/** Conversation: two friendly people trading animated speech bubbles, with speaking/listening cues. */
export function ConversationIllustration() {
  return (
    <>
      <Pop d={40}>
        <Bust cx={140} by={300} hair="bun" skin={P.skinB} top={P.accent} look={1} mouth="open" scale={1.25} />
      </Pop>
      <Pop d={120}>
        <Bust cx={340} by={300} hair="short" skin={P.skinC} top={P.slate} look={-1} glasses scale={1.25} />
      </Pop>
      <Pop d={280} float={1}>
        <Bubble x={48} y={30} w={150} h={54} tail="l">
          <text x="123" y="64" textAnchor="middle" fontSize="20" fontWeight="800" fill={P.ink} style={{ fontFamily: "var(--font-en)" }}>
            How are you?
          </text>
        </Bubble>
      </Pop>
      <Pop d={420} float={2} fd={1}>
        <Bubble x={266} y={78} w={156} h={52} tail="r" fill={P.accent}>
          <g className="li-dots" fill={P.slate}>
            <circle cx="320" cy="104" r="5" />
            <circle cx="344" cy="104" r="5" />
            <circle cx="368" cy="104" r="5" />
          </g>
        </Bubble>
      </Pop>
      {/* sound waves from speaker, ear cue on listener */}
      <Pop d={500}>
        <g fill="none" stroke={P.accent} strokeWidth="3" strokeLinecap="round" className="li-wave">
          <path d="M196 206q9 8 0 18" />
          <path d="M205 198q15 17 0 34" opacity="0.7" />
        </g>
      </Pop>
      <Pop d={560} float={3}>
        <g transform="translate(244 176)" filter="url(#li-sh)">
          <circle r="19" fill={P.paper} />
          <path d="M-5 5q-4 -14 5 -17q10 -2 11 8q0 8 -8 10q-3 6 -8 4" stroke={P.slate} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      </Pop>
      <Pop d={620} float={2} fd={0.7}>
        <Star cx={238} cy={44} r={9} />
        <Star cx={434} cy={200} r={6} fill={P.tint} />
      </Pop>
    </>
  );
}
