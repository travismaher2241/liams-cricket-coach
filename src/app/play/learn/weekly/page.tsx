import { redirect } from "next/navigation";
import { listQuizAttempts } from "@/db/repo";
import { requirePlayerView } from "@/lib/auth";
import { answerHistory } from "@/lib/data";
import { buildWeeklyQuiz, weekKey } from "@/lib/quizEngine";
import QuizRunner from "@/components/QuizRunner";

export default async function WeeklyQuiz() {
  const { player } = await requirePlayerView();
  const wk = weekKey(new Date());
  const [done] = await listQuizAttempts(player.id, { kind: "weekly", weekKey: wk });
  if (done) redirect("/play/learn");
  const seed = [...player.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) + Number(wk.replace(/\D/g, ""));
  const questions = buildWeeklyQuiz(player.quizLevel, await answerHistory(player.id), seed);
  return <QuizRunner questions={questions} kind="weekly" />;
}
