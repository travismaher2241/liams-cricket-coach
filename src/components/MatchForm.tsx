import type { Match, Player } from "@/db/schema";
import { saveMatchParent } from "@/app/actions/parent";
import { ballsToOvers } from "@/lib/stats";
import { Field, Section } from "./ui";

const v = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

export default function MatchForm({ m, player }: { m?: Match; player: Player }) {
  return (
    <form action={saveMatchParent} className="flex flex-col gap-4">
      {m && <input type="hidden" name="id" value={m.id} />}
      <Section title="Match">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Date"><input className="input" type="date" name="matchDate" required defaultValue={m?.matchDate ?? ""} /></Field>
          <Field label="Team"><input className="input" name="team" defaultValue={m?.team ?? player.team ?? ""} /></Field>
          <Field label="Opposition"><input className="input" name="opposition" defaultValue={m?.opposition ?? ""} /></Field>
          <Field label="Competition"><input className="input" name="competition" defaultValue={m?.competition ?? player.competition ?? ""} /></Field>
          <Field label="Season"><input className="input" name="season" defaultValue={m?.season ?? player.season ?? ""} /></Field>
          <Field label="Format"><input className="input" name="format" defaultValue={m?.format ?? ""} placeholder="e.g. 20 overs" /></Field>
          <Field label="Result"><input className="input" name="result" defaultValue={m?.result ?? ""} /></Field>
          {!m && <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="historical" /> Historical record</label>}
        </div>
      </Section>
      <Section title="Batting">
        <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" name="batted" defaultChecked={m?.batted ?? false} /> Batted</label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Runs"><input className="input" name="runs" inputMode="numeric" defaultValue={v(m?.runs)} /></Field>
          <Field label="Balls faced" hint="Blank = unknown"><input className="input" name="balls" inputMode="numeric" defaultValue={v(m?.balls)} /></Field>
          <Field label="Status">
            <select className="input" name="battingStatus" defaultValue={m?.battingStatus ?? ""}>
              <option value="">–</option><option value="out">Out</option><option value="not_out">Not out</option><option value="retired">Retired</option>
            </select>
          </Field>
          <Field label="How out"><input className="input" name="howOut" defaultValue={m?.howOut ?? ""} /></Field>
          <Field label="Fours"><input className="input" name="fours" inputMode="numeric" defaultValue={v(m?.fours)} /></Field>
          <Field label="Sixes"><input className="input" name="sixes" inputMode="numeric" defaultValue={v(m?.sixes)} /></Field>
        </div>
      </Section>
      <Section title="Bowling">
        <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" name="bowled" defaultChecked={m?.bowled ?? false} /> Bowled</label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Overs" hint="e.g. 2.3 for an incomplete over"><input className="input" name="overs" defaultValue={m?.ballsBowled != null ? ballsToOvers(m.ballsBowled) : ""} /></Field>
          <Field label="Runs conceded"><input className="input" name="runsConceded" inputMode="numeric" defaultValue={v(m?.runsConceded)} /></Field>
          <Field label="Wickets"><input className="input" name="wickets" inputMode="numeric" defaultValue={v(m?.wickets)} /></Field>
          <Field label="Maidens"><input className="input" name="maidens" inputMode="numeric" defaultValue={v(m?.maidens)} /></Field>
          <Field label="Wides"><input className="input" name="wides" inputMode="numeric" defaultValue={v(m?.wides)} /></Field>
          <Field label="No-balls"><input className="input" name="noBalls" inputMode="numeric" defaultValue={v(m?.noBalls)} /></Field>
        </div>
      </Section>
      <Section title="Fielding">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Catches"><input className="input" name="catches" inputMode="numeric" defaultValue={v(m?.catches)} /></Field>
          <Field label="Run-outs"><input className="input" name="runOuts" inputMode="numeric" defaultValue={v(m?.runOuts)} /></Field>
          <Field label="Stumpings"><input className="input" name="stumpings" inputMode="numeric" defaultValue={v(m?.stumpings)} /></Field>
        </div>
      </Section>
      <button className="btn-primary self-start">Save match</button>
    </form>
  );
}
