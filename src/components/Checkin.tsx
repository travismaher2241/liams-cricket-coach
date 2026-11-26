"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { saveCheckin } from "@/app/actions/player";
import { CHECKIN_AREAS, CHECKIN_FEELINGS, CHECKIN_PROUD } from "@/content/mind";

/** After-training check-in: three taps and an optional note. Every question can be skipped. */
export default function Checkin({ slotId, title }: { slotId: string; title: string }) {
  const [step, setStep] = useState(0);
  const [feeling, setFeeling] = useState<number | null>(null);
  const [worked, setWorked] = useState<string[]>([]);
  const [proud, setProud] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const toggle = (xs: string[], x: string) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const next = () => setStep(step + 1);
  const skip = <button onClick={next} className="btn-ghost text-base">Skip</button>;

  if (step === 0)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">How was {title.toLowerCase()}?</h2>
        <div className="grid grid-cols-2 gap-2">
          {CHECKIN_FEELINGS.map((f) => (
            <button key={f.v} onClick={() => { setFeeling(f.v); next(); }} className="choice !py-4 text-center">
                            {f.label}
            </button>
          ))}
        </div>
        {feeling === null && skip}
      </section>
    );

  if (step === 1)
    return (
      <section className="flex flex-col gap-3">
        {feeling === 1 && <p className="rounded-xl bg-turf/10 p-3">Tough sessions happen to everyone. Turning up and having a go is what counts.</p>}
        <h2 className="text-2xl font-bold">What did you work on?</h2>
        <p className="text-muted">Tap all that fit.</p>
        <div className="grid grid-cols-2 gap-2">
          {CHECKIN_AREAS.map((a) => (
            <button key={a} onClick={() => setWorked(toggle(worked, a))} className={`choice !px-3 !py-3 text-center !text-base ${worked.includes(a) ? "choice-on" : ""}`}>{a}</button>
          ))}
        </div>
        <button onClick={next} className="btn-primary">{worked.length ? "Next" : "Skip"}</button>
      </section>
    );

  if (step === 2)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Anything you&apos;re proud of?</h2>
        <div className="grid gap-2">
          {CHECKIN_PROUD.map((a) => (
            <button key={a} onClick={() => setProud(toggle(proud, a))} className={`choice !py-3 ${proud.includes(a) ? "choice-on" : ""}`}>{a}</button>
          ))}
        </div>
        <button onClick={next} className="btn-primary">{proud.length ? "Next" : "Skip"}</button>
      </section>
    );

  if (step === 3)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Anything else? <span className="text-muted">(optional)</span></h2>
        <textarea className="input min-h-28 text-lg" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="A drill you liked, something the coach said…" />
        <button
          disabled={pending}
          onClick={() => start(async () => { await saveCheckin({ slotId, feeling, worked, proud, note }); setStep(4); })}
          className="btn-primary"
        >
          Save
        </button>
      </section>
    );

  return (
    <section className="card border-turf/60 bg-turf/10 text-center">
      
      <p className="mt-2 text-2xl font-bold">Nice work today!</p>
      <p className="mt-1 text-muted">{proud.length ? `${proud[0]}: that's worth remembering.` : "Every session counts."}</p>
      <Link href="/play" className="btn-primary mt-4 w-full">Done</Link>
    </section>
  );
}
