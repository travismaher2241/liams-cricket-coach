import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth";
import { personalBests } from "@/lib/data";
import { DRILL_BY_ID, AREA_LABEL } from "@/content/drills";
import { Section } from "@/components/ui";

const face = (n: number | null, set: string[]) => (n ? set[n - 1] : "–");

export default async function Activity() {
  const { player } = await requireParent();
  const acts = await db.select().from(schema.activities).where(eq(schema.activities.playerId, player.id)).orderBy(desc(schema.activities.completedAt)).limit(100);
  const pbs = await personalBests(player.id);
  const total = acts.reduce((a, b) => a + b.minutes, 0);
  const byDrill = new Map<string, { n: number; fun: number[] }>();
  for (const a of acts) {
    const e = byDrill.get(a.drillId) ?? { n: 0, fun: [] };
    e.n++;
    if (a.enjoyment) e.fun.push(a.enjoyment);
    byDrill.set(a.drillId, e);
  }
  const ranked = [...byDrill].map(([id, e]) => ({ id, n: e.n, fun: e.fun.length ? e.fun.reduce((x, y) => x + y, 0) / e.fun.length : null }));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Assessments & personal bests">
          {pbs.length === 0 ? <p className="text-sm text-muted">Measured activities (catches in 60s, target throws, sprints…) appear here once logged.</p> : (
            <table className="w-full text-sm"><thead className="text-left text-muted"><tr><th>Activity</th><th>First</th><th>Best</th><th>Tries</th></tr></thead>
              <tbody>{pbs.map((p) => <tr key={p.drillId}><td className="py-1">{p.label}</td><td>{p.first}</td><td className="font-bold text-gold">{p.best} {p.unit}</td><td>{p.attempts}</td></tr>)}</tbody>
            </table>
          )}
          <p className="mt-2 text-xs text-muted">Normal day-to-day variation is expected. Look at trends over weeks.</p>
        </Section>
        <Section title="Preferences">
          <p className="text-sm">Last 100 sessions: {acts.length} · {total} minutes</p>
          <p className="label mt-3">Most enjoyed</p>
          <ul className="text-sm">{ranked.filter((r) => r.fun !== null).sort((a, b) => b.fun! - a.fun!).slice(0, 5).map((r) => <li key={r.id}>{DRILL_BY_ID[r.id]?.name} ({r.fun!.toFixed(1)}/3)</li>)}</ul>
          <p className="label mt-3">Found challenging</p>
          <ul className="text-sm">{acts.filter((a) => a.difficulty === 3).slice(0, 5).map((a) => <li key={a.id}>{DRILL_BY_ID[a.drillId]?.name}</li>)}</ul>
        </Section>
      </div>
      <Section title="Recent activity">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="py-1 pr-2">When</th><th className="pr-2">Activity</th><th className="pr-2">Min</th><th className="pr-2">Feel</th><th className="pr-2">Fun</th><th className="pr-2">Conf.</th><th className="pr-2">Result</th></tr></thead>
            <tbody className="divide-y divide-line/60">
              {acts.map((a) => {
                const d = DRILL_BY_ID[a.drillId];
                return (
                  <tr key={a.id}>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{a.completedAt.toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short" })}</td>
                    <td className="pr-2">{d?.name ?? a.drillId} <span className="text-muted">{d ? AREA_LABEL[d.area] : ""}</span>{a.isChallenge && <span className="chip ml-1">daily</span>}{a.discomfort && <span className="chip ml-1 !text-gold">sore</span>}</td>
                    <td className="pr-2">{a.minutes}</td>
                    <td className="pr-2">{face(a.difficulty, ["easy", "ok", "hard"])}</td>
                    <td className="pr-2">{face(a.enjoyment, ["meh", "good", "loved"])}</td>
                    <td className="pr-2">{face(a.confidence, ["unsure", "ok", "strong"])}</td>
                    <td className="pr-2">{a.result ?? "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
