import Link from "next/link";
import { Suspense } from "react";
import { requirePlayerView } from "@/lib/auth";
import { recommendContext, personalBests } from "@/lib/data";
import { recommend, dateSeed, type RecommendFilter } from "@/lib/recommend";
import { coachLine } from "@/lib/coachAI";
import { AREA_LABEL, DRILLS, type Drill } from "@/content/drills";
import type { Player } from "@/db/schema";

const ASKS = [
  { key: "batting", label: "Improve my batting", icon: "🏏" },
  { key: "bowling", label: "Improve my bowling", icon: "🎯" },
  { key: "fielding", label: "Improve my fielding", icon: "🧤" },
  { key: "athletic", label: "Get stronger and faster", icon: "⚡" },
  { key: "five", label: "I've got five minutes", icon: "⏱️" },
  { key: "learn", label: "Learn something about cricket", icon: "🧠" },
  { key: "fun", label: "Give me a fun challenge", icon: "🎲" },
  { key: "match", label: "Help me prepare for my match", icon: "📅" },
  { key: "confidence", label: "Help me build my confidence", icon: "💪" },
  { key: "different", label: "Try something different", icon: "✨" },
] as const;

type AskKey = (typeof ASKS)[number]["key"];

const FALLBACK: Record<AskKey, string> = {
  batting: "Build on what you're already doing well. Here's a quick one to sharpen your batting.",
  bowling: "Smooth beats rushed. Try this and enjoy finding your rhythm.",
  fielding: "Great fielders love the ball coming to them. This one helps you get there.",
  athletic: "Quick feet and good balance help every part of cricket. Have a go at this.",
  five: "Five minutes counts! Here's something that fits.",
  learn: "Thinking cricketers spot things others miss. Try a few quick questions.",
  fun: "Here's a challenge. Can you set a record today?",
  match: "Keep it simple: watch the ball and enjoy playing with your mates.",
  confidence: "Confidence grows a little at a time. Try this one.",
  different: "Let's try something new. Mistakes are part of learning!",
};

function pick(ask: AskKey, player: Player, ctx: Awaited<ReturnType<typeof recommendContext>>): Drill[] {
  const seed = dateSeed(new Date(), Date.now() % 97);
  const by = (f: RecommendFilter) => recommend(ctx, f, seed).slice(0, 2);
  switch (ask) {
    case "batting":
    case "bowling":
    case "fielding":
    case "athletic":
      return by({ area: ask });
    case "confidence":
      return by({ area: "mental" });
    case "five":
      return by({ maxMinutes: 5 });
    case "fun":
      return recommend(ctx, {}, seed).filter((d) => d.measure).slice(0, 2);
    case "different": {
      const recentIds = ctx.recent.map((r) => r.drillId);
      const fresh = recommend(ctx, { excludeIds: recentIds }, seed);
      return (fresh.length ? fresh : recommend(ctx, {}, seed)).slice(0, 2);
    }
    default:
      return [];
  }
}

async function CoachSays({ ask, player, drills }: { ask: AskKey; player: Player; drills: Drill[] }) {
  const a = player.playerAnswers ?? {};
  // Only player-safe info goes to the AI. Never parent observations.
  const prompt = [
    `The player's name is ${player.displayName}.`,
    a.favCricketer ? `Favourite cricketer: ${a.favCricketer}.` : "",
    a.favShot && a.favShot !== "skip" ? `Favourite shot: ${a.favShot}.` : "",
    a.become && a.become !== "skip" ? `Wants to become: ${a.become}.` : "",
    `They tapped: "${ASKS.find((x) => x.key === ask)!.label}".`,
    drills.length ? `We're suggesting: ${drills.map((d) => `${d.name} (${d.purpose})`).join("; ")}.` : "",
    "Write a short, warm coaching line to go with this suggestion.",
  ]
    .filter(Boolean)
    .join(" ");
  const line = await coachLine(prompt, FALLBACK[ask]);
  return <p className="text-xl font-semibold leading-snug">{line}</p>;
}

export default async function Coach({ searchParams }: { searchParams: Promise<{ ask?: string }> }) {
  const { ask } = await searchParams;
  const { player } = await requirePlayerView();
  const valid = ASKS.find((a) => a.key === ask)?.key;

  if (!valid)
    return (
      <main className="flex flex-col gap-4">
        <h1 className="h-display text-3xl">Coach</h1>
        <p className="text-muted">What would you like to do?</p>
        <div className="grid grid-cols-2 gap-3">
          {ASKS.map((a) => (
            <Link key={a.key} href={`/play/coach?ask=${a.key}`} className="card flex min-h-24 flex-col justify-between gap-2 hover:border-turf/60">
              <span className="text-2xl">{a.icon}</span>
              <span className="font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-muted">Your club coaches know you best. Use this for extra ideas.</p>
      </main>
    );

  const ctx = await recommendContext(player);
  const drills = pick(valid, player, ctx);
  const pbs = valid === "fun" ? await personalBests(player.id) : [];

  return (
    <main className="flex flex-col gap-4">
      <Link href="/play/coach" className="text-sm text-muted">‹ Coach</Link>
      <section className="card border-turf/50">
        <p className="label text-turf">Coach</p>
        <Suspense fallback={<p className="text-xl font-semibold text-muted">Thinking…</p>}>
          <CoachSays ask={valid} player={player} drills={drills} />
        </Suspense>
      </section>

      {drills.map((d) => {
        const pb = pbs.find((p) => p.drillId === d.id);
        return (
          <Link key={d.id} href={`/play/drill/${d.id}`} className="card flex items-center justify-between gap-3">
            <span>
              <span className="label">{AREA_LABEL[d.area]} · {d.minutes} min</span>
              <span className="block text-lg font-semibold">{d.name}</span>
              <span className="block text-sm text-muted">{d.purpose}</span>
              {pb && <span className="mt-1 block text-sm text-gold">Your record: {pb.best} {pb.unit}. Can you match it?</span>}
            </span>
            <span className="text-2xl text-muted">›</span>
          </Link>
        );
      })}

      {valid === "learn" && (
        <div className="grid gap-2">
          <Link href="/play/learn/practice" className="btn-primary">5 quick questions</Link>
          <Link href="/play/learn" className="btn-ghost">See Cricket IQ</Link>
        </div>
      )}
      {valid === "match" && (
        <div className="grid gap-2">
          <Link href="/play/matchday" className="btn-primary">Open Match Day mode</Link>
          <Link href="/play/drill/box-breathing" className="btn-ghost">Calm breathing (2 min)</Link>
        </div>
      )}
      {drills.length === 0 && !["learn", "match"].includes(valid) && (
        <p className="card text-muted">Nothing matches your gear right now. Try {DRILLS.find((d) => d.equipment.includes("none"))?.name}!</p>
      )}
      <Link href={`/play/coach?ask=${valid}&r=${Date.now() % 1000}`} className="btn-ghost text-base">Show me another idea</Link>
    </main>
  );
}
