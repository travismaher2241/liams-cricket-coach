import "server-only";
import { db, schema } from "@/db";
import { and, asc, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import type { Player } from "@/db/schema";
import { DRILL_BY_ID } from "@/content/drills";
import type { RecommendContext } from "./recommend";
import { computeAchievements } from "./achievements";
import { conceptStates, type AnswerHistory } from "./quizEngine";

export async function recommendContext(player: Player): Promise<RecommendContext> {
  const since = new Date(Date.now() - 30 * 86400000);
  const recent = await db
    .select()
    .from(schema.activities)
    .where(and(eq(schema.activities.playerId, player.id), gte(schema.activities.completedAt, since)));
  const progs = await db
    .select()
    .from(schema.programmes)
    .where(and(eq(schema.programmes.playerId, player.id), eq(schema.programmes.status, "active")));
  const yesterday = new Date(Date.now() - 36 * 3600000).toISOString().slice(0, 10);
  const bowledRecently = await db
    .select({ id: schema.matches.id })
    .from(schema.matches)
    .where(and(eq(schema.matches.playerId, player.id), eq(schema.matches.bowled, true), gte(schema.matches.matchDate, yesterday)));
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
    recentMatchBowling: bowledRecently.length > 0,
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

export async function personalBests(playerId: number): Promise<PB[]> {
  const rows = await db
    .select()
    .from(schema.activities)
    .where(and(eq(schema.activities.playerId, playerId), sql`${schema.activities.result} is not null`))
    .orderBy(asc(schema.activities.completedAt));
  const by = new Map<string, typeof rows>();
  for (const r of rows) by.set(r.drillId, [...(by.get(r.drillId) ?? []), r]);
  const out: PB[] = [];
  for (const [drillId, list] of by) {
    const d = DRILL_BY_ID[drillId];
    if (!d?.measure) continue;
    const better = (a: number, b: number) => (d.measure!.higherIsBetter ? a > b : a < b);
    let best = list[0];
    for (const r of list) if (better(r.result!, best.result!)) best = r;
    out.push({
      drillId,
      label: d.name,
      unit: d.measure.unit,
      best: best.result!,
      first: list[0].result!,
      attempts: list.length,
      setAt: best.completedAt,
    });
  }
  return out.sort((a, b) => b.setAt.getTime() - a.setAt.getTime());
}

export async function upcomingEvents(playerId: number, limit = 3) {
  return db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.playerId, playerId), gte(schema.events.startsAt, new Date(Date.now() - 3 * 3600000))))
    .orderBy(asc(schema.events.startsAt))
    .limit(limit);
}

export async function answerHistory(playerId: number): Promise<AnswerHistory[]> {
  const rows = await db
    .select({
      conceptId: schema.quizAnswers.conceptId,
      questionId: schema.quizAnswers.questionId,
      correct: schema.quizAnswers.correct,
      kind: schema.quizAttempts.kind,
      attemptId: schema.quizAttempts.id,
      at: schema.quizAttempts.completedAt,
    })
    .from(schema.quizAnswers)
    .innerJoin(schema.quizAttempts, eq(schema.quizAnswers.attemptId, schema.quizAttempts.id))
    .where(eq(schema.quizAttempts.playerId, playerId));
  return rows;
}

/** Recompute achievements and insert any new ones. Returns newly earned. */
export async function refreshAchievements(playerId: number) {
  const [player] = await db.select().from(schema.players).where(eq(schema.players.id, playerId));
  const matches = await db.select().from(schema.matches).where(eq(schema.matches.playerId, playerId)).orderBy(asc(schema.matches.matchDate));
  const [{ n, mins }] = await db
    .select({ n: sql<number>`count(*)::int`, mins: sql<number>`coalesce(sum(${schema.activities.minutes}),0)::int` })
    .from(schema.activities)
    .where(eq(schema.activities.playerId, playerId));
  const pbs = await personalBests(playerId);
  const [{ q }] = await db
    .select({ q: sql<number>`count(*)::int` })
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.playerId, playerId), eq(schema.quizAttempts.kind, "weekly")));
  const progs = await db
    .select()
    .from(schema.programmes)
    .where(and(eq(schema.programmes.playerId, playerId), eq(schema.programmes.status, "completed")));
  const refl = await db.select({ wins: schema.reflections.wins }).from(schema.reflections).where(eq(schema.reflections.playerId, playerId));
  const hist = await answerHistory(playerId);
  const states = conceptStates(hist);
  const masteredAfterStruggle = [...states.values()].filter((s) => s.mastered && s.correct < s.attempts).length;

  const earned = computeAchievements({
    matches,
    activityCount: n,
    practiceMinutes: mins,
    personalBests: pbs.filter((p) => p.attempts > 1 && p.best !== p.first).length,
    quizLevel: player.quizLevel,
    quizzesCompleted: q,
    completedProgrammes: progs.map((p) => ({ id: p.id, title: p.title })),
    reflectionWins: refl.flatMap((r) => r.wins ?? []),
    masteredAfterStruggle,
  });
  if (!earned.length) return [];
  const inserted = await db
    .insert(schema.achievements)
    .values(earned.map((e) => ({ ...e, playerId })))
    .onConflictDoNothing()
    .returning();
  return inserted;
}

export async function recentAchievements(playerId: number, limit = 3) {
  return db
    .select()
    .from(schema.achievements)
    .where(eq(schema.achievements.playerId, playerId))
    .orderBy(desc(schema.achievements.earnedAt))
    .limit(limit);
}

/** Completed programmes Liam hasn't seen the reveal for yet. */
export async function pendingReveals(playerId: number) {
  return db
    .select()
    .from(schema.programmes)
    .where(and(eq(schema.programmes.playerId, playerId), eq(schema.programmes.status, "completed"), isNull(schema.programmes.revealedAt)));
}

export async function programmeProgress(programmeIds: number[]) {
  if (!programmeIds.length) return new Map<number, { sessions: number; minutes: number }>();
  const rows = await db
    .select({
      pid: schema.activities.programmeId,
      sessions: sql<number>`count(*)::int`,
      minutes: sql<number>`coalesce(sum(${schema.activities.minutes}),0)::int`,
    })
    .from(schema.activities)
    .where(inArray(schema.activities.programmeId, programmeIds))
    .groupBy(schema.activities.programmeId);
  return new Map(rows.map((r) => [r.pid!, { sessions: r.sessions, minutes: r.minutes }]));
}

export function startOfWeek(d = new Date()) {
  // Monday 00:00 Melbourne (approximate via local offset of +10/+11)
  const melb = new Date(d.toLocaleString("en-US", { timeZone: "Australia/Melbourne" }));
  const diff = (melb.getDay() + 6) % 7;
  const offsetMs = melb.getTime() - d.getTime();
  const mondayMelb = new Date(melb);
  mondayMelb.setDate(melb.getDate() - diff);
  mondayMelb.setHours(0, 0, 0, 0);
  return new Date(mondayMelb.getTime() - offsetMs);
}

export async function weekSummary(playerId: number, from = startOfWeek()) {
  const acts = await db
    .select()
    .from(schema.activities)
    .where(and(eq(schema.activities.playerId, playerId), gte(schema.activities.completedAt, from)));
  const ach = await db
    .select()
    .from(schema.achievements)
    .where(and(eq(schema.achievements.playerId, playerId), gte(schema.achievements.earnedAt, from)));
  const quiz = await db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.playerId, playerId), gte(schema.quizAttempts.completedAt, from)));
  const matches = await db
    .select()
    .from(schema.matches)
    .where(and(eq(schema.matches.playerId, playerId), gte(schema.matches.matchDate, from.toISOString().slice(0, 10))));
  const loved = acts.filter((a) => a.enjoyment === 3).map((a) => DRILL_BY_ID[a.drillId]?.name).filter(Boolean);
  return {
    sessions: acts.length,
    minutes: acts.reduce((a, b) => a + b.minutes, 0),
    areas: [...new Set(acts.map((a) => DRILL_BY_ID[a.drillId]?.area).filter(Boolean))],
    achievements: ach,
    quizzes: quiz,
    matches,
    loved: [...new Set(loved)] as string[],
    discomfort: acts.filter((a) => a.discomfort).map((a) => DRILL_BY_ID[a.drillId]?.name ?? a.drillId),
  };
}
