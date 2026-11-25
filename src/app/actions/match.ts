"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as repo from "@/db/repo";
import { getSession } from "@/lib/auth";
import { refreshAchievements } from "@/lib/data";
import { cleanMatch, type MatchPayload } from "@/lib/matchClean";

const strList = (xs: unknown, max = 20) => (Array.isArray(xs) ? xs.map(String).slice(0, max) : []);

export async function saveMatchWithReflection(
  p: MatchPayload,
  reflection: { answers: Record<string, string>; worries: string[] | null; wins: string[] },
) {
  const s = await getSession();
  if (!s) redirect("/");
  const matchId = await repo.addMatch(s.pid, {
    ...cleanMatch(p),
    playerId: s.pid,
    isHistorical: false,
    editedByParent: false,
    createdAt: new Date(),
  });
  const answers = Object.fromEntries(Object.entries(reflection.answers ?? {}).slice(0, 20).map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 80)]));
  await repo.addReflection(s.pid, {
    matchId,
    playerId: s.pid,
    answers,
    worries: reflection.worries === null ? null : strList(reflection.worries),
    wins: strList(reflection.wins),
    createdAt: new Date(),
  });
  const fresh = await refreshAchievements(s.pid);
  revalidatePath("/play");
  return { matchId, achievements: fresh.map((a) => ({ title: a.title, detail: a.detail })) };
}

export async function saveMatchPrep(eventId: string | null, feeling: string, focus: string) {
  const s = await getSession();
  if (!s) redirect("/");
  await repo.addMatchPrep(s.pid, { playerId: s.pid, eventId, feeling: feeling.slice(0, 40), focus: focus.slice(0, 120), createdAt: new Date() });
}
