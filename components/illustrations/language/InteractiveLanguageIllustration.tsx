import { EnglishIllustration } from "./EnglishIllustration";
import { GermanIllustration } from "./GermanIllustration";
import { TurkishIllustration } from "./TurkishIllustration";
import { IELTSIllustration } from "./IELTSIllustration";
import { ConversationIllustration } from "./ConversationIllustration";
import { KidsIllustration } from "./KidsIllustration";
import { TeacherTrainingIllustration } from "./TeacherTrainingIllustration";
import { P } from "./shared";

const SCENES: Record<string, () => React.JSX.Element> = {
  english: EnglishIllustration,
  german: GermanIllustration,
  turkish: TurkishIllustration,
  ielts: IELTSIllustration,
  conversation: ConversationIllustration,
  kids: KidsIllustration,
  "teacher-training": TeacherTrainingIllustration,
};

/** All seven scenes stay mounted; CSS crossfades the active one (no flicker, no remount). */
export function InteractiveLanguageIllustration({ active, className }: { active: string; className?: string }) {
  return (
    <svg viewBox="0 0 480 340" className={className} style={{ direction: "ltr" }} role="img" aria-hidden="true" focusable="false">
      <defs>
        <filter id="li-sh" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#2b2a26" floodOpacity="0.14" />
        </filter>
      </defs>
      <ellipse cx="240" cy="318" rx="200" ry="14" fill={P.sandDeep} opacity="0.55" />
      {Object.entries(SCENES).map(([slug, Scene]) => (
        <g key={slug} className="li-scene" data-on={active === slug ? "true" : "false"}>
          <Scene />
        </g>
      ))}
    </svg>
  );
}
