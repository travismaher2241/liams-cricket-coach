import type { Match } from "@/db/types";
import { battingStats, bowlingStats } from "./stats";

export interface EarnedAchievement {
  key: string;
  title: string;
  detail: string;
  category: "match" | "development" | "iq" | "confidence";
}

export interface AchievementInput {
  matches: Match[]; // chronological
  activityCount: number;
  practiceMinutes: number;
  personalBests: number;
  quizLevel: number;
  quizzesCompleted: number;
  completedProgrammes: { id: string; title: string }[];
  reflectionWins: string[]; // all win keys from all reflections
  masteredAfterStruggle: number;
}

export function computeAchievements(i: AchievementInput): EarnedAchievement[] {
  const out: EarnedAchievement[] = [];
  const add = (key: string, title: string, detail: string, category: EarnedAchievement["category"]) =>
    out.push({ key, title, detail, category });
  const played = i.matches.filter((m) => !m.isHistorical || true);
  const bat = battingStats(played);
  const bowl = bowlingStats(played);
  const inns = played.filter((m) => m.batted && m.runs !== null);
  const maxRuns = Math.max(0, ...inns.map((m) => m.runs ?? 0));
  const anyFour = played.some((m) => (m.fours ?? 0) > 0 || (m.sixes ?? 0) > 0);
  const maxWkts = Math.max(0, ...played.map((m) => m.wickets ?? 0));
  const catches = played.reduce((a, m) => a + (m.catches ?? 0), 0);

  // Match
  if (bat.runs >= 1) add("first-run", "First career run", "Off the mark!", "match");
  if (anyFour) add("first-boundary", "First boundary", "You found the rope.", "match");
  if (bowl.wickets >= 1) add("first-wicket", "First wicket", "Your first scalp.", "match");
  if (catches >= 1) add("first-catch", "First catch", "Safe hands.", "match");
  if (maxRuns >= 10) add("score-10", "Double figures", "A score of 10 or more.", "match");
  if (maxRuns >= 25) add("score-25", "25 up", "A score of 25 or more.", "match");
  if (maxRuns >= 50) add("score-50", "Half-century", "50 runs in an innings!", "match");
  if (maxRuns >= 100) add("score-100", "Century", "100 runs in an innings!", "match");
  if (maxWkts >= 3) add("three-for", "Three-wicket haul", "3 wickets in a match.", "match");
  for (const n of [50, 100, 250, 500, 1000]) if (bat.runs >= n) add(`career-runs-${n}`, `${n} career runs`, `You've scored ${n} runs in your career.`, "match");
  for (const n of [5, 10, 25, 50]) if (bowl.wickets >= n) add(`career-wkts-${n}`, `${n} career wickets`, `${n} wickets and counting.`, "match");
  for (const n of [5, 10, 25, 50, 100]) if (played.length >= n) add(`matches-${n}`, `${n} matches`, `You've played ${n} matches.`, "match");

  // Development
  if (i.activityCount >= 1) add("first-session", "First quick session", "Every little bit counts.", "development");
  for (const n of [10, 25, 50, 100, 200]) if (i.activityCount >= n) add(`sessions-${n}`, `${n} quick sessions`, `${n} sessions done. That adds up!`, "development");
  for (const n of [60, 300, 600, 1200]) if (i.practiceMinutes >= n) add(`minutes-${n}`, `${n >= 60 ? n / 60 + " hours" : n + " minutes"} of extra practice`, "Time you chose to put into your cricket.", "development");
  if (i.personalBests >= 1) add("first-pb", "First personal best", "You set a new record for yourself.", "development");
  for (const p of i.completedProgrammes) add(`programme-${p.id}`, `Completed: ${p.title}`, "A whole block of development, finished.", "development");

  // Cricket IQ
  if (i.quizzesCompleted >= 1) add("first-quiz", "First Cricket IQ quiz", "Thinking cricketer in the making.", "iq");
  for (let l = 2; l <= i.quizLevel; l++) add(`iq-level-${l}`, `Cricket IQ level ${l}`, "You unlocked a new level.", "iq");
  if (i.masteredAfterStruggle >= 1) add("iq-mastered", "Cracked it", "You mastered a concept that was tricky before.", "iq");

  // Confidence
  const wins = new Set(i.reflectionWins);
  if (wins.has("shot_nervous")) add("brave-shot", "Played through nerves", "Played a shot even though you were nervous.", "confidence");
  if (wins.has("backed_myself")) add("backed-myself", "Backed yourself", "You trusted your ability in a match.", "confidence");
  if (wins.has("recovered")) add("bounce-back", "Bounce back", "You recovered after a mistake.", "confidence");
  if (wins.has("tried_new")) add("tried-new", "Tried something new", "You gave a new skill a go in a match.", "confidence");
  if (wins.has("supported")) add("team-player", "Great teammate", "You supported your teammates.", "confidence");
  if (wins.has("kept_trying")) add("kept-trying", "Kept going", "You kept trying when it was hard.", "confidence");
  if (wins.has("went_for_catch")) add("went-for-it", "Went for it", "You went for a catch.", "confidence");
  return out;
}
