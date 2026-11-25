"use server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { CONCEPT_BY_ID } from "@/content/quiz";
import { nextLevel, weekKey } from "@/lib/quizEngine";
import { refreshAchievements } from "@/lib/data";

export interface SubmittedAnswer {
  questionId: string; // conceptId#variant
  chosen: string; // option text chosen
}

export async function submitQuiz(kind: "weekly" | "practice", answers: SubmittedAnswer[]) {
  const s = await getSession();
  if (!s) redirect("/");
  const [player] = await db.select().from(schema.players).where(eq(schema.players.id, s.pid));
  const wk = weekKey(new Date());

  // Server-side marking.
  const marked = answers
    .map((a) => {
      const [conceptId, vi] = a.questionId.split("#");
      const c = CONCEPT_BY_ID[conceptId];
      if (!c) return null;
      const v = c.variants[Number(vi)];
      if (!v) return null;
      const okTexts = [v.options[v.answer], ...(v.alsoOk ?? []).map((i) => v.options[i])];
      return { questionId: a.questionId, conceptId, correct: okTexts.includes(a.chosen) };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  let effectiveKind = kind;
  if (kind === "weekly") {
    const [already] = await db
      .select({ id: schema.quizAttempts.id })
      .from(schema.quizAttempts)
      .where(and(eq(schema.quizAttempts.playerId, player.id), eq(schema.quizAttempts.kind, "weekly"), eq(schema.quizAttempts.weekKey, wk)));
    if (already) effectiveKind = "practice";
  }

  const score = marked.filter((m) => m.correct).length;
  const total = marked.length;
  // Practice never changes the level.
  const prog = effectiveKind === "weekly" ? nextLevel(player.quizLevel, score, total) : { level: player.quizLevel, levelUp: false };

  const [attempt] = await db
    .insert(schema.quizAttempts)
    .values({ playerId: player.id, kind: effectiveKind, weekKey: effectiveKind === "weekly" ? wk : null, level: player.quizLevel, score, total, levelUp: prog.levelUp })
    .returning();
  if (marked.length) await db.insert(schema.quizAnswers).values(marked.map((m) => ({ ...m, attemptId: attempt.id })));
  if (prog.levelUp) await db.update(schema.players).set({ quizLevel: prog.level }).where(eq(schema.players.id, player.id));

  const fresh = await refreshAchievements(player.id);
  return { score, total, levelUp: prog.levelUp, newLevel: prog.level, kind: effectiveKind, achievements: fresh.map((a) => a.title) };
}
