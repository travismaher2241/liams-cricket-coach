"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as repo from "@/db/repo";
import { getSession } from "@/lib/auth";
import { TEMPLATE_BY_KEY } from "@/content/programmes";
import { oversToBalls } from "@/lib/stats";
import { cleanMatch } from "@/lib/matchClean";
import { refreshAchievements } from "@/lib/data";
import { cleanSchedule } from "@/content/mind";

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
  await repo.updatePlayer(s.pid, {
      ...(str(fd, "displayName") ? { displayName: str(fd, "displayName")! } : {}),
      birthYear: by > 1990 && by < 2030 ? by : null,
      battingHand: str(fd, "battingHand"),
      bowlingStyle: str(fd, "bowlingStyle"),
      team: str(fd, "team"),
      competition: str(fd, "competition"),
      season: str(fd, "season"),
      seasonPhase: (["pre", "in", "off"] as const).find((x) => x === str(fd, "seasonPhase")) ?? "in",
      parentOverview: str(fd, "parentOverview"),
      safetyNotes: str(fd, "safetyNotes"),
      equipment: fd.getAll("equipment").map(String),
      spaces: fd.getAll("spaces").map(String),
      priorities,
    });
  revalidatePath("/parent");
  redirect("/parent/profile?saved=1");
}

export async function changePin(fd: FormData) {
  const s = await parent();
  const pin = String(fd.get("pin") ?? "");
  if (!/^\d{4}$/.test(pin)) redirect("/parent/profile?pin=bad");
  const p = await repo.getPlayer(s.pid);
  if (p) await repo.updateUser(p.userId, { pinHash: await bcrypt.hash(pin, 10) });
  redirect("/parent/profile?pin=ok");
}

export async function addObservation(fd: FormData) {
  const s = await parent();
  const body = str(fd, "body");
  if (!body) return;
  const kind = (["observation", "coach_feedback", "history", "circumstance"] as const).find((k) => k === str(fd, "kind")) ?? "observation";
  const area = str(fd, "area");
  await repo.addObservation(s.pid, { playerId: s.pid, kind, area, body: body.slice(0, 5000), createdAt: new Date() });
  // Observations tagged with an area gently nudge that area's weighting (never shown to Liam).
  if (area && fd.get("boost") === "on") {
    const p = await repo.getPlayer(s.pid);
    if (p) await repo.updatePlayer(s.pid, { priorities: { ...p.priorities, [area]: Math.min(3, (p.priorities[area] ?? 0) + 1) } });
  }
  revalidatePath("/parent/notes");
}

export async function deleteObservation(id: string) {
  const s = await parent();
  await repo.deleteObservation(s.pid, id);
  revalidatePath("/parent/notes");
}

export async function startProgramme(fd: FormData) {
  const s = await parent();
  const t = TEMPLATE_BY_KEY[String(fd.get("template"))];
  if (!t) return;
  const target = Number(fd.get("targetSessions")) || t.targetSessions;
  await repo.addProgramme(s.pid, {
    playerId: s.pid,
    status: "active",
    startedAt: new Date(),
    completedAt: null,
    revealedAt: null,
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

export async function setProgrammeStatus(id: string, status: "active" | "paused" | "completed") {
  const s = await parent();
  await repo.updateProgramme(s.pid, id, { status, completedAt: status === "completed" ? new Date() : null });
  if (status === "completed") await refreshAchievements(s.pid);
  revalidatePath("/parent/programmes");
}

export async function deleteProgramme(id: string) {
  const s = await parent();
  await repo.deleteProgramme(s.pid, id);
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
  const id = String(fd.get("id") || "");
  const data = matchFromForm(fd);
  if (id) {
    if (await repo.getMatch(s.pid, id)) await repo.updateMatch(s.pid, id, { ...data, editedByParent: true });
  } else {
    await repo.addMatch(s.pid, { ...data, playerId: s.pid, isHistorical: fd.get("historical") === "on", editedByParent: true, createdAt: new Date() });
  }
  await refreshAchievements(s.pid);
  revalidatePath("/parent/matches");
  redirect("/parent/matches?saved=1");
}

export async function deleteMatch(id: string) {
  const s = await parent();
  await repo.deleteMatch(s.pid, id);
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
  const type = (["match", "training", "other_sport", "rest", "event"] as const).find((t) => t === str(fd, "type")) ?? "event";
  await repo.addEvents(
    s.pid,
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

export async function deleteEvent(id: string) {
  const s = await parent();
  await repo.deleteEvent(s.pid, id);
  revalidatePath("/parent/schedule");
}

export async function saveWeeklySchedule(fd: FormData) {
  const s = await parent();
  const rows = [];
  for (let i = 0; i < 8; i++) {
    const day = str(fd, `day_${i}`);
    const time = str(fd, `time_${i}`);
    if (day === null || !time) continue;
    rows.push({ id: str(fd, `id_${i}`) || `s${Date.now().toString(36)}${i}`, day: Number(day), time, kind: str(fd, `kind_${i}`), title: str(fd, `title_${i}`) });
  }
  await repo.updatePlayer(s.pid, { weeklySchedule: cleanSchedule(rows) });
  revalidatePath("/parent/mind");
  redirect("/parent/mind?saved=1");
}

export async function saveMindLines(fd: FormData) {
  const s = await parent();
  const lines = String(fd.get("lines") ?? "")
    .split("\n")
    .map((l) => l.trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 30);
  await repo.updatePlayer(s.pid, { mindLines: lines });
  revalidatePath("/parent/mind");
  redirect("/parent/mind?saved=1");
}

export async function parentTestPush() {
  const s = await parent();
  const { pushToPlayer } = await import("@/lib/mind");
  await pushToPlayer(s.pid, { title: "A message from your coach", body: "This is a test. Tap to open the Mind tab 🌱", url: "/play/mind", tag: "test" });
  redirect("/parent/mind?saved=1");
}
