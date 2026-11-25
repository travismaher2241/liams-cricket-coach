import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth";
import { addObservation, deleteObservation } from "@/app/actions/parent";
import { AREA_LABEL } from "@/content/drills";
import { Field, Section } from "@/components/ui";

const KINDS = { observation: "Observation", coach_feedback: "Coach feedback", history: "History / background", circumstance: "Change in circumstances" } as const;

export default async function Notes() {
  const { player } = await requireParent();
  const notes = await db.select().from(schema.observations).where(eq(schema.observations.playerId, player.id)).orderBy(desc(schema.observations.createdAt));
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm text-muted">
        🔒 Private. {player.displayName} can&apos;t see these notes, and they&apos;re never sent to the AI coach or used in any text he reads.
        Tagging an area lets the app quietly lean his activities that way.
      </p>
      <Section title="Add a note">
        <form action={addObservation} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <select className="input" name="kind">
                {Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Area (optional)">
              <select className="input" name="area">
                <option value="">–</option>
                {Object.entries(AREA_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Note">
            <textarea className="input min-h-28" name="body" required placeholder="e.g. Technically sound cover drive but struggles to generate power; relies on hands and wrists rather than whole body." />
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="boost" /> Also raise this area&apos;s priority by one</label>
          <button className="btn-primary self-start">Save note</button>
        </form>
      </Section>
      <Section title={`Notes (${notes.length})`}>
        {notes.length === 0 ? <p className="text-sm text-muted">No notes yet.</p> : (
          <ul className="flex flex-col divide-y divide-line/60">
            {notes.map((n) => (
              <li key={n.id} className="py-3">
                <div className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{KINDS[n.kind]}{n.area ? ` · ${AREA_LABEL[n.area as keyof typeof AREA_LABEL] ?? n.area}` : ""} · {n.createdAt.toLocaleDateString("en-AU")}</span>
                  <form action={deleteObservation.bind(null, n.id)}><button className="underline">Delete</button></form>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
