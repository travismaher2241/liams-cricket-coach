import { listProgrammes } from "@/db/repo";
import { requireParent } from "@/lib/auth";
import { programmeProgress } from "@/lib/data";
import { startProgramme, setProgrammeStatus, deleteProgramme } from "@/app/actions/parent";
import { PROGRAMME_TEMPLATES } from "@/content/programmes";
import { DRILLS } from "@/content/drills";
import { Bar, Field, Section } from "@/components/ui";

export default async function Programmes() {
  const { player } = await requireParent();
  const progs = await listProgrammes(player.id);
  const prog = await programmeProgress(player.id);
  const active = progs.filter((p) => p.status !== "completed");
  const done = progs.filter((p) => p.status === "completed");
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm text-muted">
        Programmes are hidden from {player.displayName}. He just gets small activities that lean towards the focus. Progress counts sessions, not dates,
        so busy weeks and rest don&apos;t matter. When it&apos;s complete he gets a celebration showing only real numbers (activities, minutes, PBs).
        Running 1–2 at a time works best.
      </p>
      {active.map((p) => {
        const pr = prog.get(p.id) ?? { sessions: 0, minutes: 0 };
        const drills = DRILLS.filter((d) => d.tags.some((t) => p.focusTags.includes(t))).map((d) => d.name);
        const weeks = Math.max(1, Math.round((Date.now() - p.startedAt.getTime()) / (7 * 86400000)));
        return (
          <Section key={p.id} title={p.title} aside={<span className="chip">{p.status}</span>}>
            <p className="text-sm">{p.purpose}</p>
            <div className="mt-3 flex justify-between text-sm text-muted">
              <span>{pr.sessions} of {p.targetSessions} sessions · {pr.minutes} min</span>
              <span>Week {weeks} of ~{p.plannedWeeks}</span>
            </div>
            <Bar value={pr.sessions} max={p.targetSessions} />
            {p.parentNotes && <p className="mt-2 text-sm text-muted">Notes: {p.parentNotes}</p>}
            <p className="mt-2 text-xs text-muted">Activities it draws on: {drills.join(", ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.status === "active" ? (
                <form action={setProgrammeStatus.bind(null, p.id, "paused")}><button className="btn-small">Pause</button></form>
              ) : (
                <form action={setProgrammeStatus.bind(null, p.id, "active")}><button className="btn-small">Resume</button></form>
              )}
              <form action={setProgrammeStatus.bind(null, p.id, "completed")}><button className="btn-small">Mark complete (shows reveal)</button></form>
              <form action={deleteProgramme.bind(null, p.id)}><button className="btn-small text-muted">Remove</button></form>
            </div>
          </Section>
        );
      })}

      <Section title="Start a programme">
        <form action={startProgramme} className="grid gap-3 sm:grid-cols-2">
          <Field label="Focus">
            <select className="input" name="template">
              {PROGRAMME_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.title} (~{t.weeks} wks, {t.targetSessions} sessions)</option>)}
            </select>
          </Field>
          <Field label="Sessions to complete (optional)" hint="Leave blank for the default.">
            <input className="input" name="targetSessions" inputMode="numeric" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Why (private)"><input className="input" name="parentNotes" placeholder="e.g. Coach says he needs more power through the off side" /></Field>
          </div>
          <button className="btn-primary self-start">Start</button>
        </form>
      </Section>

      {done.length > 0 && (
        <Section title="Completed">
          <ul className="flex flex-col gap-2 text-sm">
            {done.map((p) => {
              const pr = prog.get(p.id) ?? { sessions: 0, minutes: 0 };
              return (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="font-semibold">{p.title}</span>
                  <span className="text-muted">{pr.sessions} sessions · {pr.minutes} min · {p.completedAt?.toLocaleDateString("en-AU")}{p.revealedAt ? " · seen" : " · reveal waiting"}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </div>
  );
}
