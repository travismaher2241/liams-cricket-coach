import "server-only";
import { firestore, fromFs } from "./firestore";
import type {
  Achievement,
  Activity,
  CalEvent,
  Match,
  MatchPrep,
  MindNote,
  PushSub,
  Thought,
  Observation,
  Player,
  Programme,
  QuizAttempt,
  Reflection,
  User,
} from "./types";

/*
 * Layout:
 *   users/{userId}
 *   players/{playerId}
 *   players/{playerId}/{observations|programmes|activities|quizAttempts|matches|reflections|matchPreps|events|achievements}/{id}
 *
 * Data per player is small, so we keep queries to single-field filters
 * (no composite indexes needed) and sort in memory.
 */

const db = () => firestore();
const sub = (pid: string, name: string) => db().collection("players").doc(pid).collection(name);
type NoId<T> = Omit<T, "id">;

async function all<T>(q: FirebaseFirestore.Query): Promise<T[]> {
  const snap = await q.get();
  return snap.docs.map((d) => fromFs<T>(d.id, d.data()));
}
async function one<T>(ref: FirebaseFirestore.DocumentReference): Promise<T | null> {
  const d = await ref.get();
  return d.exists ? fromFs<T>(d.id, d.data()!) : null;
}
const byDate = <T>(key: keyof T, dir: "asc" | "desc" = "desc") => (a: T, b: T) => {
  const x = a[key] as unknown as Date | string;
  const y = b[key] as unknown as Date | string;
  const r = x < y ? -1 : x > y ? 1 : 0;
  return dir === "asc" ? r : -r;
};

// ---------------- Users & players ----------------
export async function countUsers() {
  const s = await db().collection("users").limit(1).get();
  return s.size;
}

export async function createFamily(parent: NoId<User>, playerUser: NoId<User>, playerName: string) {
  const users = db().collection("users");
  const parentRef = users.doc();
  const puRef = users.doc();
  const playerRef = db().collection("players").doc();
  const player: NoId<Player> = {
    userId: puRef.id,
    parentId: parentRef.id,
    displayName: playerName,
    birthYear: null,
    battingHand: null,
    bowlingStyle: null,
    team: null,
    competition: null,
    parentOverview: null,
    priorities: {},
    equipment: [],
    spaces: [],
    safetyNotes: null,
    playerAnswers: null,
    playerOnboarded: false,
    quizLevel: 1,
    season: null,
    seasonPhase: "in",
    createdAt: new Date(),
  };
  const batch = db().batch();
  batch.set(parentRef, parent);
  batch.set(puRef, playerUser);
  batch.set(playerRef, player);
  await batch.commit();
  return { parentId: parentRef.id, playerId: playerRef.id };
}

export const getUser = (id: string) => one<User>(db().collection("users").doc(id));
export async function getUserByEmail(email: string) {
  const r = await all<User>(db().collection("users").where("email", "==", email).limit(1));
  return r[0] ?? null;
}
export const updateUser = (id: string, patch: Partial<NoId<User>>) => db().collection("users").doc(id).update(patch);

export const listPlayers = () => all<Player>(db().collection("players"));
export const getPlayer = (id: string) => (id ? one<Player>(db().collection("players").doc(id)) : Promise.resolve(null));
export async function getPlayerByParent(parentId: string) {
  const r = await all<Player>(db().collection("players").where("parentId", "==", parentId).limit(1));
  return r[0] ?? null;
}
export const updatePlayer = (id: string, patch: Partial<NoId<Player>>) => db().collection("players").doc(id).update(patch);

// ---------------- Observations (parent only) ----------------
export async function listObservations(pid: string) {
  return (await all<Observation>(sub(pid, "observations"))).sort(byDate("createdAt"));
}
export const addObservation = (pid: string, o: NoId<Observation>) => sub(pid, "observations").add(o);
export const deleteObservation = (pid: string, id: string) => sub(pid, "observations").doc(id).delete();

// ---------------- Programmes ----------------
export async function listProgrammes(pid: string, status?: Programme["status"]) {
  const q = status ? sub(pid, "programmes").where("status", "==", status) : sub(pid, "programmes");
  return (await all<Programme>(q)).sort(byDate("startedAt"));
}
export const getProgramme = (pid: string, id: string) => one<Programme>(sub(pid, "programmes").doc(id));
export const addProgramme = (pid: string, p: NoId<Programme>) => sub(pid, "programmes").add(p);
export const updateProgramme = (pid: string, id: string, patch: Partial<NoId<Programme>>) => sub(pid, "programmes").doc(id).update(patch);
export async function deleteProgramme(pid: string, id: string) {
  const acts = await sub(pid, "activities").where("programmeId", "==", id).get();
  const batch = db().batch();
  acts.docs.forEach((d) => batch.update(d.ref, { programmeId: null }));
  batch.delete(sub(pid, "programmes").doc(id));
  await batch.commit();
}

// ---------------- Activities ----------------
export async function listActivities(pid: string, opts: { since?: Date; programmeId?: string; drillId?: string } = {}) {
  let q: FirebaseFirestore.Query = sub(pid, "activities");
  if (opts.programmeId) q = q.where("programmeId", "==", opts.programmeId);
  else if (opts.drillId) q = q.where("drillId", "==", opts.drillId);
  else if (opts.since) q = q.where("completedAt", ">=", opts.since);
  let r = await all<Activity>(q);
  if (opts.since) r = r.filter((a) => a.completedAt >= opts.since!);
  return r.sort(byDate("completedAt"));
}
export const addActivity = (pid: string, a: NoId<Activity>) => sub(pid, "activities").add(a);

// ---------------- Quiz ----------------
export async function listQuizAttempts(pid: string, opts: { kind?: QuizAttempt["kind"]; weekKey?: string } = {}) {
  let q: FirebaseFirestore.Query = sub(pid, "quizAttempts");
  if (opts.weekKey) q = q.where("weekKey", "==", opts.weekKey);
  else if (opts.kind) q = q.where("kind", "==", opts.kind);
  let r = await all<QuizAttempt>(q);
  if (opts.kind) r = r.filter((a) => a.kind === opts.kind);
  return r.sort(byDate("completedAt"));
}
export async function addQuizAttempt(pid: string, a: NoId<QuizAttempt>) {
  const ref = await sub(pid, "quizAttempts").add(a);
  return ref.id;
}

// ---------------- Matches & reflections ----------------
export async function listMatches(pid: string) {
  return (await all<Match>(sub(pid, "matches"))).sort(byDate("matchDate"));
}
export const getMatch = (pid: string, id: string) => one<Match>(sub(pid, "matches").doc(id));
export async function addMatch(pid: string, m: NoId<Match>) {
  return (await sub(pid, "matches").add(m)).id;
}
export const updateMatch = (pid: string, id: string, patch: Partial<NoId<Match>>) => sub(pid, "matches").doc(id).update(patch);
export async function deleteMatch(pid: string, id: string) {
  const refl = await sub(pid, "reflections").where("matchId", "==", id).get();
  const batch = db().batch();
  refl.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(sub(pid, "matches").doc(id));
  await batch.commit();
}
export async function getReflectionForMatch(pid: string, matchId: string) {
  const r = await all<Reflection>(sub(pid, "reflections").where("matchId", "==", matchId).limit(1));
  return r[0] ?? null;
}
export const listReflections = (pid: string) => all<Reflection>(sub(pid, "reflections"));
export const addReflection = (pid: string, r: NoId<Reflection>) => sub(pid, "reflections").add(r);

export const addMatchPrep = (pid: string, p: NoId<MatchPrep>) => sub(pid, "matchPreps").add(p);
export async function listMatchPreps(pid: string) {
  return (await all<MatchPrep>(sub(pid, "matchPreps"))).sort(byDate("createdAt", "asc"));
}

// ---------------- Events ----------------
export async function listEvents(pid: string, from?: Date) {
  const q = from ? sub(pid, "events").where("startsAt", ">=", from) : sub(pid, "events");
  return (await all<CalEvent>(q)).sort(byDate("startsAt", "asc"));
}
export const getEvent = (pid: string, id: string) => one<CalEvent>(sub(pid, "events").doc(id));
export async function addEvents(pid: string, evs: NoId<CalEvent>[]) {
  const batch = db().batch();
  for (const e of evs) batch.set(sub(pid, "events").doc(), e);
  await batch.commit();
}
export const deleteEvent = (pid: string, id: string) => sub(pid, "events").doc(id).delete();

// ---------------- Achievements ----------------
export async function listAchievements(pid: string) {
  return (await all<Achievement>(sub(pid, "achievements"))).sort(byDate("earnedAt"));
}
/** Insert achievements that don't exist yet (doc id = key). Returns newly added. */
export async function insertNewAchievements(pid: string, earned: Omit<Achievement, "id" | "playerId" | "earnedAt" | "seen">[]) {
  const existing = new Set((await sub(pid, "achievements").select().get()).docs.map((d) => d.id));
  const fresh = earned.filter((e) => !existing.has(e.key));
  if (!fresh.length) return [];
  const now = new Date();
  const batch = db().batch();
  const out: Achievement[] = [];
  for (const e of fresh) {
    const a: Achievement = { ...e, id: e.key, playerId: pid, earnedAt: now, seen: false };
    const { id: _id, ...data } = a;
    batch.set(sub(pid, "achievements").doc(e.key), data);
    out.push(a);
  }
  await batch.commit();
  return out;
}

// ---- Mind notes (cached pre-session notes)
export const getMindNote = (pid: string, id: string) => one<MindNote>(sub(pid, "mindNotes").doc(id));
export const setMindNote = (pid: string, id: string, n: NoId<MindNote>) => sub(pid, "mindNotes").doc(id).set(n);
export const markMindNotePushed = (pid: string, id: string) => sub(pid, "mindNotes").doc(id).update({ pushedAt: new Date() });

// ---- Thoughts (Liam's optional text box)
export async function listThoughts(pid: string, limit = 50) {
  return (await all<Thought>(sub(pid, "thoughts"))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
export const addThought = (pid: string, t: NoId<Thought>) => sub(pid, "thoughts").add(t);
export const deleteThought = (pid: string, id: string) => sub(pid, "thoughts").doc(id).delete();

// ---- Push subscriptions (doc id = hash of endpoint)
export const listPushSubs = (pid: string) => all<PushSub>(sub(pid, "pushSubs"));
export const setPushSub = (pid: string, id: string, p: NoId<PushSub>) => sub(pid, "pushSubs").doc(id).set(p);
export const deletePushSub = (pid: string, id: string) => sub(pid, "pushSubs").doc(id).delete();

// ---- Server-only app config (Firestore rules deny all client access)
export async function getOrCreateConfig<T extends object>(name: string, make: () => T): Promise<T> {
  const ref = db().collection("config").doc(name);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as T;
  const fresh = make();
  try {
    await ref.create(fresh);
    return fresh;
  } catch {
    return (await ref.get()).data() as T; // another request created it first
  }
}
