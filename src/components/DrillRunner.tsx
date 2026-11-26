"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { logActivity, type ActivityOutcome } from "@/app/actions/player";

type Measure = { label: string; unit: string; higherIsBetter: boolean } | null;

function Row({ title, options, value, onPick }: { title: string; options: [number, string][]; value?: number; onPick: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 font-semibold">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onPick(v)} className={`choice !px-2 !py-3 text-center !text-base ${value === v ? "choice-on" : ""}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DrillRunner({ drillId, minutes, measure, isChallenge }: { drillId: string; minutes: number; measure: Measure; isChallenge: boolean }) {
  const [stage, setStage] = useState<"ready" | "feedback" | "done">("ready");
  const [result, setResult] = useState<string>("");
  const [difficulty, setDifficulty] = useState<number>();
  const [enjoyment, setEnjoyment] = useState<number>();
  const [confidence, setConfidence] = useState<number>();
  const [again, setAgain] = useState<boolean>();
  const [discomfort, setDiscomfort] = useState(false);
  const [outcome, setOutcome] = useState<ActivityOutcome | null>(null);
  const [pending, start] = useTransition();

  if (stage === "ready")
    return (
      <div className="sticky bottom-24 flex flex-col gap-2">
        <button className="btn-primary text-xl" onClick={() => setStage("feedback")}>
          I did it!
        </button>
        <Link href="/play/train" className="btn-ghost text-base">
          Swap for something else
        </Link>
      </div>
    );

  if (stage === "feedback")
    return (
      <section className="card flex flex-col gap-5">
        <h2 className="text-2xl font-bold">Nice work!</h2>
        {measure && (
          <div>
            <p className="mb-2 font-semibold">{measure.label} <span className="text-muted">(optional)</span></p>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-ghost !min-h-12 !px-4" onClick={() => setResult(String(Math.max(0, Number(result || 0) - 1)))}>−</button>
              <input
                className="input text-center text-2xl font-bold"
                inputMode="decimal"
                value={result}
                onChange={(e) => setResult(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="–"
              />
              <button type="button" className="btn-ghost !min-h-12 !px-4" onClick={() => setResult(String(Number(result || 0) + 1))}>+</button>
              <span className="text-muted">{measure.unit}</span>
            </div>
          </div>
        )}
        <Row title="How did it feel?" options={[[1, "Easy"], [2, "Just right"], [3, "Tough"]]} value={difficulty} onPick={setDifficulty} />
        <Row title="Fun?" options={[[1, "Meh"], [2, "Good"], [3, "Loved it"]]} value={enjoyment} onPick={setEnjoyment} />
        <Row title="Confidence?" options={[[1, "Unsure"], [2, "Okay"], [3, "Strong"]]} value={confidence} onPick={setConfidence} />
        <div>
          <p className="mb-2 font-semibold">Do it again some time?</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setAgain(true)} className={`choice text-center !text-base ${again === true ? "choice-on" : ""}`}>Yes please</button>
            <button type="button" onClick={() => setAgain(false)} className={`choice text-center !text-base ${again === false ? "choice-on" : ""}`}>Try others</button>
          </div>
        </div>
        <button type="button" onClick={() => setDiscomfort(!discomfort)} className={`choice !text-base ${discomfort ? "choice-on" : ""}`}>
          {discomfort ? "✅" : "⬜"} Something hurt or felt sore
        </button>
        {discomfort && <p className="rounded-xl bg-gold/10 p-3 text-sm text-gold">Thanks for telling us. Rest that part and let a grown-up know. We&apos;ll pick different activities for a bit.</p>}
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await logActivity({
                drillId,
                minutes,
                difficulty,
                enjoyment,
                confidence,
                again,
                discomfort,
                result: result === "" ? null : Number(result),
                isChallenge,
              });
              setOutcome(r);
              setStage("done");
            })
          }
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <p className="text-center text-xs text-muted">All questions are optional.</p>
      </section>
    );

  return (
    <section className="card flex flex-col items-center gap-3 border-turf text-center">
      
      <h2 className="h-display text-3xl">Done!</h2>
      <p className="text-lg">{minutes} more minutes of cricket in the bank. Every little bit counts.</p>
      {outcome?.newPB && (
        <p className="rounded-xl bg-gold/15 px-3 py-2 font-semibold text-gold">New personal best! (was {outcome.previousBest})</p>
      )}
      {outcome?.achievements.map((a) => (
        <p key={a.title} className="rounded-xl bg-turf/15 px-3 py-2 font-semibold text-turf">🏅 {a.title}</p>
      ))}
      <div className="mt-2 grid w-full gap-2">
        <Link href="/play/train" className="btn-primary">Another one?</Link>
        <Link href="/play" className="btn-ghost">I&apos;m done for now</Link>
      </div>
    </section>
  );
}
