"use server";
import { redirect } from "next/navigation";
import * as repo from "@/db/repo";
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
  const player = await repo.getPlayer(s.pid);
  if (!player) redirect("/");
  const wk = weekKey(new Date());

  // Server-side marking.
  const marked = answers
    .slice(0, 40)
    .map((a) => {
      const [conceptId, vi] = String(a.questionId).split("#");
      const v = CONCEPT_BY_ID[conceptId]?.variants[Number(vi)];
      if (!v) return null;
      const okTexts = [v.options[v.answer], ...(v.alsoOk ?? []).map((i) => v.options[i])];
      return { questionId: a.questionId, conceptId, correct: okTexts.includes(a.chosen) };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  let effectiveKind = kind;
  if (kind === "weekly" && (await repo.listQuizAttempts(player.id, { kind: "weekly", weekKey: wk })).length) effectiveKind = "practice";

  const score = marked.filter((m) => m.correct).length;
  const total = marked.length;
  // Practice never changes the level.
  const prog = effectiveKind === "weekly" ? nextLevel(player.quizLevel, score, total) : { level: player.quizLevel, levelUp: false };

  await repo.addQuizAttempt(player.id, {
    playerId: player.id,
    kind: effectiveKind,
    weekKey: effectiveKind === "weekly" ? wk : null,
    level: player.quizLevel,
    score,
    total,
    levelUp: prog.levelUp,
    answers: marked,
    completedAt: new Date(),
  });
  if (prog.levelUp) await repo.updatePlayer(player.id, { quizLevel: prog.level });

  const fresh = await refreshAchievements(player.id);
  return { score, total, levelUp: prog.levelUp, newLevel: prog.level, kind: effectiveKind, achievements: fresh.map((a) => a.title) };
}
