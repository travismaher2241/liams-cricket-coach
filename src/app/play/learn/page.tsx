import Link from "next/link";
import { listQuizAttempts } from "@/db/repo";
import { requirePlayerView } from "@/lib/auth";
import { weekKey } from "@/lib/quizEngine";
import { levelName, CONCEPTS } from "@/content/quiz";

export default async function Learn() {
  const { player } = await requirePlayerView();
  const [thisWeek] = await listQuizAttempts(player.id, { kind: "weekly", weekKey: weekKey(new Date()) });
  const topics = [...new Set(CONCEPTS.filter((c) => c.level <= player.quizLevel).map((c) => c.topic))];

  return (
    <main className="flex flex-col gap-4">
      <h1 className="h-display text-3xl">Learn</h1>
      <section className="card">
        <p className="label">Your Cricket IQ</p>
        <p className="mt-1 text-2xl font-bold">Level {player.quizLevel}</p>
        <p className="text-turf">{levelName(player.quizLevel)}</p>
      </section>

      {thisWeek ? (
        <section className="card">
          <p className="label">This week&apos;s quiz</p>
          <p className="mt-1 text-lg font-semibold">Done: {thisWeek.score} right this week</p>
          <p className="text-sm text-muted">A new quiz arrives on Monday. Want some practice for fun?</p>
          <Link href="/play/learn/practice" className="btn-primary mt-3 w-full">5 practice questions</Link>
        </section>
      ) : (
        <section className="card border-turf/60">
          <p className="label text-turf">This week&apos;s quiz</p>
          <p className="mt-1 text-xl font-bold">20 questions · no time limit</p>
          <p className="text-sm text-muted">Do it whenever you like this week. Stop and come back any time? Just start again.</p>
          <Link href="/play/learn/weekly" className="btn-primary mt-3 w-full">Start the quiz</Link>
        </section>
      )}

      <section>
        <p className="label mb-2">Practise a topic (just for fun)</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <Link key={t} href={`/play/learn/practice?topic=${encodeURIComponent(t)}`} className="btn-small">
              {t}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
