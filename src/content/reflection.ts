export interface ReflectionQ {
  id: string;
  section: "general" | "batting" | "bowling" | "fielding";
  q: string;
  options: string[];
  /** Index of options considered "comfortable/confident" end (higher = more positive). Used only for parent trends. */
}

export const REFLECTION_QS: ReflectionQ[] = [
  { id: "enjoy", section: "general", q: "How much did you enjoy today's game?", options: ["Not at all", "A little", "Sometimes", "Most of it", "Loved it"] },
  { id: "before", section: "general", q: "How did you feel before the game?", options: ["Really worried", "Quite nervous", "A little nervous", "Unsure", "Comfortable", "Confident", "Excited"] },
  { id: "during", section: "general", q: "How did you feel during the game?", options: ["Worried most of the time", "Nervous quite often", "Nervous occasionally", "Mixed feelings", "Mostly relaxed", "Really confident"] },
  { id: "pressure", section: "general", q: "How much pressure did you feel?", options: ["A lot", "Quite a bit", "Some", "Very little", "None"] },
  { id: "performance", section: "general", q: "How do you feel about how you played?", options: ["Really disappointed", "Frustrated", "A little disappointed", "Unsure", "Pretty happy", "Really proud"] },

  { id: "bat_waiting", section: "batting", q: "How did you feel while waiting to bat?", options: ["Really worried", "Quite nervous", "A little nervous", "Unsure", "Comfortable", "Confident", "Excited"] },
  { id: "bat_out_worry", section: "batting", q: "How worried were you about getting out?", options: ["Every ball", "Most balls", "Sometimes", "Occasionally", "Not worried"] },
  { id: "bat_comfort", section: "batting", q: "How comfortable were you facing the bowler?", options: ["Very uncomfortable", "Quite uncomfortable", "A little uncomfortable", "Depended on the bowler", "Comfortable", "Really confident"] },
  { id: "bat_freely", section: "batting", q: "How freely did you play your shots?", options: ["Mostly trying not to get out", "Held back quite a lot", "Held back sometimes", "Mixed", "Mostly backed myself", "Played freely"] },
  { id: "bat_commit", section: "batting", q: "How well did you commit to your shots?", options: ["Hesitated a lot", "Hesitated sometimes", "Mixed", "Mostly committed", "Fully committed"] },
  { id: "bat_ball", section: "batting", q: "How did you feel about the ball coming towards you?", options: ["Scared of being hit", "Quite uncomfortable", "A little uncomfortable", "Depended on the delivery", "Comfortable", "Confident"] },
  { id: "bat_reset", section: "batting", q: "After a shot you didn't like, what happened?", options: ["Kept worrying about it", "Lost confidence for a while", "Took a few balls to reset", "Sometimes moved on", "Reset pretty quickly", "Focused on the next ball"] },

  { id: "bowl_before", section: "bowling", q: "How did you feel before bowling?", options: ["Really worried", "Quite nervous", "A little nervous", "Unsure", "Comfortable", "Confident", "Excited"] },
  { id: "bowl_bad_worry", section: "bowling", q: "How worried were you about bowling a bad ball?", options: ["Every delivery", "Most deliveries", "Sometimes", "Occasionally", "Not worried"] },
  { id: "bowl_hit_worry", section: "bowling", q: "How worried were you about being hit for runs?", options: ["Very worried", "Quite worried", "Sometimes", "A little worried", "Not worried"] },
  { id: "bowl_freely", section: "bowling", q: "How freely did you bowl?", options: ["Very cautiously", "Held back quite a lot", "Held back sometimes", "Mixed", "Mostly backed myself", "Bowled freely"] },
  { id: "bowl_reset", section: "bowling", q: "After a ball you didn't like, what happened?", options: ["Kept worrying about it", "Lost confidence for a while", "Took time to reset", "Sometimes moved on", "Reset pretty quickly", "Focused on the next delivery"] },
  { id: "bowl_action", section: "bowling", q: "How did your bowling action feel?", options: ["Very uncomfortable", "Quite uncomfortable", "A little uncomfortable", "Mixed", "Natural", "Really good"] },

  { id: "field_ball", section: "fielding", q: "How did you feel when the ball came to you?", options: ["Really nervous", "Quite nervous", "A little nervous", "Unsure", "Ready", "Confident", "Excited"] },
  { id: "field_drop_worry", section: "fielding", q: "How worried were you about dropping a catch?", options: ["Very worried", "Quite worried", "Sometimes", "A little worried", "Not worried"] },
  { id: "field_move", section: "fielding", q: "How confidently did you move to the ball?", options: ["Very cautiously", "Held back quite a lot", "Held back sometimes", "Mixed", "Mostly confidently", "Fully committed"] },
  { id: "field_reset", section: "fielding", q: "After a fielding mistake, what happened?", options: ["Kept worrying about it", "Lost confidence for a while", "Felt disappointed", "Mixed", "Moved on quickly", "Ready for the next opportunity"] },
];

export const Q_BY_ID = Object.fromEntries(REFLECTION_QS.map((q) => [q.id, q]));

export const WORRIES: { key: string; label: string }[] = [
  { key: "getting_out", label: "Getting out" },
  { key: "getting_hit", label: "Getting hit by the ball" },
  { key: "not_enough_runs", label: "Not scoring enough runs" },
  { key: "bad_ball", label: "Bowling a bad ball" },
  { key: "hit_for_runs", label: "Being hit for runs" },
  { key: "dropping", label: "Dropping a catch" },
  { key: "mistake", label: "Making a mistake" },
  { key: "teammates", label: "Letting teammates down" },
  { key: "coach", label: "Disappointing my coach" },
  { key: "parents", label: "Disappointing my parents" },
  { key: "others_think", label: "What other people might think" },
  { key: "other", label: "Something else" },
  { key: "nothing", label: "Nothing really" },
];

export const WINS: { key: string; label: string; needs?: "batting" | "bowling" }[] = [
  { key: "shot_nervous", label: "I played a shot even though I was nervous", needs: "batting" },
  { key: "backed_myself", label: "I backed myself" },
  { key: "committed_shot", label: "I committed to a shot", needs: "batting" },
  { key: "recovered", label: "I bounced back after a mistake" },
  { key: "bowled_confident", label: "I bowled with confidence", needs: "bowling" },
  { key: "kept_trying_bowl", label: "I kept trying after a bad ball", needs: "bowling" },
  { key: "went_for_catch", label: "I went for a catch" },
  { key: "tried_new", label: "I tried something new" },
  { key: "supported", label: "I supported my teammates" },
  { key: "kept_trying", label: "I kept trying when it was hard" },
  { key: "enjoyed", label: "I enjoyed playing cricket" },
];

/**
 * Pick a manageable set (6–10) of questions for this match, rotating
 * through the bank so it doesn't feel repetitive.
 */
export function pickReflectionQs(opts: { batted: boolean; bowled: boolean; matchNumber: number }): string[] {
  const n = opts.matchNumber;
  const rot = <T,>(arr: T[], k: number) => arr.map((_, i) => arr[(i + n * k) % arr.length]);
  const ids: string[] = ["enjoy", n % 2 ? "during" : "before"];
  if (n % 3 === 2) ids.push("pressure");
  if (opts.batted) ids.push(...rot(REFLECTION_QS.filter((q) => q.section === "batting").map((q) => q.id), 2).slice(0, 2));
  if (opts.bowled) ids.push(...rot(REFLECTION_QS.filter((q) => q.section === "bowling").map((q) => q.id), 2).slice(0, 2));
  ids.push(rot(REFLECTION_QS.filter((q) => q.section === "fielding").map((q) => q.id), 1)[0]);
  ids.push("performance");
  return ids;
}

/** Ask about specific worries only every few matches (or never if not wanted). */
export const askWorries = (matchNumber: number) => matchNumber % 3 === 0;

/** 0..1 score of how comfortable an answer is (for parent trends only). */
export function comfortScore(questionId: string, answer: string): number | null {
  const q = Q_BY_ID[questionId];
  if (!q) return null;
  const i = q.options.indexOf(answer);
  if (i < 0) return null;
  // "Unsure"/"Mixed"/"Depended" middle options are fine as midpoints.
  return i / (q.options.length - 1);
}
