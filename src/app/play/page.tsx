import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePlayerView } from "@/lib/auth";
import { dailyChallenge, recommend, dateSeed } from "@/lib/recommend";
import { personalBests, recentAchievements, recommendContext, upcomingEvents, pendingReveals } from "@/lib/data";
import { weekKey } from "@/lib/quizEngine";
import { fallbackHello } from "@/lib/coachAI";
import { AREA_LABEL } from "@/content/drills";

export default async function PlayerHome({ searchParams }: { searchParams: Promise<{ skip?: string }> }) {
  const { player, session } = await requirePlayerView();
  if (!player.playerOnboarded && session.role === "player") redirect("/play/welcome");
  const { skip } = await searchParams;

  const ctx = await recommendContext(player);
  const challenge = dailyChallenge(ctx);
  const focusDrill = ctx.programmeTags.length ? recommend(ctx, {}, dateSeed(new Date(), 7))[0] : null;
  const [achs, pbs, events, reveals] = await Promise.all([
    recentAchievements(player.id, 3),
    personalBests(player.id),
    upcomingEvents(player.id, 2),
    pendingReveals(player.id),
  ]);
  const [weeklyDone] = await db
    .select({ id: schema.quizAttempts.id })
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.playerId, player.id), eq(schema.quizAttempts.kind, "weekly"), eq(schema.quizAttempts.weekKey, weekKey(new Date()))));
  const nextMatch = events.find((e) => e.type === "match");
  const matchSoon = nextMatch && nextMatch.startsAt.getTime() - Date.now() < 2 * 86400000;

  return (
    <main className="flex flex-col gap-4">
      <header>
        <p className="label">G&apos;day {player.displayName}</p>
        <h1 className="h-display text-3xl leading-tight">{fallbackHello(dateSeed(new Date()))}</h1>
      </header>

      {reveals.map((r) => (
        <Link key={r.id} href={`/play/reveal/${r.id}`} className="card border-gold bg-gold/10">
          <p className="label text-gold">Something to see</p>
          <p className="mt-1 text-xl font-bold">You&apos;ve unlocked a big achievement 🎉</p>
          <p className="text-sm text-muted">Tap to see what your challenges have been building.</p>
        </Link>
      ))}

      {matchSoon && (
        <Link href={`/play/matchday?event=${nextMatch.id}`} className="card border-sky bg-sky/10">
          <p className="label text-sky">Match day</p>
          <p className="mt-1 text-xl font-bold">{nextMatch.title}</p>
          <p className="text-sm text-muted">Get ready in 2 minutes →</p>
        </Link>
      )}

      {challenge && !skip && (
        <section className="card border-turf/60">
          <p className="label text-turf">Today&apos;s challenge · {challenge.minutes} min</p>
          <h2 className="mt-1 text-2xl font-bold">{challenge.name}</h2>
          <p className="mt-1 text-muted">{challenge.purpose}</p>
          <div className="mt-4 grid gap-2">
            <Link href={`/play/drill/${challenge.id}?challenge=1`} className="btn-primary">
              Let&apos;s go
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/play/train" className="btn-ghost text-base">
                Something else
              </Link>
              <Link href="/play?skip=1" className="btn-ghost text-base">
                Not today
              </Link>
            </div>
          </div>
        </section>
      )}
      {skip && (
        <section className="card">
          <p className="text-lg font-semibold">No worries 👍</p>
          <p className="text-muted">Rest is part of training too. Enjoy your day!</p>
        </section>
      )}

      {focusDrill && (
        <section className="card">
          <p className="label">Your focus</p>
          <p className="mt-1 text-xl font-semibold">“{focusDrill.cues[0]}”</p>
          <p className="text-sm text-muted">{AREA_LABEL[focusDrill.area]}</p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/play/learn" className="card flex flex-col gap-1">
          <span className="text-2xl">🧠</span>
          <span className="font-semibold">{weeklyDone ? "Practice questions" : "Weekly quiz ready"}</span>
          <span className="text-xs text-muted">{weeklyDone ? "Just for fun" : "20 questions, no time limit"}</span>
        </Link>
        <Link href="/play/train?time=5" className="card flex flex-col gap-1">
          <span className="text-2xl">⏱️</span>
          <span className="font-semibold">I&apos;ve got 5 minutes</span>
          <span className="text-xs text-muted">Quick sessions</span>
        </Link>
        <Link href="/play/match/new" className="card flex flex-col gap-1">
          <span className="text-2xl">📝</span>
          <span className="font-semibold">Record a match</span>
          <span className="text-xs text-muted">Stats + how it felt</span>
        </Link>
        <Link href="/play/coach" className="card flex flex-col gap-1">
          <span className="text-2xl">💬</span>
          <span className="font-semibold">Ask the coach</span>
          <span className="text-xs text-muted">Pick what you want</span>
        </Link>
      </div>

      {nextMatch && !matchSoon && (
        <section className="card">
          <p className="label">Next up</p>
          <p className="mt-1 font-semibold">{nextMatch.title}</p>
          <p className="text-sm text-muted">
            {nextMatch.startsAt.toLocaleString("en-AU", { timeZone: "Australia/Melbourne", weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          </p>
        </section>
      )}

      {(achs.length > 0 || pbs.length > 0) && (
        <section className="card">
          <p className="label">Recent wins</p>
          <ul className="mt-2 flex flex-col gap-2">
            {achs.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="text-xl">🏅</span>
                <span>
                  <span className="font-semibold">{a.title}</span>
                  <span className="block text-xs text-muted">{a.detail}</span>
                </span>
              </li>
            ))}
            {pbs.slice(0, 2).map((p) => (
              <li key={p.drillId} className="flex items-center gap-3">
                <span className="text-xl">⭐</span>
                <span>
                  <span className="font-semibold">
                    PB: {p.best} {p.unit}
                  </span>
                  <span className="block text-xs text-muted">{p.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
