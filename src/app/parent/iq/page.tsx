import { listQuizAttempts } from "@/db/repo";
import { requireParent } from "@/lib/auth";
import { answerHistory } from "@/lib/data";
import { conceptStates, reinforcementConcepts } from "@/lib/quizEngine";
import { CONCEPT_BY_ID, levelName } from "@/content/quiz";
import { Section } from "@/components/ui";

export default async function IQ() {
  const { player } = await requireParent();
  const attempts = (await listQuizAttempts(player.id)).slice(0, 30);
  const hist = await answerHistory(player.id);
  const states = [...conceptStates(hist).values()];
  const reinforce = reinforcementConcepts(hist);
  const mastered = states.filter((s) => s.mastered);
  const learning = states.filter((s) => !s.mastered);
  const name = (id: string) => CONCEPT_BY_ID[id] ? `${CONCEPT_BY_ID[id].topic}: ${CONCEPT_BY_ID[id].variants[0].q}` : id;
  return (
    <div className="flex flex-col gap-4">
      <Section title={`Level ${player.quizLevel}: ${levelName(player.quizLevel)}`}>
        <p className="text-sm text-muted">Weekly quiz: 20 questions, no time limit. Above 75% unlocks the next level; 75% or below stays. Never drops. Practice never affects level. Every concept missed comes back next week with different wording.</p>
      </Section>
      <Section title="Coming back next week (reinforcement)">
        {reinforce.length === 0 ? <p className="text-sm text-muted">Nothing outstanding.</p> : (
          <ul className="list-disc pl-5 text-sm">{reinforce.map((c) => <li key={c}>{name(c)}</li>)}</ul>
        )}
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title={`Concepts understood (${mastered.length})`}>
          <ul className="list-disc pl-5 text-sm">{mastered.map((s) => <li key={s.conceptId}>{CONCEPT_BY_ID[s.conceptId]?.topic}: {s.conceptId.replace(/-/g, " ")}</li>)}</ul>
        </Section>
        <Section title={`Still learning (${learning.length})`}>
          <ul className="list-disc pl-5 text-sm">{learning.map((s) => <li key={s.conceptId}>{CONCEPT_BY_ID[s.conceptId]?.topic}: {s.conceptId.replace(/-/g, " ")} <span className="text-muted">({s.correct}/{s.attempts})</span></li>)}</ul>
        </Section>
      </div>
      <Section title="Quiz history">
        {attempts.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="text-muted"><tr><th>Date</th><th>Type</th><th>Level</th><th>Score</th></tr></thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}><td className="py-1">{a.completedAt.toLocaleDateString("en-AU")}</td><td>{a.kind}</td><td>{a.level}</td><td>{a.score}/{a.total}{a.levelUp ? " ↑" : ""}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
