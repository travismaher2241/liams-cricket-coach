"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { DRILL_BY_ID } from "@/content/drills";
import { refreshAchievements } from "@/lib/data";

async function playerId() {
  const s = await getSession();
  if (!s) redirect("/");
  return s.pid;
}

export async function savePlayerOnboarding(answers: Record<string, string>) {
  const pid = await playerId();
  await db.update(schema.players).set({ playerAnswers: answers, playerOnboarded: true }).where(eq(schema.players.id, pid));
  redirect("/play");
}

export interface ActivityFeedback {
  drillId: string;
  minutes?: number;
  difficulty?: number;
  enjoyment?: number;
  confidence?: number;
  again?: boolean;
  discomfort?: boolean;
  result?: number | null;
  isChallenge?: boolean;
}

export interface ActivityOutcome {
  newPB: boolean;
  previousBest: number | null;
  achievements: { title: string; detail: string }[];
}

export async function logActivity(f: ActivityFeedback): Promise<ActivityOutcome> {
  const pid = await playerId();
  const drill = DRILL_BY_ID[f.drillId];
  if (!drill) throw new Error("Unknown drill");

  // Link to the active programme whose focus overlaps most with this drill.
  const progs = await db
    .select()
    .from(schema.programmes)
    .where(and(eq(schema.programmes.playerId, pid), eq(schema.programmes.status, "active")));
  let programmeId: number | null = null;
  let bestOverlap = 0;
  for (const p of progs) {
    const o = drill.tags.filter((t) => p.focusTags.includes(t)).length;
    if (o > bestOverlap) {
      bestOverlap = o;
      programmeId = p.id;
    }
  }

  // Personal best check (before insert)
  let previousBest: number | null = null;
  let newPB = false;
  const result = typeof f.result === "number" && Number.isFinite(f.result) ? f.result : null;
  if (result !== null && drill.measure) {
    const agg = drill.measure.higherIsBetter ? sql<number | null>`max(${schema.activities.result})` : sql<number | null>`min(${schema.activities.result})`;
    const [row] = await db
      .select({ v: agg })
      .from(schema.activities)
      .where(and(eq(schema.activities.playerId, pid), eq(schema.activities.drillId, drill.id)));
    previousBest = row?.v ?? null;
    newPB = previousBest === null || (drill.measure.higherIsBetter ? result > previousBest : result < previousBest);
  }

  await db.insert(schema.activities).values({
    playerId: pid,
    drillId: drill.id,
    programmeId,
    minutes: Math.max(1, Math.min(120, f.minutes ?? drill.minutes)),
    difficulty: f.difficulty ?? null,
    enjoyment: f.enjoyment ?? null,
    confidence: f.confidence ?? null,
    again: f.again ?? null,
    discomfort: !!f.discomfort,
    result,
    isChallenge: !!f.isChallenge,
  });

  // Programme completion (flexible: based on sessions done, not dates)
  if (programmeId) {
    const p = progs.find((x) => x.id === programmeId)!;
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.activities)
      .where(eq(schema.activities.programmeId, programmeId));
    if (n >= p.targetSessions) {
      await db.update(schema.programmes).set({ status: "completed", completedAt: new Date() }).where(eq(schema.programmes.id, programmeId));
    }
  }

  const fresh = await refreshAchievements(pid);
  revalidatePath("/play");
  return {
    newPB: newPB && previousBest !== null,
    previousBest,
    achievements: fresh.map((a) => ({ title: a.title, detail: a.detail })),
  };
}

export async function markRevealSeen(programmeId: number) {
  const pid = await playerId();
  await db
    .update(schema.programmes)
    .set({ revealedAt: new Date() })
    .where(and(eq(schema.programmes.id, programmeId), eq(schema.programmes.playerId, pid)));
  redirect("/play/journey");
}

export async function markAchievementsSeen() {
  const pid = await playerId();
  await db.update(schema.achievements).set({ seen: true }).where(eq(schema.achievements.playerId, pid));
}
