import { asc, and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth";
import { addEvent, deleteEvent } from "@/app/actions/parent";
import { Field, Section } from "@/components/ui";

const TYPES = { match: "Match", training: "Club training", other_sport: "Other sport", rest: "Rest / recovery", event: "Other" } as const;

export default async function Schedule() {
  const { player } = await requireParent();
  const events = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.playerId, player.id), gte(schema.events.startsAt, new Date(Date.now() - 86400000))))
    .orderBy(asc(schema.events.startsAt))
    .limit(60);
  return (
    <div className="flex flex-col gap-4">
      <Section title="Add to the calendar">
        <form action={addEvent} className="grid gap-3 sm:grid-cols-3">
          <Field label="Type">
            <select className="input" name="type">{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
          <div className="sm:col-span-2"><Field label="Title"><input className="input" name="title" required placeholder="e.g. vs Glen Waverley" /></Field></div>
          <Field label="Date"><input className="input" type="date" name="date" required /></Field>
          <Field label="Time"><input className="input" type="time" name="time" defaultValue="09:00" /></Field>
          <Field label="Repeat weekly for" hint="1 = just once"><input className="input" name="repeatWeeks" inputMode="numeric" defaultValue="1" /></Field>
          <div className="sm:col-span-3"><Field label="Location (optional)"><input className="input" name="location" /></Field></div>
          <button className="btn-primary self-start">Add</button>
        </form>
      </Section>
      <Section title="Upcoming">
        {events.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ul className="flex flex-col divide-y divide-line/60 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  <span className="chip mr-2">{TYPES[e.type]}</span>
                  <span className="font-semibold">{e.title}</span>
                  <span className="block text-muted">
                    {e.startsAt.toLocaleString("en-AU", { timeZone: "Australia/Melbourne", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    {e.location ? ` · ${e.location}` : ""}
                  </span>
                </span>
                <form action={deleteEvent.bind(null, e.id)}><button className="text-xs text-muted underline">Remove</button></form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">{player.displayName} sees only the next match or two on his home screen, plus Match Day mode within 2 days of a match.</p>
      </Section>
    </div>
  );
}
