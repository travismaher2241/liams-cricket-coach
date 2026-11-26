import "server-only";
import { GoogleGenAI } from "@google/genai";

/**
 * Gemini-powered coaching lines.
 *
 * PRIVACY: callers must only pass player-safe context (Liam's own answers,
 * drill names, broad area labels). Parent observations are NEVER passed here,
 * so they can't leak into anything Liam reads.
 */

const SYSTEM = `You are a friendly, calm junior cricket coach talking to a young cricketer.
Rules you must always follow:
- Maximum 2 short sentences, under 35 words total. Simple words. No lists, no markdown, no emojis.
- Always encouraging and specific. Never criticise. Never mention weaknesses, failing, falling behind, targets, streaks or comparisons with other players.
- Mistakes are a normal part of cricket. Effort matters. "Every little bit counts."
- Never give medical or psychological advice. If something hurts, say to rest and tell a grown-up.
- You complement the player's real coaches; don't contradict them.`;

const BANNED = [/fail/i, /behind/i, /work harder/i, /not good enough/i, /poor/i, /weakness/i, /streak/i, /should have/i, /disappoint/i, /worse/i, /target you missed/i, /let (you |your \w+ |them |anyone |the team |everyone )?down/i];

export function isSafeLine(s: string) {
  return s.length > 0 && s.length < 300 && !BANNED.some((r) => r.test(s));
}

export async function coachLine(prompt: string, fallback: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fallback;
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await Promise.race([
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: SYSTEM, temperature: 0.8, maxOutputTokens: 120, thinkingConfig: { thinkingBudget: 0 } },
      }),
      new Promise<null>((r) => setTimeout(() => r(null), 6000)),
    ]);
    const text = res?.text?.trim().replace(/\s+/g, " ");
    return text && isSafeLine(text) ? text : fallback;
  } catch (e) {
    console.error("Gemini coach error", e);
    return fallback;
  }
}

const FALLBACK_HELLO = [
  "Every little bit counts. Pick something that sounds fun!",
  "Build on what you're already doing well. Ready for a quick one?",
  "Five minutes of practice is worth celebrating. Let's go!",
  "Trust yourself. Here's a quick challenge if you feel like it.",
  "Have fun with it. There's no wrong way to start.",
];

export function fallbackHello(seed: number) {
  return FALLBACK_HELLO[seed % FALLBACK_HELLO.length];
}
