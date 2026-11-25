import { requirePlayerView } from "@/lib/auth";
import { answerHistory } from "@/lib/data";
import { buildPractice } from "@/lib/quizEngine";
import QuizRunner from "@/components/QuizRunner";

export const dynamic = "force-dynamic";

export default async function Practice({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const { player } = await requirePlayerView();
  const questions = buildPractice(player.quizLevel, await answerHistory(player.id), Date.now() % 1000003, topic);
  return <QuizRunner questions={questions} kind="practice" />;
}
