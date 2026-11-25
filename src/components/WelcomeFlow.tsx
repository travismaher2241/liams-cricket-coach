"use client";
import { useState, useTransition } from "react";
import { OptionQuestion, Progress, opts } from "./Stepper";
import { savePlayerOnboarding } from "@/app/actions/player";

const QS: { key: string; title: string; options: string[] }[] = [
  { key: "prefers", title: "What do you love most?", options: ["Batting", "Bowling", "Fielding", "All of it!"] },
  { key: "favShot", title: "Favourite shot?", options: ["Cover drive", "Straight drive", "Pull shot", "Cut shot", "Sweep", "Defence!"] },
  { key: "enjoy", title: "Best thing about cricket?", options: ["Hanging out with my team", "Hitting big shots", "Taking wickets", "Taking catches", "Winning", "Learning new skills"] },
  { key: "become", title: "What kind of cricketer do you want to be?", options: ["A big-hitting batter", "A solid, reliable batter", "A fast bowler", "A spin bowler", "An all-rounder", "A gun fielder", "Not sure yet"] },
  { key: "activities", title: "What kind of practice is most fun?", options: ["Challenges and records", "Games with someone", "Learning skills slowly", "Quick and active", "A bit of everything"] },
];

export default function WelcomeFlow({ name }: { name: string }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fav, setFav] = useState("");
  const [pending, start] = useTransition();
  const total = QS.length + 2;

  if (step === -1)
    return (
      <div className="flex flex-col gap-5 pt-10">
        <div className="text-5xl">🏏</div>
        <h1 className="h-display text-4xl">Welcome, {name}!</h1>
        <p className="text-lg text-muted">This is your own cricket app. Quick challenges, cricket brain teasers, and a record of everything you achieve.</p>
        <p className="text-lg">A few quick taps and you&apos;re in.</p>
        <button className="btn-primary" onClick={() => setStep(0)}>
          Let&apos;s go
        </button>
      </div>
    );

  if (step === 0)
    return (
      <div className="flex flex-col gap-4 pt-4">
        <Progress step={0} total={total} />
        <h2 className="text-2xl font-bold">Who&apos;s your favourite cricketer?</h2>
        <input className="input text-lg" value={fav} onChange={(e) => setFav(e.target.value)} placeholder="Type a name (optional)" maxLength={40} />
        <button className="btn-primary" onClick={() => { setAnswers({ ...answers, favCricketer: fav }); setStep(1); }}>
          {fav ? "Next" : "Skip"}
        </button>
      </div>
    );

  if (step <= QS.length) {
    const q = QS[step - 1];
    return (
      <div className="flex flex-col gap-4 pt-4">
        <Progress step={step} total={total} />
        <OptionQuestion
          title={q.title}
          options={opts(q.options)}
          onPick={(v) => {
            setAnswers({ ...answers, [q.key]: v });
            setStep(step + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <Progress step={total - 1} total={total} />
      <h2 className="text-2xl font-bold">One last thing</h2>
      <div className="card flex flex-col gap-2 text-base">
        <p>👨‍👦 Your parent helps set up the app so your challenges suit you. They add info from your coaches too.</p>
        <p>👀 Your parent can see your match notes and reflections, so they can help you.</p>
        <p>🙌 You can always skip a question, change an activity, or have a day off. No pressure, ever.</p>
      </div>
      <button className="btn-primary" disabled={pending} onClick={() => start(() => savePlayerOnboarding(answers))}>
        {pending ? "Getting ready…" : "Got it, let's play!"}
      </button>
    </div>
  );
}
