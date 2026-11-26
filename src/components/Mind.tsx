"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { markLessonDone, setMindWord } from "@/app/actions/player";
import type { Lesson } from "@/content/mind";

/** One short screen at a time, big Next button. */
export function LessonRunner({ lesson, word }: { lesson: Lesson; word: string | null }) {
  const [i, setI] = useState(0);
  const [, start] = useTransition();
  const last = i === lesson.steps.length;
  useEffect(() => {
    if (last) start(() => markLessonDone(lesson.id));
  }, [last, lesson.id]);
  if (last) {
    return (
      <section className="card border-turf/60 bg-turf/10">
        <p className="label text-turf">Remember</p>
        <p className="mt-2 text-2xl font-bold leading-snug">“{lesson.takeaway}”</p>
        {lesson.id === "between-balls" && word && <p className="mt-2 text-muted">Your word: <span className="font-semibold text-ink">{word}</span></p>}
        <div className="mt-4 grid gap-2">
          <Link href="/play/mind" className="btn-primary">Done 👍</Link>
          <button onClick={() => setI(0)} className="btn-ghost text-base">Read it again</button>
        </div>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-1.5" aria-hidden>
        {lesson.steps.map((_, k) => (
          <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-turf" : "bg-line"}`} />
        ))}
      </div>
      <div className="card min-h-44">
        <p className="text-xl leading-relaxed">{lesson.steps[i]}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} className="btn-ghost text-base">Back</button>
        <button onClick={() => setI(i + 1)} className="btn-primary col-span-2">Next</button>
      </div>
    </section>
  );
}

/** Breathe in for 4, out for 6. Three rounds by default. */
export function Breathe({ rounds = 3, onDone }: { rounds?: number; onDone?: () => void }) {
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0); // seconds elapsed
  const total = rounds * 10;
  useEffect(() => {
    if (!running) return;
    if (t >= total) {
      setRunning(false);
      onDone?.();
      return;
    }
    const h = setTimeout(() => setT(t + 1), 1000);
    return () => clearTimeout(h);
  }, [running, t, total, onDone]);
  const inRound = t % 10;
  const breathingIn = inRound < 4;
  const count = breathingIn ? 4 - inRound : 10 - inRound;
  const finished = !running && t >= total;
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div
        className="flex items-center justify-center rounded-full bg-turf/20 border-2 border-turf text-center transition-all ease-in-out"
        style={{
          width: running ? (breathingIn ? 200 : 110) : 150,
          height: running ? (breathingIn ? 200 : 110) : 150,
          transitionDuration: running ? (breathingIn ? "4s" : "6s") : "0.5s",
        }}
      >
        <span className="text-lg font-semibold">
          {finished ? "Nice 😌" : running ? (<>{breathingIn ? "Breathe in" : "Breathe out"}<br /><span className="text-3xl">{count}</span></>) : "Ready?"}
        </span>
      </div>
      {!running && (
        <button onClick={() => { setT(0); setRunning(true); }} className="btn-primary w-full">
          {finished ? "Go again" : "Start"}
        </button>
      )}
      {running && <p className="text-sm text-muted">Round {Math.floor(t / 10) + 1} of {rounds}</p>}
    </div>
  );
}

export function WordPicker({ words, current }: { words: string[]; current: string | null }) {
  const [w, setW] = useState(current);
  const [, start] = useTransition();
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {words.map((x) => (
        <button
          key={x}
          onClick={() => {
            setW(x);
            start(() => setMindWord(x));
          }}
          className={`choice !px-3 !py-3 text-center !text-base ${w === x ? "choice-on" : ""}`}
        >
          {x}
        </button>
      ))}
    </div>
  );
}

/** The walk-back reset, step by step. */
export function ResetFlow({ word }: { word: string | null }) {
  const steps = [
    { big: "That's OK.", small: "Every batter gets out. Even the best in the world. You had a go." },
    { big: "One big breath", small: "In through your nose for 4… out through your mouth for 6." },
    { big: "“Next time.”", small: "Say it to yourself. That innings is finished. The next one is brand new." },
    { big: "Cheer your mates", small: "Pads off, then clap your teammates on. Being a great teammate counts just as much." },
    { big: "One good thing", small: "Think of one thing you did well today. A good shot, a good leave, running hard. There's always something." },
  ];
  const [i, setI] = useState(0);
  const s = steps[i];
  return (
    <section className="flex flex-col gap-4">
      <div className="card min-h-48 text-center">
        <p className="h-display text-3xl">{s.big}</p>
        <p className="mt-3 text-lg text-muted">{s.small}</p>
        {i === 2 && word && <p className="mt-3 text-sm">Then your word: <span className="font-semibold">{word}</span></p>}
      </div>
      {i < steps.length - 1 ? (
        <button onClick={() => setI(i + 1)} className="btn-primary">Next</button>
      ) : (
        <div className="grid gap-2">
          <Link href="/play" className="btn-primary">I&apos;m good 👍</Link>
          <button onClick={() => setI(0)} className="btn-ghost text-base">Start again</button>
        </div>
      )}
    </section>
  );
}
