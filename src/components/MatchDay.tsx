"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { saveMatchPrep } from "@/app/actions/match";

const KIT = ["Bat", "Helmet", "Pads", "Gloves", "Box", "Whites / uniform", "Hat & sunscreen", "Water bottle", "Snack"];

const FEELINGS = [
  { key: "really_nervous", label: "Really nervous", calm: true },
  { key: "little_nervous", label: "A little nervous", calm: true },
  { key: "unsure", label: "Unsure", calm: true },
  { key: "comfortable", label: "Comfortable" },
  { key: "confident", label: "Confident" },
  { key: "excited", label: "Excited" },
  { key: "prefer_not", label: "Prefer not to say" },
];

const CALM_FOCUS = ["Enjoy playing with your teammates.", "Watch the ball. That's all.", "Focus on the next ball."];
const GO_FOCUS = ["Trust your shots.", "Commit to your decisions.", "Find your bowling rhythm.", "Watch the ball."];

export default function MatchDay({ eventId, title, battingFocus }: { eventId: string | null; title: string; battingFocus: string | null }) {
  const [kit, setKit] = useState<string[]>([]);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [, start] = useTransition();
  const calm = FEELINGS.find((f) => f.key === feeling)?.calm;
  const pool = calm ? CALM_FOCUS : battingFocus ? [battingFocus, ...GO_FOCUS] : GO_FOCUS;
  const focus = pool[new Date().getDate() % pool.length];

  return (
    <main className="flex flex-col gap-4">
      <header>
        <p className="label text-sky">Match day</p>
        <h1 className="h-display text-3xl">{title}</h1>
      </header>

      <section className="card">
        <p className="label">How are you feeling?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFeeling(f.key);
                const fo = (f.calm ? CALM_FOCUS : GO_FOCUS)[new Date().getDate() % 3];
                start(() => saveMatchPrep(eventId, f.key, fo));
              }}
              className={`choice !px-3 !py-3 text-center !text-base ${feeling === f.key ? "choice-on" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {feeling && (
          <div className="mt-4 rounded-xl bg-turf/10 p-3">
            {calm ? (
              <p>Feeling nervous before a game is totally normal. Lots of top players feel it too. It means you care. There&apos;s nothing you have to prove today.</p>
            ) : (
              <p>Love it. Back yourself and enjoy it!</p>
            )}
          </div>
        )}
      </section>

      <section className="card border-turf/60">
        <p className="label text-turf">Your one focus today</p>
        <p className="mt-1 text-2xl font-bold">“{focus}”</p>
        <p className="mt-1 text-sm text-muted">Just one thing. Everything else, just play.</p>
      </section>

      <section className="card">
        <p className="label">Kit check ({kit.length}/{KIT.length})</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {KIT.map((k) => (
            <button key={k} onClick={() => setKit(kit.includes(k) ? kit.filter((x) => x !== k) : [...kit, k])} className={`choice !px-3 !py-3 !text-base ${kit.includes(k) ? "choice-on" : ""}`}>
              {kit.includes(k) ? "✅" : "⬜"} {k}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <Link href="/play/drill/mobility-flow" className="btn-ghost">5-minute warm-up</Link>
        <Link href="/play/mind/breathe" className="btn-ghost">Calm breathing</Link>
        <Link href="/play/mind" className="btn-ghost">Tough moment? Out, hit for six or a misfield</Link>
        <Link href="/play/match/new" className="btn-ghost">After the game: record it</Link>
      </section>
      <p className="text-center text-sm text-muted">Getting out, a bad ball or a dropped catch happens to every cricketer. Enjoy your cricket!</p>
    </main>
  );
}
