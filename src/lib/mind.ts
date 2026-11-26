import "server-only";
import * as repo from "@/db/repo";
import type { Player } from "@/db/types";
import { coachLine } from "@/lib/coachAI";
import { dateSeed } from "@/lib/recommend";
import { DEFAULT_SCHEDULE, NOTE_FALLBACKS, cleanSchedule, sessionNow, type ScheduleSlot } from "@/content/mind";

export function scheduleFor(player: Player): ScheduleSlot[] {
  return player.weeklySchedule == null ? DEFAULT_SCHEDULE : cleanSchedule(player.weeklySchedule);
}

const THEMES = [
  "getting out is a normal part of cricket and happens to the best players",
  "watching the ball closely and playing your shots with confidence",
  "nerves are normal and just mean you care",
  "being a great teammate and having fun",
  "every ball is a fresh start",
];

/**
 * The positive note for the session happening around now, or null.
 * Cached per session per day so Liam sees the same note each time he opens the app.
 *
 * PRIVACY: only the session type, its title and Liam's own reset word go to
 * Gemini. Parent observations and overview are never used here.
 */
export async function preSessionNote(player: Player, now = new Date()) {
  const cur = sessionNow(scheduleFor(player), now);
  if (!cur) return null;
  const { slot, dateKey, minutesUntil } = cur;
  const id = `${dateKey}-${slot.id}`;
  const cached = await repo.getMindNote(player.id, id);
  if (cached) return { slot, minutesUntil, text: cached.text };

  const seed = dateSeed(now);
  const pool = NOTE_FALLBACKS[slot.kind];
  const fallback = pool[seed % pool.length];
  const parentLines = (player.mindLines ?? []).filter(Boolean);
  let text: string;
  if (parentLines.length && seed % 3 === 0) {
    text = parentLines[seed % parentLines.length];
  } else {
    const theme = THEMES[seed % THEMES.length];
    const word = player.mindWord ? ` Their own reset word is "${player.mindWord}"; you may mention it.` : "";
    text = await coachLine(
      `Write a short, calm, positive note for a young cricketer to read just before ${slot.kind === "match" ? "a game" : "cricket training"} (${slot.title}). ` +
        `Theme: ${theme}. Help them feel relaxed so they play their shots instead of just trying to survive. ` +
        `Never say "fail", "let down" or "disappoint".${word}`,
      fallback,
    );
  }
  await repo.setMindNote(player.id, id, { playerId: player.id, slotId: slot.id, dateKey, text, createdAt: new Date() });
  return { slot, minutesUntil, text };
}
