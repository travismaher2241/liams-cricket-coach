"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as repo from "@/db/repo";
import { getSession } from "@/lib/auth";
import { DRILL_BY_ID } from "@/content/drills";
import { refreshAchievements } from "@/lib/data";
import { createHash } from "node:crypto";
import { CHECKIN_AREAS, CHECKIN_PROUD, isDistress } from "@/content/mind";

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

export async function savePushSub(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const s = await getSession();
  if (!s) redirect("/");
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  const id = createHash("sha256").update(sub.endpoint).digest("hex").slice(0, 40);
  await repo.setPushSub(s.pid, id, {
    playerId: s.pid,
    endpoint: sub.endpoint.slice(0, 1000),
    keys: { p256dh: sub.keys.p256dh.slice(0, 200), auth: sub.keys.auth.slice(0, 100) },
    role: s.role === "parent" ? "parent" : "player",
    createdAt: new Date(),
  });
  return { ok: true };
}

export async function removePushSub(endpoint: string) {
  const pid = await playerId();
  await repo.deletePushSub(pid, createHash("sha256").update(String(endpoint)).digest("hex").slice(0, 40));
}

export async function sendTestPush() {
  const pid = await playerId();
  const { pushToPlayer } = await import("@/lib/mind");
  return pushToPlayer(pid, { title: "A message from your coach", body: "Coach messages are on. You'll get one before training and games.", url: "/play/mind", tag: "test" });
}

export async function addThought(fd: FormData) {
  const pid = await playerId();
  const text = String(fd.get("text") ?? "").trim().slice(0, 1000);
  if (!text) return;
  await repo.addThought(pid, { playerId: pid, text, flagged: isDistress(text), createdAt: new Date() });
  revalidatePath("/play/mind/thoughts");
  redirect("/play/mind/thoughts?saved=1");
}

export async function deleteMyThought(id: string) {
  const pid = await playerId();
  await repo.deleteThought(pid, String(id));
  revalidatePath("/play/mind/thoughts");
}

export async function saveCheckin(input: { slotId: string; feeling: number | null; worked: string[]; proud: string[]; note: string }) {
  const pid = await playerId();
  const p = await repo.getPlayer(pid);
  if (!p) return;
  const { scheduleFor } = await import("@/lib/mind");
  const slot = scheduleFor(p).find((s) => s.id === input.slotId);
  const dateKey = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  const id = slot ? `${dateKey}-${slot.id}` : `${dateKey}-extra-${Date.now().toString(36)}`;
  const pick = (xs: unknown, ok: string[]) => (Array.isArray(xs) ? xs.map(String).filter((x) => ok.includes(x)) : []);
  await repo.setSessionLog(pid, id, {
    playerId: pid,
    slotId: slot?.id ?? "extra",
    title: slot?.title ?? "Other practice",
    dateKey,
    feeling: [1, 2, 3, 4].includes(Number(input.feeling)) ? Number(input.feeling) : null,
    worked: pick(input.worked, CHECKIN_AREAS),
    proud: pick(input.proud, CHECKIN_PROUD),
    note: String(input.note ?? "").trim().slice(0, 1000) || null,
    createdAt: new Date(),
  });
  revalidatePath("/play");
}
