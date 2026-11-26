"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { levelName, type QuizQuestion } from "@/content/quiz";
import { submitQuiz, type SubmittedAnswer } from "@/app/actions/quiz";
import { Progress } from "./Stepper";

type Result = Awaited<ReturnType<typeof submitQuiz>>;

export default function QuizRunner({ questions, kind }: { questions: QuizQuestion[]; kind: "weekly" | "practice" }) {
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<SubmittedAnswer[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const q = questions[i];

  if (result) {
    return (
      <section className="card flex flex-col items-center gap-3 text-center">
        
        <h2 className="h-display text-3xl">{result.levelUp ? "Level up!" : "Quiz done!"}</h2>
        <p className="text-lg">
          <b>{result.score}</b> right{result.total - result.score > 0 ? <> and <b>{result.total - result.score}</b> new things learned</> : " (every single one!)"}
        </p>
        {result.levelUp ? (
          <p className="rounded-xl bg-turf/15 px-3 py-2 font-semibold text-turf">You&apos;ve unlocked {levelName(result.newLevel)}!</p>
        ) : result.kind === "weekly" ? (
          <p className="text-muted">Every question is a chance to learn. Anything tricky will pop up again in a new way next week.</p>
        ) : (
          <p className="text-muted">Practice is just for fun and learning. It never changes your level.</p>
        )}
        {result.achievements.map((a) => (
          <p key={a} className="rounded-xl bg-gold/15 px-3 py-2 font-semibold text-gold">🏅 {a}</p>
        ))}
        <div className="mt-2 grid w-full gap-2">
          <Link href="/play/learn" className="btn-primary">Back to Learn</Link>
          <Link href="/play" className="btn-ghost">Home</Link>
        </div>
      </section>
    );
  }

  const answered = chosen !== null;
  const correct = answered && (chosen === q.answer || q.alsoOk?.includes(chosen!));

  const next = () => {
    const nextAnswers = [...answers, { questionId: q.id, chosen: q.options[chosen!] }];
    setAnswers(nextAnswers);
    setChosen(null);
    if (i + 1 < questions.length) setI(i + 1);
    else start(async () => setResult(await submitQuiz(kind, nextAnswers)));
  };

  return (
    <section className="flex flex-col gap-4">
      <Progress step={i} total={questions.length} />
      <p className="label">
        Question {i + 1} of {questions.length} · {q.topic}
      </p>
      <h2 className="text-2xl font-bold leading-snug">{q.q}</h2>
      {q.junior && <p className="text-xs text-sky">Junior cricket rules can be different. Check with your coach!</p>}
      <div className="flex flex-col gap-2">
        {q.options.map((o, idx) => {
          let cls = "";
          if (answered) {
            if (idx === q.answer || q.alsoOk?.includes(idx)) cls = "!border-turf !bg-turf/15";
            else if (idx === chosen) cls = "!border-sky !bg-sky/10";
            else cls = "opacity-60";
          }
          return (
            <button key={idx} disabled={answered} onClick={() => setChosen(idx)} className={`choice ${cls}`}>
              {o}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`card ${correct ? "border-turf/60" : "border-sky/60"}`}>
          <p className="font-bold">{correct ? "Yes!" : "Good thinking. Here's the answer:"}</p>
          <p className="mt-1">{q.why}</p>
          {q.alsoOk && q.alsoOk.length > 0 && <p className="mt-1 text-sm text-muted">In cricket there isn&apos;t always one right answer.</p>}
        </div>
      )}
      {answered && (
        <button className="btn-primary" onClick={next} disabled={pending}>
          {i + 1 < questions.length ? "Next" : pending ? "Saving…" : "Finish"}
        </button>
      )}
    </section>
  );
}
