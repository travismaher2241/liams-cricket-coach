"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as repo from "@/db/repo";
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
  const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 80)]));
  await repo.updatePlayer(pid, { playerAnswers: clean, playerOnboarded: true });
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

const rating = (n: unknown) => (n === 1 || n === 2 || n === 3 ? n : null);

export async function logActivity(f: ActivityFeedback): Promise<ActivityOutcome> {
  const pid = await playerId();
  const drill = DRILL_BY_ID[f.drillId];
  if (!drill) throw new Error("Unknown drill");

  // Link to the active programme whose focus overlaps most with this drill.
  const progs = await repo.listProgrammes(pid, "active");
  let programme: (typeof progs)[number] | null = null;
  let bestOverlap = 0;
  for (const p of progs) {
    const o = drill.tags.filter((t) => p.focusTags.includes(t)).length;
    if (o > bestOverlap) {
      bestOverlap = o;
      programme = p;
    }
  }

  // Personal best check (before saving)
  let previousBest: number | null = null;
  let newPB = false;
  const result = typeof f.result === "number" && Number.isFinite(f.result) ? f.result : null;
  if (result !== null && drill.measure) {
    const prev = (await repo.listActivities(pid, { drillId: drill.id })).map((a) => a.result).filter((r): r is number => typeof r === "number");
    if (prev.length) previousBest = drill.measure.higherIsBetter ? Math.max(...prev) : Math.min(...prev);
    newPB = previousBest === null || (drill.measure.higherIsBetter ? result > previousBest : result < previousBest);
  }

  await repo.addActivity(pid, {
    playerId: pid,
    drillId: drill.id,
    programmeId: programme?.id ?? null,
    minutes: Math.max(1, Math.min(120, f.minutes ?? drill.minutes)),
    difficulty: rating(f.difficulty),
    enjoyment: rating(f.enjoyment),
    confidence: rating(f.confidence),
    again: typeof f.again === "boolean" ? f.again : null,
    discomfort: !!f.discomfort,
    result,
    isChallenge: !!f.isChallenge,
    completedAt: new Date(),
  });

  // Programme completion is based on sessions done, not dates.
  if (programme) {
    const n = (await repo.listActivities(pid, { programmeId: programme.id })).length;
    if (n >= programme.targetSessions) await repo.updateProgramme(pid, programme.id, { status: "completed", completedAt: new Date() });
  }

  const fresh = await refreshAchievements(pid);
  revalidatePath("/play");
  return {
    newPB: newPB && previousBest !== null,
    previousBest,
    achievements: fresh.map((a) => ({ title: a.title, detail: a.detail })),
  };
}

export async function markRevealSeen(programmeId: string) {
  const pid = await playerId();
  const p = await repo.getProgramme(pid, programmeId);
  if (p) await repo.updateProgramme(pid, programmeId, { revealedAt: new Date() });
  redirect("/play/journey");
}

export async function setMindWord(word: string) {
  const pid = await playerId();
  await repo.updatePlayer(pid, { mindWord: String(word).trim().slice(0, 30) || null });
  revalidatePath("/play/mind");
}

export async function markLessonDone(lessonId: string) {
  const pid = await playerId();
  const p = await repo.getPlayer(pid);
  if (!p) return;
  const done = new Set(p.mindDone ?? []);
  done.add(String(lessonId).slice(0, 40));
  await repo.updatePlayer(pid, { mindDone: [...done] });
}
