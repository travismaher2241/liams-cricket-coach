import { requireParent } from "@/lib/auth";
import { saveMindLines, saveWeeklySchedule } from "@/app/actions/parent";
import { Section } from "@/components/ui";
import { scheduleFor } from "@/lib/mind";
import { listPushSubs, listThoughts } from "@/db/repo";
import { parentTestPush } from "@/app/actions/parent";
import { DAY_NAMES, LESSONS, NOTE_FALLBACKS, formatTime } from "@/content/mind";

export default async function MindParent({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { player } = await requireParent();
  const { saved } = await searchParams;
  const schedule = scheduleFor(player);
  const rows = [...schedule, ...Array.from({ length: Math.max(2, 5 - schedule.length) }, () => null)];
  const done = new Set(player.mindDone ?? []);
  const [thoughts, subs] = await Promise.all([listThoughts(player.id, 30), listPushSubs(player.id)]);

  return (
    <div className="flex flex-col gap-4">
      {saved && <p className="rounded-xl bg-turf/15 px-3 py-2 text-sm text-turf">Saved.</p>}

      <Section title={`${player.displayName}'s thoughts`}>
        <p className="mb-3 text-sm text-muted">
          What he writes in his optional &quot;My thoughts&quot; box. The app doesn&apos;t tell him who can read these. His latest thought from the past two weeks helps shape the coach
          notes, unless it suggests he&apos;s really upset, in which case it&apos;s never sent to the AI and is highlighted here.
        </p>
        {thoughts.length === 0 ? (
          <p className="text-sm text-muted">Nothing yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {thoughts.map((t) => (
              <li key={t.id} className={`rounded-xl p-3 ${t.flagged ? "border border-gold bg-gold/10" : "bg-surface-2"}`}>
                <span className="block text-xs text-muted">
                  {t.createdAt.toLocaleString("en-AU", { timeZone: "Australia/Melbourne", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  {t.flagged && <span className="ml-2 font-semibold text-gold">Worth a gentle chat</span>}
                </span>
                <span className="whitespace-pre-wrap">{t.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Phone notifications">
        {(
          <>
            <p className="text-sm text-muted">
              About 2 hours before each session (Melbourne time), {player.displayName}&apos;s phone gets &quot;A message from your coach&quot;. Tapping it opens the note in the app.
              The note itself never shows on the lock screen. He turns this on from the Mind tab, on his phone, with the app opened from his home screen.
            </p>
            <p className="mt-2 text-sm">Devices signed up: <span className="font-semibold">{subs.length}</span>{subs.length ? ` (${subs.filter((s) => s.role === "player").length} his, ${subs.filter((s) => s.role === "parent").length} from parent preview)` : ""}</p>
            {subs.length > 0 && (
              <form action={parentTestPush} className="mt-2"><button className="btn-small">Send a test notification</button></form>
            )}
          </>
        )}
      </Section>

      <Section title="Weekly routine">
        <p className="mb-3 text-sm text-muted">
          {player.displayName} gets a short positive note in the app from about 2 hours before each of these (Melbourne time). Gemini writes each note
          around one calm theme: getting out is normal, getting hit for four or six is the batter&apos;s job, everyone misfields, watch the ball, nerves mean you care, teammates,
          or a fresh start. If he&apos;s named a favourite cricketer in his setup, notes can mention that even they have those moments. Built-in lines are the backup.
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
          <li>🔄 <span className="font-semibold">Tough moment resets</span> <span className="text-muted">· got out, hit for 4 or 6, or misfielded: a few calm steps for each</span></li>
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
