import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth";
import { battingStats, bowlingStats, fieldingStats, fmt, ballsToOvers } from "@/lib/stats";
import { Section } from "@/components/ui";

export default async function Matches({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const { player } = await requireParent();
  const ms = await db.select().from(schema.matches).where(eq(schema.matches.playerId, player.id)).orderBy(desc(schema.matches.matchDate));
  const b = battingStats(ms), w = bowlingStats(ms), f = fieldingStats(ms);
  return (
    <div className="flex flex-col gap-4">
      {saved && <p className="rounded-xl bg-turf/15 p-3 text-turf">Saved.</p>}
      <Section title="Career summary" aside={<Link href="/parent/matches/new" className="btn-small">Add match / history</Link>}>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <p><b>Batting:</b> {b.innings} inns, {b.runs} runs, HS {b.highest ? `${b.highest.runs}${b.highest.notOut ? "*" : ""}` : "–"}, avg {fmt(b.average)}, SR {fmt(b.strikeRate, 1)}, {b.notOuts} NO, {b.ducks} ducks</p>
          <p><b>Bowling:</b> {w.overs} ov, {w.wickets} wkts, best {w.best ? `${w.best.wickets}/${w.best.runs}` : "–"}, avg {fmt(w.average)}, econ {fmt(w.economy)}, SR {fmt(w.strikeRate, 1)}</p>
          <p><b>Fielding:</b> {f.catches} ct, {f.runOuts} RO, {f.stumpings} st</p>
        </div>
        <p className="mt-2 text-xs text-muted">Averages use dismissals only (retired counts as not out). Strike rate uses only innings where balls faced is known.</p>
      </Section>
      <Section title={`Matches (${ms.length})`}>
        {ms.length === 0 ? <p className="text-sm text-muted">No matches yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr><th className="py-1 pr-2">Date</th><th className="pr-2">Opposition</th><th className="pr-2">Bat</th><th className="pr-2">Bowl</th><th className="pr-2">Field</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {ms.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-2 whitespace-nowrap">{m.matchDate}</td>
                    <td className="pr-2">{m.opposition ?? "–"}{m.isHistorical && <span className="chip ml-1">hist</span>}</td>
                    <td className="pr-2">{m.batted ? `${m.runs ?? "?"}${m.battingStatus !== "out" ? "*" : ""}${m.balls != null ? ` (${m.balls})` : ""}` : "–"}</td>
                    <td className="pr-2">{m.bowled && m.ballsBowled != null ? `${ballsToOvers(m.ballsBowled)}-${m.runsConceded ?? "?"}-${m.wickets ?? 0}` : "–"}</td>
                    <td className="pr-2">{(m.catches ?? 0) + (m.runOuts ?? 0) + (m.stumpings ?? 0) || "–"}</td>
                    <td><Link href={`/parent/matches/${m.id}`} className="underline">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
