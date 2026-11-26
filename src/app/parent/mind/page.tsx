import { requireParent } from "@/lib/auth";
import { saveMindLines, saveWeeklySchedule } from "@/app/actions/parent";
import { Section } from "@/components/ui";
import { scheduleFor } from "@/lib/mind";
import { DAY_NAMES, LESSONS, NOTE_FALLBACKS, NOTE_LEAD_MIN, formatTime } from "@/content/mind";

export default async function MindParent({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { player } = await requireParent();
  const { saved } = await searchParams;
  const schedule = scheduleFor(player);
  const rows = [...schedule, ...Array.from({ length: Math.max(2, 5 - schedule.length) }, () => null)];
  const done = new Set(player.mindDone ?? []);

  return (
    <div className="flex flex-col gap-4">
      {saved && <p className="rounded-xl bg-turf/15 px-3 py-2 text-sm text-turf">Saved.</p>}

      <Section title="Weekly routine">
        <p className="mb-3 text-sm text-muted">
          {player.displayName} gets a short positive note in the app from {NOTE_LEAD_MIN / 60} hours before each of these (Melbourne time). Notes are written by Gemini around
          one calm theme each time (getting out is normal, watch the ball, nerves mean you care, teammates, fresh start), with built-in lines as backup.
        </p>
        <form action={saveWeeklySchedule} className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_8rem_2fr]">
              <input type="hidden" name={`id_${i}`} defaultValue={r?.id ?? ""} />
              <select className="input" name={`day_${i}`} defaultValue={r ? String(r.day) : ""} aria-label="Day">
                <option value="">(none)</option>
                {DAY_NAMES.map((d, k) => <option key={d} value={k}>{d}</option>)}
              </select>
              <input className="input" type="time" name={`time_${i}`} defaultValue={r?.time ?? ""} aria-label="Time" />
              <select className="input" name={`kind_${i}`} defaultValue={r?.kind ?? "training"} aria-label="Type">
                <option value="training">Training</option>
                <option value="match">Game</option>
              </select>
              <input className="input" name={`title_${i}`} defaultValue={r?.title ?? ""} placeholder="e.g. Senior team training" aria-label="Title" />
            </div>
          ))}
          <button className="btn-primary mt-2 self-start">Save routine</button>
        </form>
        {schedule.length > 0 && (
          <p className="mt-3 text-xs text-muted">Now: {schedule.map((s) => `${DAY_NAMES[s.day]} ${formatTime(s.time)} ${s.title}`).join(" · ")}</p>
        )}
      </Section>

      <Section title="Your own lines for him">
        <p className="mb-3 rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm">
          <span className="font-semibold text-gold">{player.displayName} WILL see these.</span> They&apos;re mixed in with the notes about one session in three. Keep them short and
          positive. Your private notes stay private and are never used here.
        </p>
        <form action={saveMindLines} className="flex flex-col gap-2">
          <textarea className="input min-h-32" name="lines" defaultValue={(player.mindLines ?? []).join("\n")} placeholder={"One line each, e.g.\nWhatever happens today, I'm proud of you for having a go."} />
          <button className="btn-primary self-start">Save lines</button>
        </form>
      </Section>

      <Section title="What he can find in Mind">
        <ul className="flex flex-col gap-1 text-sm">
          {LESSONS.map((l) => (
            <li key={l.id}>
              {l.icon} <span className="font-semibold">{l.title}</span> <span className="text-muted">· “{l.takeaway}”</span>
              {done.has(l.id) && <span className="ml-2 chip">read</span>}
            </li>
          ))}
          <li>🔄 <span className="font-semibold">“I just got out” reset</span> <span className="text-muted">· breathe, “next time”, cheer your mates, one good thing</span></li>
          <li>🌬️ <span className="font-semibold">Calm breathing</span> <span className="text-muted">· in for 4, out for 6, three rounds</span></li>
        </ul>
        {player.mindWord && <p className="mt-3 text-sm">His reset word: <span className="font-semibold">{player.mindWord}</span></p>}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted">Backup notes (used if Gemini is unavailable)</summary>
          <ul className="mt-2 list-disc pl-5 text-muted">
            {[...NOTE_FALLBACKS.match, ...NOTE_FALLBACKS.training].map((t) => <li key={t}>{t}</li>)}
          </ul>
        </details>
      </Section>
    </div>
  );
}
