import "server-only";
import webpush from "web-push";
import * as repo from "@/db/repo";
import type { MindNote, Player } from "@/db/types";
import { coachLine } from "@/lib/coachAI";
import { dateSeed } from "@/lib/recommend";
import {
  DEFAULT_SCHEDULE,
  NOTE_FALLBACKS,
  cleanSchedule,
  isDistress,
  sessionDueForAfterPush,
  sessionDueForPush,
  sessionNow,
  type ScheduleSlot,
} from "@/content/mind";

export function scheduleFor(player: Player): ScheduleSlot[] {
  return player.weeklySchedule == null ? DEFAULT_SCHEDULE : cleanSchedule(player.weeklySchedule);
}

const THEMES = [
  "getting out is a normal part of cricket and happens to the best players",
  "when bowling, getting hit for four or six is just the batter doing their job; it happens to every bowler, so bowl the next ball with confidence",
  "everyone misfields or drops a catch sometimes; clap it off, say next one, and these moments give you fun things to practise",
  "watching the ball closely and playing your shots with confidence",
  "nerves are normal and just mean you care",
  "being a great teammate and having fun",
  "every ball is a fresh start, whether batting, bowling or fielding",
];

/** Liam's most recent thought from the last 14 days that is safe to pass to the AI. */
async function recentThought(playerId: string) {
  const since = Date.now() - 14 * 86400000;
  const t = (await repo.listThoughts(playerId, 5)).find((x) => x.createdAt.getTime() > since && !x.flagged && !isDistress(x.text));
  return t ? t.text.slice(0, 300) : null;
}

/**
 * Get (or create and cache) the note for a session on a given day.
 *
 * PRIVACY: only player-safe context goes to Gemini: the session type and title,
 * Liam's reset word, his favourite cricketer and his own optional thought.
 * Parent observations, overview and safety notes are never used here.
 */
async function ensureNote(player: Player, slot: ScheduleSlot, dateKey: string, now: Date): Promise<MindNote> {
  const id = `${dateKey}-${slot.id}`;
  const cached = await repo.getMindNote(player.id, id);
  if (cached) return cached;

  const seed = dateSeed(now);
  const pool = NOTE_FALLBACKS[slot.kind];
  const fallback = pool[seed % pool.length];
  const parentLines = (player.mindLines ?? []).filter(Boolean);
  let text: string;
  if (parentLines.length && seed % 3 === 0) {
    text = parentLines[seed % parentLines.length];
  } else {
    const theme = THEMES[seed % THEMES.length];
    const hero = player.playerAnswers?.favCricketer?.trim();
    const thought = await recentThought(player.id);
    text = await coachLine(
      `Write a short, calm, positive note for a young cricketer to read just before ${slot.kind === "match" ? "a game" : "cricket training"} (${slot.title}). ` +
        `Theme: ${theme}. Help them feel relaxed so they enjoy batting, bowling and fielding instead of worrying about mistakes. ` +
        `Never say "fail", "let down" or "disappoint".` +
        (player.mindWord ? ` Their own reset word is "${player.mindWord}"; you may mention it.` : "") +
        (hero
          ? ` Their favourite cricketer is ${hero}. You may say that even ${hero} gets out, gets hit for runs or misfields sometimes, but never state specific scores, stats or match facts about them.`
          : "") +
        (thought
          ? ` Recently the player wrote this about how they feel: "${thought}". If it fits, gently speak to that feeling without quoting it. Don't give medical or psychological advice.`
          : ""),
      fallback,
    );
  }
  const note = { playerId: player.id, slotId: slot.id, dateKey, text, createdAt: new Date(), pushedAt: null };
  await repo.setMindNote(player.id, id, note);
  return { ...note, id };
}

/** The positive note for the session happening around now, or null. */
export async function preSessionNote(player: Player, now = new Date()) {
  const cur = sessionNow(scheduleFor(player), now);
  if (!cur) return null;
  const note = await ensureNote(player, cur.slot, cur.dateKey, now);
  return { slot: cur.slot, minutesUntil: cur.minutesUntil, text: note.text };
}

// ---------------------------------------------------------------------------
// Phone notifications (Web Push)

/**
 * VAPID keys for Web Push. Generated once on first use and kept server-side in
 * Firestore (config/webpush), so no keys need pasting anywhere.
 */
export async function pushKeys() {
  if (process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PUBLIC_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  return repo.getOrCreateConfig("webpush", () => webpush.generateVAPIDKeys());
}

export const pushPublicKey = async () => (await pushKeys()).publicKey;

async function setupPush() {
  const k = await pushKeys();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://liams-cricket-coach.vercel.app", k.publicKey, k.privateKey);
}

/** Send one notification to every device subscribed for this player. Drops dead subscriptions. */
export async function pushToPlayer(playerId: string, payload: { title: string; body: string; url: string; tag?: string }) {
  await setupPush();
  const subs = await repo.listPushSubs(playerId);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 3 * 3600 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await repo.deletePushSub(playerId, s.id);
        else console.error("push error", code);
      }
    }),
  );
  return sent;
}

/** Called by the scheduler every ~30 minutes. Sends each session's notification once. */
export async function sendDueNotes(now = new Date()) {
  const players = await repo.listPlayers();
  const out: { player: string; slot: string; sent: number }[] = [];
  for (const p of players) {
    const after = sessionDueForAfterPush(scheduleFor(p), now);
    if (after) {
      const flag = `after-${after.dateKey}-${after.slot.id}`;
      const already = await repo.getFlag(p.id, flag);
      const logged =
        after.slot.kind === "match"
          ? (await repo.listMatches(p.id)).some((m) => m.matchDate === after.dateKey)
          : !!(await repo.getSessionLog(p.id, `${after.dateKey}-${after.slot.id}`));
      if (!already && !logged) {
        const sent = await pushToPlayer(
          p.id,
          after.slot.kind === "match"
            ? { title: "How did the game go? 🏏", body: "Tap to record your game. Stats and how it felt, whenever you're ready.", url: "/play/match/new", tag: flag }
            : { title: `How was ${after.slot.title.toLowerCase()}? 🏏`, body: "Tap to add your training update. It only takes a minute.", url: `/play/after?slot=${encodeURIComponent(after.slot.id)}`, tag: flag },
        );
        if (sent > 0) await repo.setFlag(p.id, flag); // no phone signed up yet: try again next run
        out.push({ player: p.id, slot: `after-${after.slot.id}`, sent });
      }
    }
    const due = sessionDueForPush(scheduleFor(p), now);
    if (!due) continue;
    const note = await ensureNote(p, due.slot, due.dateKey, now);
    if (note.pushedAt) continue;
    const before = due.slot.kind === "match" ? "your game" : due.slot.title.toLowerCase();
    const sent = await pushToPlayer(p.id, {
      title: "A message from your coach",
      body: `Before ${before} today. Tap to read it 🌱`,
      url: "/play/mind",
      tag: note.id,
    });
    if (sent > 0) await repo.markMindNotePushed(p.id, note.id); // no phone signed up yet: try again next run
    out.push({ player: p.id, slot: due.slot.id, sent });
  }
  return out;
}
