import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizAttempt } from "@/db/repo";
import { requireParent } from "@/lib/auth";
import { CONCEPT_BY_ID } from "@/content/quiz";
import { Section } from "@/components/ui";

export default async function QuizAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { player } = await requireParent();
  const a = await getQuizAttempt(player.id, id);
  if (!a) notFound();
  const hasChoices = a.answers.some((x) => x.chosen !== undefined);
  return (
    <div className="flex flex-col gap-4">
      <Link href="/parent/iq" className="text-sm text-muted">‹ Cricket IQ</Link>
      <Section title={`${a.kind === "weekly" ? "Weekly quiz" : "Practice"} · ${a.completedAt.toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne", weekday: "long", day: "numeric", month: "long" })}`}>
        <p className="text-sm text-muted">
          Level {a.level} · {a.score} of {a.total} right{a.levelUp ? " · unlocked the next level" : ""}
        </p>
        {!hasChoices && (
          <p className="mt-2 rounded-xl bg-gold/10 p-3 text-sm">
            This quiz was taken before the app started saving which option {player.displayName} picked, so you can see each question and whether he got it right, but not his
            exact answer. Quizzes from now on show his answer too.
          </p>
        )}
      </Section>
      <ol className="flex flex-col gap-3">
        {a.answers.map((x, i) => {
          const [cid, vi] = x.questionId.split("#");
          const v = CONCEPT_BY_ID[cid]?.variants[Number(vi)];
          if (!v) return null;
          const right = v.options[v.answer];
          const alsoOk = x.chosen && x.chosen !== right && (v.alsoOk ?? []).some((k) => v.options[k] === x.chosen);
          return (
            <li key={i} className={`card ${x.correct ? "border-turf/40" : "border-gold/50"}`}>
              <p className="text-xs text-muted">
                Q{i + 1} · {CONCEPT_BY_ID[cid].topic}
              </p>
              <p className="mt-1 font-semibold">{v.q}</p>
              <ul className="mt-2 grid gap-1 text-sm">
                {v.options.map((o) => {
                  const picked = x.chosen === o;
                  const isRight = o === right;
                  return (
                    <li key={o} className={`rounded-lg px-3 py-1.5 ${picked ? (x.correct ? "bg-turf/20" : "bg-gold/20") : isRight ? "bg-surface-2" : ""}`}>
                      {o}
                      {picked && <span className="ml-2 font-semibold">← {player.displayName}&apos;s answer</span>}
                      {isRight && <span className="ml-2 text-turf">(correct)</span>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-sm">
                {x.correct ? (alsoOk ? "Right. Also a good answer." : "Right.") : x.chosen === undefined ? "Not right. Answer not recorded." : x.chosen ? "Not right." : "Skipped."}
                <span className="text-muted"> {v.why}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
