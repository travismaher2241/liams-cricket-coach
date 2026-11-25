"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { refreshAchievements } from "@/lib/data";
import { cleanMatch, type MatchPayload } from "@/lib/matchClean";

export async function saveMatchWithReflection(
  p: MatchPayload,
  reflection: { answers: Record<string, string>; worries: string[] | null; wins: string[] },
) {
  const s = await getSession();
  if (!s) redirect("/");
  const [m] = await db.insert(schema.matches).values({ ...cleanMatch(p), playerId: s.pid }).returning();
  await db.insert(schema.reflections).values({
    matchId: m.id,
    playerId: s.pid,
    answers: reflection.answers,
    worries: reflection.worries,
    wins: reflection.wins,
  });
  const fresh = await refreshAchievements(s.pid);
  revalidatePath("/play");
  return { matchId: m.id, achievements: fresh.map((a) => ({ title: a.title, detail: a.detail })) };
}

export async function saveMatchPrep(eventId: number | null, feeling: string, focus: string) {
  const s = await getSession();
  if (!s) redirect("/");
  await db.insert(schema.matchPreps).values({ playerId: s.pid, eventId, feeling, focus });
}
