import "server-only";
import * as repo from "@/db/repo";
import type { Player } from "@/db/types";
import { DRILL_BY_ID } from "@/content/drills";
import type { RecommendContext } from "./recommend";
import { computeAchievements } from "./achievements";
import { conceptStates, type AnswerHistory } from "./quizEngine";

export async function recommendContext(player: Player): Promise<RecommendContext> {
  const since = new Date(Date.now() - 30 * 86400000);
  const [recent, progs, matches] = await Promise.all([
    repo.listActivities(player.id, { since }),
    repo.listProgrammes(player.id, "active"),
    repo.listMatches(player.id),
  ]);
  const cutoff = new Date(Date.now() - 36 * 3600000).toISOString().slice(0, 10);
  return {
    equipment: player.equipment,
    spaces: player.spaces,
    priorities: player.priorities,
    programmeTags: progs.flatMap((p) => p.focusTags),
    recent: recent.map((r) => ({
      drillId: r.drillId,
      enjoyment: r.enjoyment,
      again: r.again,
      discomfort: r.discomfort,
      completedAt: r.completedAt,
    })),
    recentMatchBowling: matches.some((m) => m.bowled && m.matchDate >= cutoff),
    now: new Date(),
  };
}

export interface PB {
  drillId: string;
  label: string;
  unit: string;
  best: number;
  first: number;
  attempts: number;
  setAt: Date;
}

export async function personalBests(playerId: string): Promise<PB[]> {
  const rows = (await repo.listActivities(playerId))
    .filter((a) => a.result !== null && a.result !== undefined)
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  const by = new Map<string, typeof rows>();
  for (const r of rows) by.set(r.drillId, [...(by.get(r.drillId) ?? []), r]);
  const out: PB[] = [];
  for (const [drillId, list] of by) {
    const d = DRILL_BY_ID[drillId];
    if (!d?.measure) continue;
    const better = (a: number, b: number) => (d.measure!.higherIsBetter ? a > b : a < b);
    let best = list[0];
    for (const r of list) if (better(r.result!, best.result!)) best = r;
    out.push({ drillId, label: d.name, unit: d.measure.unit, best: best.result!, first: list[0].result!, attempts: list.length, setAt: best.completedAt });
  }
  return out.sort((a, b) => b.setAt.getTime() - a.setAt.getTime());
}

export async function upcomingEvents(playerId: string, limit = 3) {
  return (await repo.listEvents(playerId, new Date(Date.now() - 3 * 3600000))).slice(0, limit);
}

export async function answerHistory(playerId: string): Promise<AnswerHistory[]> {
  const attempts = await repo.listQuizAttempts(playerId);
  return attempts.flatMap((a) =>
    (a.answers ?? []).map((x) => ({
      conceptId: x.conceptId,
      questionId: x.questionId,
      correct: x.correct,
      kind: a.kind,
      attemptId: a.id,
      at: a.completedAt,
    })),
  );
}

/** Recompute achievements and insert any new ones. Returns newly earned. */
export async function refreshAchievements(playerId: string) {
  const [player, matches, acts, pbs, weekly, done, refl, hist] = await Promise.all([
    repo.getPlayer(playerId),
    repo.listMatches(playerId),
    repo.listActivities(playerId),
    personalBests(playerId),
    repo.listQuizAttempts(playerId, { kind: "weekly" }),
    repo.listProgrammes(playerId, "completed"),
    repo.listReflections(playerId),
    answerHistory(playerId),
  ]);
  if (!player) return [];
  const states = conceptStates(hist);
  const earned = computeAchievements({
    matches: [...matches].reverse(),
    activityCount: acts.length,
    practiceMinutes: acts.reduce((a, b) => a + b.minutes, 0),
    personalBests: pbs.filter((p) => p.attempts > 1 && p.best !== p.first).length,
    quizLevel: player.quizLevel,
    quizzesCompleted: weekly.length,
    completedProgrammes: done.map((p) => ({ id: p.id, title: p.title })),
    reflectionWins: refl.flatMap((r) => r.wins ?? []),
    masteredAfterStruggle: [...states.values()].filter((s) => s.mastered && s.correct < s.attempts).length,
  });
  return repo.insertNewAchievements(playerId, earned);
}

export async function recentAchievements(playerId: string, limit = 3) {
  return (await repo.listAchievements(playerId)).slice(0, limit);
}

/** Completed programmes Liam hasn't seen the reveal for yet. */
export async function pendingReveals(playerId: string) {
  return (await repo.listProgrammes(playerId, "completed")).filter((p) => !p.revealedAt);
}

export async function programmeProgress(playerId: string) {
  const acts = await repo.listActivities(playerId);
  const m = new Map<string, { sessions: number; minutes: number }>();
  for (const a of acts) {
    if (!a.programmeId) continue;
    const e = m.get(a.programmeId) ?? { sessions: 0, minutes: 0 };
    e.sessions++;
    e.minutes += a.minutes;
    m.set(a.programmeId, e);
  }
  return m;
}

export function startOfWeek(d = new Date()) {
  const melb = new Date(d.toLocaleString("en-US", { timeZone: "Australia/Melbourne" }));
  const diff = (melb.getDay() + 6) % 7;
  const offsetMs = melb.getTime() - d.getTime();
  const mondayMelb = new Date(melb);
  mondayMelb.setDate(melb.getDate() - diff);
  mondayMelb.setHours(0, 0, 0, 0);
  return new Date(mondayMelb.getTime() - offsetMs);
}

export async function weekSummary(playerId: string, from = startOfWeek()) {
  const [acts, ach, quiz, matches] = await Promise.all([
    repo.listActivities(playerId, { since: from }),
    repo.listAchievements(playerId),
    repo.listQuizAttempts(playerId),
    repo.listMatches(playerId),
  ]);
  const fromDay = from.toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  const loved = acts.filter((a) => a.enjoyment === 3).map((a) => DRILL_BY_ID[a.drillId]?.name).filter(Boolean);
  return {
    sessions: acts.length,
    minutes: acts.reduce((a, b) => a + b.minutes, 0),
    areas: [...new Set(acts.map((a) => DRILL_BY_ID[a.drillId]?.area).filter(Boolean))],
    achievements: ach.filter((a) => a.earnedAt >= from),
    quizzes: quiz.filter((q) => q.completedAt >= from),
    matches: matches.filter((m) => m.matchDate >= fromDay),
    loved: [...new Set(loved)] as string[],
    discomfort: acts.filter((a) => a.discomfort).map((a) => DRILL_BY_ID[a.drillId]?.name ?? a.drillId),
  };
}
