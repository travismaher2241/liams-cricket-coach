import { listActivities, listMatchPreps, listMatches, listReflections } from "@/db/repo";
import { requireParent } from "@/lib/auth";
import { comfortScore, WINS, WORRIES, Q_BY_ID } from "@/content/reflection";
import { Bar, Section } from "@/components/ui";

const GROUPS: [string, string[]][] = [
  ["Enjoyment", ["enjoy"]],
  ["Before / during the game", ["before", "during", "pressure"]],
  ["Batting comfort", ["bat_waiting", "bat_out_worry", "bat_comfort", "bat_freely", "bat_commit", "bat_ball", "bat_reset"]],
  ["Bowling comfort", ["bowl_before", "bowl_bad_worry", "bowl_hit_worry", "bowl_freely", "bowl_reset", "bowl_action"]],
  ["Fielding comfort", ["field_ball", "field_drop_worry", "field_move", "field_reset"]],
  ["Feelings about performance", ["performance"]],
];

export default async function Wellbeing() {
  const { player } = await requireParent();
  const [refls, matches, preps, acts] = await Promise.all([
    listReflections(player.id),
    listMatches(player.id),
    listMatchPreps(player.id),
    listActivities(player.id),
  ]);
  const byId = new Map(matches.map((m) => [m.id, m]));
  const rows = refls
    .flatMap((r) => (byId.has(r.matchId) ? [{ r, m: byId.get(r.matchId)! }] : []))
    .sort((a, b) => a.m.matchDate.localeCompare(b.m.matchDate));

  const worryCount = new Map<string, number>();
  const winCount = new Map<string, number>();
  for (const { r } of rows) {
    for (const w of r.worries ?? []) worryCount.set(w, (worryCount.get(w) ?? 0) + 1);
    for (const w of r.wins ?? []) winCount.set(w, (winCount.get(w) ?? 0) + 1);
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const actConf = avg(acts.map((a) => a.confidence).filter((x): x is number => x !== null).map((x) => (x - 1) / 2));
  const actFun = avg(acts.map((a) => a.enjoyment).filter((x): x is number => x !== null).map((x) => (x - 1) / 2));

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm text-muted">
        Self-reported feelings from match reflections and activity feedback. These are patterns to notice and talk about gently, not clinical or diagnostic measures.
        Scores run from 0 (least comfortable) to 1 (most comfortable). Skipped and &quot;Not sure&quot; answers are left out. If you see sustained distress, consider talking with his coach or a health professional.
      </p>
      <Section title="By match">
        {rows.length === 0 ? <p className="text-sm text-muted">No reflections yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr><th className="py-1 pr-3">Match</th>{GROUPS.map(([g]) => <th key={g} className="pr-3">{g}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map(({ r, m }) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{m.matchDate}{m.opposition ? ` v ${m.opposition}` : ""}</td>
                    {GROUPS.map(([g, ids]) => {
                      const v = avg(ids.map((id) => (r.answers[id] ? comfortScore(id, r.answers[id]) : null)).filter((x): x is number => x !== null));
                      return <td key={g} className="pr-3 min-w-20">{v === null ? <span className="text-muted">–</span> : <><Bar value={v} /><span className="text-xs text-muted">{v.toFixed(2)}</span></>}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Things on his mind (when asked)">
          {worryCount.size === 0 ? <p className="text-sm text-muted">Nothing recorded yet.</p> : (
            <ul className="text-sm">{[...worryCount].sort((a, b) => b[1] - a[1]).map(([k, n]) => <li key={k}>{WORRIES.find((w) => w.key === k)?.label ?? k}: {n}</li>)}</ul>
          )}
        </Section>
        <Section title="Personal wins he noticed">
          {winCount.size === 0 ? <p className="text-sm text-muted">Nothing recorded yet.</p> : (
            <ul className="text-sm">{[...winCount].sort((a, b) => b[1] - a[1]).map(([k, n]) => <li key={k}>{WINS.find((w) => w.key === k)?.label ?? k}: {n}</li>)}</ul>
          )}
        </Section>
        <Section title="Training feel">
          <p className="text-sm">Confidence after activities: {actConf === null ? "–" : actConf.toFixed(2)}</p>
          {actConf !== null && <Bar value={actConf} />}
          <p className="mt-2 text-sm">Enjoyment of activities: {actFun === null ? "–" : actFun.toFixed(2)}</p>
          {actFun !== null && <Bar value={actFun} tone="gold" />}
        </Section>
        <Section title="Match day check-ins">
          {preps.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
            <ul className="text-sm">{preps.slice(-10).reverse().map((p) => <li key={p.id}>{p.createdAt.toLocaleDateString("en-AU")}: {p.feeling?.replace(/_/g, " ")}</li>)}</ul>
          )}
        </Section>
      </div>
      <p className="text-xs text-muted">Questions asked: {Object.keys(Q_BY_ID).length} in the bank, 6–10 per match, rotated.</p>
    </div>
  );
}
