import type { CefrLevel } from "./cefr";

/**
 * The English placement test's question bank. English-only regardless of
 * site locale — it's testing English, the same way the reference sites this
 * was modeled after do it. Ordered by difficulty (A1 → C2); 4 questions per
 * level makes the scoring math simple (see lib/placement.ts).
 *
 * IMPORTANT: this file (with `correctIndex`) must only ever be imported by
 * server-side code (the placement page's Server Component, the submit
 * action). Client-facing code gets `sanitizeQuestions()`'s stripped version
 * instead — never pass a raw question into a "use client" component's
 * props, or the correct answers ship in the client JS bundle.
 */
export interface PlacementQuestion {
  id: string;
  level: CefrLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // A1
  { id: "a1-1", level: "A1", prompt: "She ___ a teacher.", options: ["is", "am", "are", "be"], correctIndex: 0 },
  { id: "a1-2", level: "A1", prompt: "I ___ two brothers.", options: ["has", "have", "having", "had"], correctIndex: 1 },
  { id: "a1-3", level: "A1", prompt: "This is ___ book.", options: ["a", "an", "the", "—"], correctIndex: 0 },
  { id: "a1-4", level: "A1", prompt: "What ___ your name?", options: ["are", "do", "is", "am"], correctIndex: 2 },

  // A2
  { id: "a2-1", level: "A2", prompt: "They ___ to the cinema yesterday.", options: ["go", "goes", "went", "going"], correctIndex: 2 },
  { id: "a2-2", level: "A2", prompt: "There ___ a lot of people at the party.", options: ["is", "be", "was", "were"], correctIndex: 3 },
  { id: "a2-3", level: "A2", prompt: "I usually ___ up at 7 am.", options: ["wake", "waking", "woke", "wakes"], correctIndex: 0 },
  { id: "a2-4", level: "A2", prompt: "Can you tell me ___ the station is?", options: ["what", "who", "where", "how"], correctIndex: 2 },

  // B1
  { id: "b1-1", level: "B1", prompt: "If it rains tomorrow, we ___ the picnic.", options: ["cancel", "will cancel", "would cancel", "canceled"], correctIndex: 1 },
  { id: "b1-2", level: "B1", prompt: "She has been working here ___ five years.", options: ["since", "during", "from", "for"], correctIndex: 3 },
  { id: "b1-3", level: "B1", prompt: "By the time we arrived, the film ___ already started.", options: ["has", "was", "had", "is"], correctIndex: 2 },
  { id: "b1-4", level: "B1", prompt: "I'd rather you ___ smoke in here.", options: ["don't", "won't", "didn't", "not"], correctIndex: 2 },

  // B2
  { id: "b2-1", level: "B2", prompt: "Despite ___ hard, he failed the exam.", options: ["study", "studied", "studying", "to study"], correctIndex: 2 },
  { id: "b2-2", level: "B2", prompt: "The report needs to be finished ___ Friday.", options: ["until", "since", "for", "by"], correctIndex: 3 },
  { id: "b2-3", level: "B2", prompt: "Hardly ___ the meeting begun when the fire alarm rang.", options: ["did", "has", "was", "had"], correctIndex: 3 },
  { id: "b2-4", level: "B2", prompt: "I wish I ___ more time to prepare.", options: ["have", "had", "would have", "has"], correctIndex: 1 },

  // C1
  { id: "c1-1", level: "C1", prompt: "Not only ___ late, but he also forgot the documents.", options: ["he was", "was he", "he is", "is he"], correctIndex: 1 },
  { id: "c1-2", level: "C1", prompt: "It's high time you ___ that habit.", options: ["give up", "gives up", "would give up", "gave up"], correctIndex: 3 },
  { id: "c1-3", level: "C1", prompt: "The proposal was met with ___ skepticism from the board.", options: ["considerate", "considering", "considerable", "consider"], correctIndex: 2 },
  { id: "c1-4", level: "C1", prompt: "Had I known about the traffic, I ___ earlier.", options: ["would leave", "had left", "will leave", "would have left"], correctIndex: 3 },

  // C2
  { id: "c2-1", level: "C2", prompt: "The committee's decision, ___ controversial, was ultimately upheld.", options: ["although", "despite", "albeit", "nevertheless"], correctIndex: 2 },
  { id: "c2-2", level: "C2", prompt: "Her argument was so ___ that even the harshest critics were persuaded.", options: ["compel", "compellingly", "compulsion", "compelling"], correctIndex: 3 },
  { id: "c2-3", level: "C2", prompt: "No sooner ___ the announcement been made than shares began to fall.", options: ["did", "was", "has", "had"], correctIndex: 3 },
  { id: "c2-4", level: "C2", prompt: "He is renowned for his ___ attention to detail.", options: ["meticulously", "meticulousness", "meticulous", "meticulosity"], correctIndex: 2 },
];

export interface PublicPlacementQuestion {
  id: string;
  prompt: string;
  options: string[];
}

/** Strips the answer key — this is the only shape that may reach client-side code. */
export function sanitizeQuestions(questions: PlacementQuestion[]): PublicPlacementQuestion[] {
  return questions.map(({ id, prompt, options }) => ({ id, prompt, options }));
}
