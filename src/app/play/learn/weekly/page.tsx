import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePlayerView } from "@/lib/auth";
import { answerHistory } from "@/lib/data";
import { buildWeeklyQuiz, weekKey } from "@/lib/quizEngine";
import QuizRunner from "@/components/QuizRunner";

export default async function WeeklyQuiz() {
  const { player } = await requirePlayerView();
  const wk = weekKey(new Date());
  const [done] = await db
    .select({ id: schema.quizAttempts.id })
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.playerId, player.id), eq(schema.quizAttempts.kind, "weekly"), eq(schema.quizAttempts.weekKey, wk)));
  if (done) redirect("/play/learn");
  const seed = player.id * 100000 + Number(wk.replace(/\D/g, ""));
  const questions = buildWeeklyQuiz(player.quizLevel, await answerHistory(player.id), seed);
  return <QuizRunner questions={questions} kind="weekly" />;
}
