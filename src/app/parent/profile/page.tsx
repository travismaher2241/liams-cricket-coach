import { requireParent } from "@/lib/auth";
import { saveProfile, changePin } from "@/app/actions/parent";
import { EQUIPMENT_LABEL, PLACE_LABEL, AREA_LABEL, type Area } from "@/content/drills";
import { Field, Section } from "@/components/ui";

export default async function Profile({ searchParams }: { searchParams: Promise<{ saved?: string; pin?: string; welcome?: string }> }) {
  const sp = await searchParams;
  const { player: p } = await requireParent();
  return (
    <div className="flex flex-col gap-4">
      {sp.welcome && <p className="rounded-xl bg-turf/15 p-3 text-turf">Accounts created! Fill this in so the app can personalise from day one. Write as much as you like.</p>}
      {sp.saved && <p className="rounded-xl bg-turf/15 p-3 text-turf">Saved.</p>}
      <form action={saveProfile} className="flex flex-col gap-4">
        <Section title="About the cricketer">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name"><input className="input" name="displayName" defaultValue={p.displayName} /></Field>
            <Field label="Birth year"><input className="input" name="birthYear" inputMode="numeric" defaultValue={p.birthYear ?? ""} /></Field>
            <Field label="Bats">
              <select className="input" name="battingHand" defaultValue={p.battingHand ?? ""}>
                <option value="">–</option><option>Right-handed</option><option>Left-handed</option>
              </select>
            </Field>
            <Field label="Bowling style"><input className="input" name="bowlingStyle" defaultValue={p.bowlingStyle ?? ""} placeholder="e.g. Right-arm medium" /></Field>
            <Field label="Team"><input className="input" name="team" defaultValue={p.team ?? ""} /></Field>
            <Field label="Competition"><input className="input" name="competition" defaultValue={p.competition ?? ""} placeholder="e.g. Under 12 Saturday" /></Field>
            <Field label="Current season"><input className="input" name="season" defaultValue={p.season ?? ""} placeholder="e.g. 2026/27" /></Field>
            <Field label="Season phase">
              <select className="input" name="seasonPhase" defaultValue={p.seasonPhase}>
                <option value="pre">Pre-season</option><option value="in">In season</option><option value="off">Off season</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Overview (private)">
          <Field label="Tell the app about Liam as a cricketer" hint="Strengths, development opportunities, confidence and anxiety considerations, learning preferences, interests, existing coaching advice, history, other sports. Never shown to Liam.">
            <textarea className="input min-h-48" name="parentOverview" defaultValue={p.parentOverview ?? ""} />
          </Field>
        </Section>

        <Section title="Development priorities">
          <p className="mb-3 text-sm text-muted">Weights how often each area is suggested. 0 = normal, 3 = strong focus.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(AREA_LABEL) as Area[]).map((a) => (
              <Field key={a} label={AREA_LABEL[a]}>
                <select className="input" name={`prio_${a}`} defaultValue={String(p.priorities[a] ?? 0)}>
                  {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Equipment & spaces">
          <p className="label mb-2">Equipment available</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(EQUIPMENT_LABEL).filter(([k]) => k !== "none").map(([k, l]) => (
              <label key={k} className="chip cursor-pointer gap-2 !text-sm !text-ink">
                <input type="checkbox" name="equipment" value={k} defaultChecked={p.equipment.includes(k)} /> {l}
              </label>
            ))}
          </div>
          <p className="label mb-2">Places to train</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PLACE_LABEL).map(([k, l]) => (
              <label key={k} className="chip cursor-pointer gap-2 !text-sm !text-ink">
                <input type="checkbox" name="spaces" value={k} defaultChecked={p.spaces.includes(k)} /> {l}
              </label>
            ))}
          </div>
        </Section>

        <Section title="Safety & limits">
          <Field label="Training and safety limitations" hint="e.g. no hard ball without an adult; limit bowling to 4 overs a day; sore shoulder recovering.">
            <textarea className="input min-h-24" name="safetyNotes" defaultValue={p.safetyNotes ?? ""} />
          </Field>
        </Section>

        <button className="btn-primary self-start">Save profile</button>
      </form>

      <Section title={`${p.displayName}'s PIN`}>
        {sp.pin === "ok" && <p className="mb-2 text-sm text-turf">PIN updated.</p>}
        {sp.pin === "bad" && <p className="mb-2 text-sm text-gold">PIN must be 4 digits.</p>}
        <form action={changePin} className="flex gap-2">
          <input className="input max-w-40" name="pin" inputMode="numeric" maxLength={4} placeholder="New 4-digit PIN" />
          <button className="btn-small">Change PIN</button>
        </form>
      </Section>
    </div>
  );
}
