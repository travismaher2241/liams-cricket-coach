import { CONCEPTS, CONCEPT_BY_ID, questionFor, type QuizQuestion } from "@/content/quiz";

export const WEEKLY_QUIZ_SIZE = 20;

/** Score strictly above 75% unlocks the next level. 75% or below keeps the level. Never goes down. */
export function nextLevel(current: number, score: number, total: number): { level: number; levelUp: boolean } {
  if (total > 0 && score / total > 0.75) return { level: current + 1, levelUp: true };
  return { level: current, levelUp: false };
}

export interface AnswerHistory {
  conceptId: string;
  questionId: string;
  correct: boolean;
  kind: "weekly" | "practice";
  attemptId: string;
  at: Date;
}

/** Simple seeded RNG so a quiz is stable across reloads. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Choose the next variant for a concept: a different wording to the last one seen. */
function nextVariant(conceptId: string, history: AnswerHistory[]): number {
  const seen = history.filter((h) => h.conceptId === conceptId);
  if (!seen.length) return 0;
  const last = seen.reduce((a, b) => (a.at > b.at ? a : b));
  const lastIdx = Number(last.questionId.split("#")[1] ?? 0);
  const n = CONCEPT_BY_ID[conceptId]?.variants.length ?? 1;
  return (lastIdx + 1) % n;
}

/** Shuffle options so the right answer moves around; keep answer index in sync. */
function shuffleOptions(q: QuizQuestion, rand: () => number): QuizQuestion {
  const order = shuffle(
    q.options.map((_, i) => i),
    rand,
  );
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answer: order.indexOf(q.answer),
    alsoOk: q.alsoOk?.map((i) => order.indexOf(i)),
  };
}

export interface ConceptState {
  conceptId: string;
  attempts: number;
  correct: number;
  lastCorrect: boolean | null;
  /** Mastered = answered correctly on its most recent two attempts (or once if only seen once correctly). */
  mastered: boolean;
}

export function conceptStates(history: AnswerHistory[]): Map<string, ConceptState> {
  const byConcept = new Map<string, AnswerHistory[]>();
  for (const h of history) {
    const list = byConcept.get(h.conceptId) ?? [];
    list.push(h);
    byConcept.set(h.conceptId, list);
  }
  const out = new Map<string, ConceptState>();
  for (const [conceptId, list] of byConcept) {
    list.sort((a, b) => a.at.getTime() - b.at.getTime());
    const last2 = list.slice(-2);
    out.set(conceptId, {
      conceptId,
      attempts: list.length,
      correct: list.filter((l) => l.correct).length,
      lastCorrect: list[list.length - 1]?.correct ?? null,
      mastered: last2.every((l) => l.correct),
    });
  }
  return out;
}

/** Concepts answered incorrectly in the most recent weekly quiz. These MUST appear next week. */
export function reinforcementConcepts(history: AnswerHistory[]): string[] {
  const weekly = history.filter((h) => h.kind === "weekly");
  if (!weekly.length) return [];
  const lastAttempt = weekly.reduce((a, b) => (a.at > b.at ? a : b)).attemptId;
  return [...new Set(weekly.filter((h) => h.attemptId === lastAttempt && !h.correct).map((h) => h.conceptId))];
}

export function buildWeeklyQuiz(level: number, history: AnswerHistory[], seed: number, size = WEEKLY_QUIZ_SIZE): QuizQuestion[] {
  const rand = rng(seed);
  const states = conceptStates(history);
  const picked: string[] = [];
  const add = (ids: string[], max = Infinity) => {
    let n = 0;
    for (const id of ids) {
      if (picked.length >= size || n >= max) break;
      if (!picked.includes(id) && CONCEPT_BY_ID[id]) {
        picked.push(id);
        n++;
      }
    }
  };

  const effectiveLevel = Math.min(level, Math.max(...CONCEPTS.map((c) => c.level)));

  // 1. Every concept missed last weekly quiz (required).
  add(reinforcementConcepts(history));
  // 2. Other concepts still not mastered (continued learning opportunities), up to 3.
  const struggling = [...states.values()].filter((s) => !s.mastered).map((s) => s.conceptId);
  add(shuffle(struggling, rand), 3);
  // 3. A couple of mastered concepts revisited for long-term memory.
  const mastered = [...states.values()].filter((s) => s.mastered).map((s) => s.conceptId);
  add(shuffle(mastered, rand), 2);
  // 4. Current level: unseen first, then seen.
  const current = CONCEPTS.filter((c) => c.level === effectiveLevel).map((c) => c.id);
  add(shuffle(current.filter((id) => !states.has(id)), rand));
  add(shuffle(current, rand));
  // 5. Fill from lower levels, nearest first.
  for (let l = effectiveLevel - 1; l >= 1 && picked.length < size; l--) {
    const lower = CONCEPTS.filter((c) => c.level === l).map((c) => c.id);
    add(shuffle(lower.filter((id) => !states.get(id)?.mastered), rand));
    add(shuffle(lower, rand));
  }
  // 6. If still short (very high level), use anything.
  add(shuffle(CONCEPTS.map((c) => c.id), rand));

  return shuffle(picked, rand).map((id) => shuffleOptions(questionFor(id, nextVariant(id, history)), rand));
}

/** Short optional practice set. Never affects the weekly level. */
export function buildPractice(level: number, history: AnswerHistory[], seed: number, topic?: string, size = 5): QuizQuestion[] {
  const rand = rng(seed);
  const pool = CONCEPTS.filter((c) => c.level <= Math.max(level, 1) + 0 && (!topic || c.topic === topic));
  const ids = shuffle(pool.length ? pool.map((c) => c.id) : CONCEPTS.map((c) => c.id), rand).slice(0, size);
  return ids.map((id) => shuffleOptions(questionFor(id, nextVariant(id, history)), rand));
}

/** Week key in Melbourne time, weeks starting Monday, e.g. "2026-W48". */
export function weekKey(d: Date, tz = "Australia/Melbourne"): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const [y, m, day] = parts.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
