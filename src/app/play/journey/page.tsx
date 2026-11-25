import Link from "next/link";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePlayerView } from "@/lib/auth";
import { battingStats, bowlingStats, fieldingStats, fmt } from "@/lib/stats";
import { personalBests, weekSummary } from "@/lib/data";
import { levelName } from "@/content/quiz";
import { AREA_LABEL, type Area } from "@/content/drills";

const TABS = [
  { k: "week", l: "This week" },
  { k: "stats", l: "Stats" },
  { k: "awards", l: "Awards" },
  { k: "story", l: "My story" },
];

function Stat({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3 text-center">
      <p className="text-2xl font-bold">{v}</p>
      <p className="text-xs text-muted">{l}</p>
    </div>
  );
}

export default async function Journey({ searchParams }: { searchParams: Promise<{ tab?: string; season?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "week";
  const { player } = await requirePlayerView();

  const tabs = (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {TABS.map((t) => (
        <Link key={t.k} href={`/play/journey?tab=${t.k}`} className={`btn-small whitespace-nowrap ${tab === t.k ? "!bg-turf !text-pitch" : ""}`}>
          {t.l}
        </Link>
      ))}
    </div>
  );

  let body: React.ReactNode = null;

  if (tab === "week") {
    const w = await weekSummary(player.id);
    body = (
      <section className="flex flex-col gap-3">
        <div className="card">
          <p className="label">Your week so far</p>
          {w.sessions + w.quizzes.length + w.matches.length === 0 ? (
            <p className="mt-1 text-lg">A fresh week! Anything you do counts. Even two minutes.</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Stat v={w.sessions} l="quick sessions" />
              <Stat v={w.minutes} l="minutes" />
              <Stat v={w.matches.length} l={w.matches.length === 1 ? "match" : "matches"} />
            </div>
          )}
        </div>
        {w.areas.length > 0 && (
          <div className="card">
            <p className="label">You worked on</p>
            <p className="mt-1 text-lg">{w.areas.map((a) => AREA_LABEL[a as Area]).join(" · ")}</p>
          </div>
        )}
        {w.loved.length > 0 && (
          <div className="card">
            <p className="label">You loved</p>
            <p className="mt-1 text-lg">{w.loved.join(" · ")}</p>
          </div>
        )}
        {w.quizzes.filter((q) => q.kind === "weekly").map((q) => (
          <div key={q.id} className="card">
            <p className="label">Cricket IQ</p>
            <p className="mt-1 text-lg">Weekly quiz done{q.levelUp ? " and a new level unlocked! 🚀" : " ✅"}</p>
          </div>
        ))}
        {w.achievements.map((a) => (
          <div key={a.id} className="card flex items-center gap-3">
            <span className="text-2xl">🏅</span>
            <span><span className="font-semibold">{a.title}</span><span className="block text-sm text-muted">{a.detail}</span></span>
          </div>
        ))}
      </section>
    );
  }

  if (tab === "stats") {
    const all = await db.select().from(schema.matches).where(eq(schema.matches.playerId, player.id)).orderBy(desc(schema.matches.matchDate));
    const seasons = [...new Set(all.map((m) => m.season).filter(Boolean))] as string[];
    const ms = sp.season ? all.filter((m) => m.season === sp.season) : all;
    const b = battingStats(ms);
    const w = bowlingStats(ms);
    const f = fieldingStats(ms);
    body = (
      <section className="flex flex-col gap-3">
        {seasons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href="/play/journey?tab=stats" className={`btn-small ${!sp.season ? "!bg-turf !text-pitch" : ""}`}>Career</Link>
            {seasons.map((s) => (
              <Link key={s} href={`/play/journey?tab=stats&season=${encodeURIComponent(s)}`} className={`btn-small ${sp.season === s ? "!bg-turf !text-pitch" : ""}`}>{s}</Link>
            ))}
          </div>
        )}
        {ms.length === 0 ? (
          <div className="card">
            <p className="text-lg">No matches recorded yet.</p>
            <Link href="/play/match/new" className="btn-primary mt-3 w-full">Record a match</Link>
          </div>
        ) : (
          <>
            <div className="card">
              <p className="label">Batting</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Stat v={b.runs} l="runs" />
                <Stat v={b.highest ? `${b.highest.runs}${b.highest.notOut ? "*" : ""}` : "–"} l="highest" />
                <Stat v={fmt(b.average, 1)} l="average" />
                <Stat v={b.innings} l="innings" />
                <Stat v={b.notOuts} l="not outs" />
                <Stat v={fmt(b.strikeRate, 0)} l="strike rate" />
                <Stat v={b.fours ?? "–"} l="fours" />
                <Stat v={b.sixes ?? "–"} l="sixes" />
                <Stat v={b.matches} l="matches" />
              </div>
            </div>
            <div className="card">
              <p className="label">Bowling</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Stat v={w.wickets} l="wickets" />
                <Stat v={w.best ? `${w.best.wickets}/${w.best.runs}` : "–"} l="best" />
                <Stat v={w.overs} l="overs" />
                <Stat v={fmt(w.economy)} l="economy" />
                <Stat v={fmt(w.average, 1)} l="average" />
                <Stat v={w.maidens ?? "–"} l="maidens" />
              </div>
            </div>
            <div className="card">
              <p className="label">Fielding</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Stat v={f.catches} l="catches" />
                <Stat v={f.runOuts} l="run outs" />
                <Stat v={f.stumpings} l="stumpings" />
              </div>
            </div>
            <div className="card">
              <p className="label">Matches</p>
              <ul className="mt-2 divide-y divide-line/60">
                {ms.map((m) => (
                  <li key={m.id} className="py-2 text-sm">
                    <span className="font-semibold">{m.opposition ? `vs ${m.opposition}` : "Match"}</span>
                    <span className="text-muted"> · {new Date(m.matchDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="block text-muted">
                      {m.batted && m.runs !== null ? `${m.runs}${m.battingStatus !== "out" ? "*" : ""} runs` : "Didn't bat"}
                      {m.bowled && m.ballsBowled !== null ? ` · ${m.wickets ?? 0}/${m.runsConceded ?? "?"}` : ""}
                      {(m.catches ?? 0) > 0 ? ` · ${m.catches} ct` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">* = not out. “–” means we don&apos;t know yet, not zero.</p>
            </div>
          </>
        )}
      </section>
    );
  }

  if (tab === "awards") {
    const achs = await db.select().from(schema.achievements).where(eq(schema.achievements.playerId, player.id)).orderBy(desc(schema.achievements.earnedAt));
    const pbs = await personalBests(player.id);
    const cats = [
      ["match", "Match"],
      ["development", "Training"],
      ["iq", "Cricket IQ"],
      ["confidence", "Courage & teamwork"],
    ] as const;
    body = (
      <section className="flex flex-col gap-3">
        <div className="card">
          <p className="label">Cricket IQ</p>
          <p className="mt-1 text-lg font-semibold">Level {player.quizLevel}: {levelName(player.quizLevel)}</p>
        </div>
        {pbs.length > 0 && (
          <div className="card">
            <p className="label">Personal bests</p>
            <ul className="mt-2 flex flex-col gap-1">
              {pbs.map((p) => (
                <li key={p.drillId} className="flex justify-between gap-2">
                  <span>{p.label}</span>
                  <span className="font-bold text-gold">{p.best} {p.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {cats.map(([k, l]) => {
          const list = achs.filter((a) => a.category === k);
          if (!list.length) return null;
          return (
            <div key={k} className="card">
              <p className="label">{l}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {list.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span className="text-xl">🏅</span>
                    <span><span className="font-semibold">{a.title}</span><span className="block text-xs text-muted">{a.detail}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {achs.length === 0 && <p className="card text-muted">Your awards will appear here. Your first quick session earns one!</p>}
      </section>
    );
  }

  if (tab === "story") {
    const progs = await db
      .select()
      .from(schema.programmes)
      .where(and(eq(schema.programmes.playerId, player.id), eq(schema.programmes.status, "completed"), isNotNull(schema.programmes.revealedAt)));
    const achs = await db.select().from(schema.achievements).where(eq(schema.achievements.playerId, player.id));
    const ms = await db.select().from(schema.matches).where(eq(schema.matches.playerId, player.id));
    type Item = { at: Date; icon: string; text: string };
    const items: Item[] = [
      ...progs.map((p) => ({ at: p.completedAt!, icon: "🏆", text: `Completed a development block: ${p.title}` })),
      ...achs.map((a) => ({ at: a.earnedAt, icon: "🏅", text: a.title })),
      ...ms.map((m) => ({ at: new Date(m.matchDate), icon: "🏏", text: `Played${m.opposition ? ` vs ${m.opposition}` : " a match"}${m.team ? ` for ${m.team}` : ""}` })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());
    body = (
      <section className="card">
        <p className="label">My cricket story</p>
        {items.length === 0 ? (
          <p className="mt-2 text-muted">Your story starts with your first activity!</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-3 border-l-2 border-line pl-4">
            {items.slice(0, 60).map((it, i) => (
              <li key={i}>
                <p className="text-xs text-muted">{it.at.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
                <p>{it.icon} {it.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <h1 className="h-display text-3xl">My Journey</h1>
      {tabs}
      {body}
    </main>
  );
}

