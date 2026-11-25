"use server";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { TEMPLATE_BY_KEY } from "@/content/programmes";
import { oversToBalls } from "@/lib/stats";
import { cleanMatch } from "@/lib/matchClean";
import { refreshAchievements } from "@/lib/data";

async function parent() {
  const s = await getSession();
  if (!s || s.role !== "parent") redirect("/login/parent");
  return s;
}

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};

export async function saveProfile(fd: FormData) {
  const s = await parent();
  const priorities: Record<string, number> = {};
  for (const a of ["batting", "bowling", "fielding", "athletic", "mental"]) {
    const v = Number(fd.get(`prio_${a}`) ?? 0);
    if (v > 0) priorities[a] = Math.min(3, v);
  }
  const by = Number(fd.get("birthYear"));
  await db
    .update(schema.players)
    .set({
      displayName: str(fd, "displayName") ?? undefined,
      birthYear: by > 1990 && by < 2030 ? by : null,
      battingHand: str(fd, "battingHand"),
      bowlingStyle: str(fd, "bowlingStyle"),
      team: str(fd, "team"),
      competition: str(fd, "competition"),
      season: str(fd, "season"),
      seasonPhase: (str(fd, "seasonPhase") as "pre" | "in" | "off") ?? "in",
      parentOverview: str(fd, "parentOverview"),
      safetyNotes: str(fd, "safetyNotes"),
      equipment: fd.getAll("equipment").map(String),
      spaces: fd.getAll("spaces").map(String),
      priorities,
    })
    .where(eq(schema.players.id, s.pid));
  revalidatePath("/parent");
  redirect("/parent/profile?saved=1");
}

export async function changePin(fd: FormData) {
  const s = await parent();
  const pin = String(fd.get("pin") ?? "");
  if (!/^\d{4}$/.test(pin)) redirect("/parent/profile?pin=bad");
  const [p] = await db.select().from(schema.players).where(eq(schema.players.id, s.pid));
  await db.update(schema.users).set({ pinHash: await bcrypt.hash(pin, 10) }).where(eq(schema.users.id, p.userId));
  redirect("/parent/profile?pin=ok");
}

export async function addObservation(fd: FormData) {
  const s = await parent();
  const body = str(fd, "body");
  if (!body) return;
  const kind = (str(fd, "kind") ?? "observation") as "observation" | "coach_feedback" | "history" | "circumstance";
  const area = str(fd, "area");
  await db.insert(schema.observations).values({ playerId: s.pid, kind, area, body });
  // Observations tagged with an area gently nudge that area's weighting (never shown to Liam).
  if (area && fd.get("boost") === "on") {
    const [p] = await db.select().from(schema.players).where(eq(schema.players.id, s.pid));
    const pr = { ...p.priorities, [area]: Math.min(3, (p.priorities[area] ?? 0) + 1) };
    await db.update(schema.players).set({ priorities: pr }).where(eq(schema.players.id, s.pid));
  }
  revalidatePath("/parent/notes");
}

export async function deleteObservation(id: number) {
  const s = await parent();
  await db.delete(schema.observations).where(and(eq(schema.observations.id, id), eq(schema.observations.playerId, s.pid)));
  revalidatePath("/parent/notes");
}

export async function startProgramme(fd: FormData) {
  const s = await parent();
  const t = TEMPLATE_BY_KEY[String(fd.get("template"))];
  if (!t) return;
  const target = Number(fd.get("targetSessions")) || t.targetSessions;
  await db.insert(schema.programmes).values({
    playerId: s.pid,
    templateKey: t.key,
    title: t.title,
    purpose: t.purpose,
    focusTags: t.focusTags,
    targetSessions: Math.max(3, Math.min(60, target)),
    plannedWeeks: t.weeks,
    parentNotes: str(fd, "parentNotes"),
  });
  revalidatePath("/parent/programmes");
}

export async function setProgrammeStatus(id: number, status: "active" | "paused" | "completed") {
  const s = await parent();
  await db
    .update(schema.programmes)
    .set({ status, completedAt: status === "completed" ? new Date() : null })
    .where(and(eq(schema.programmes.id, id), eq(schema.programmes.playerId, s.pid)));
  if (status === "completed") await refreshAchievements(s.pid);
  revalidatePath("/parent/programmes");
}

export async function deleteProgramme(id: number) {
  const s = await parent();
  await db.update(schema.activities).set({ programmeId: null }).where(eq(schema.activities.programmeId, id));
  await db.delete(schema.programmes).where(and(eq(schema.programmes.id, id), eq(schema.programmes.playerId, s.pid)));
  revalidatePath("/parent/programmes");
}

function matchFromForm(fd: FormData) {
  const num = (k: string) => {
    const v = String(fd.get(k) ?? "").trim();
    return v === "" ? null : Number(v);
  };
  const overs = String(fd.get("overs") ?? "").trim();
  return cleanMatch({
    matchDate: String(fd.get("matchDate") ?? ""),
    team: String(fd.get("team") ?? ""),
    opposition: String(fd.get("opposition") ?? ""),
    competition: String(fd.get("competition") ?? ""),
    season: String(fd.get("season") ?? ""),
    format: String(fd.get("format") ?? ""),
    result: String(fd.get("result") ?? ""),
    batted: fd.get("batted") === "on",
    runs: num("runs"),
    balls: num("balls"),
    fours: num("fours"),
    sixes: num("sixes"),
    battingStatus: (str(fd, "battingStatus") as "out" | "not_out" | "retired" | null) ?? null,
    howOut: str(fd, "howOut"),
    bowled: fd.get("bowled") === "on",
    ballsBowled: overs ? oversToBalls(overs) : null,
    runsConceded: num("runsConceded"),
    wickets: num("wickets"),
    maidens: num("maidens"),
    wides: num("wides"),
    noBalls: num("noBalls"),
    catches: num("catches"),
    runOuts: num("runOuts"),
    stumpings: num("stumpings"),
  });
}

export async function saveMatchParent(fd: FormData) {
  const s = await parent();
  const id = Number(fd.get("id") || 0);
  const data = matchFromForm(fd);
  if (id) {
    await db
      .update(schema.matches)
      .set({ ...data, editedByParent: true })
      .where(and(eq(schema.matches.id, id), eq(schema.matches.playerId, s.pid)));
  } else {
    await db.insert(schema.matches).values({ ...data, playerId: s.pid, isHistorical: fd.get("historical") === "on", editedByParent: true });
  }
  await refreshAchievements(s.pid);
  revalidatePath("/parent/matches");
  redirect("/parent/matches?saved=1");
}

export async function deleteMatch(id: number) {
  const s = await parent();
  await db.delete(schema.reflections).where(eq(schema.reflections.matchId, id));
  await db.delete(schema.matches).where(and(eq(schema.matches.id, id), eq(schema.matches.playerId, s.pid)));
  redirect("/parent/matches");
}

export async function addEvent(fd: FormData) {
  const s = await parent();
  const date = String(fd.get("date") ?? "");
  const time = String(fd.get("time") ?? "09:00") || "09:00";
  const title = str(fd, "title");
  if (!date || !title) return;
  // Interpret as Melbourne local time.
  const guess = new Date(`${date}T${time}:00Z`);
  const offsetH = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Australia/Melbourne", timeZoneName: "shortOffset" })
      .formatToParts(guess)
      .find((p) => p.type === "timeZoneName")
      ?.value.replace("GMT", "") || 10,
  );
  const startsAt = new Date(guess.getTime() - offsetH * 3600000);
  const repeat = Math.min(26, Math.max(1, Number(fd.get("repeatWeeks") || 1)));
  const type = (str(fd, "type") ?? "event") as "match" | "training" | "other_sport" | "rest" | "event";
  await db.insert(schema.events).values(
    Array.from({ length: repeat }, (_, i) => ({
      playerId: s.pid,
      type,
      title,
      startsAt: new Date(startsAt.getTime() + i * 7 * 86400000),
      location: str(fd, "location"),
      notes: str(fd, "notes"),
    })),
  );
  revalidatePath("/parent/schedule");
}

export async function deleteEvent(id: number) {
  const s = await parent();
  await db.delete(schema.events).where(and(eq(schema.events.id, id), eq(schema.events.playerId, s.pid)));
  revalidatePath("/parent/schedule");
}
