import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { preSessionNote, scheduleFor } from "@/lib/mind";
import { LESSONS, MIND_WORDS, nextSession, whenLabel } from "@/content/mind";
import { WordPicker } from "@/components/Mind";

export default async function MindPage() {
  const { player } = await requirePlayerView();
  const [note] = await Promise.all([preSessionNote(player)]);
  const next = nextSession(scheduleFor(player));
  const done = new Set(player.mindDone ?? []);

  return (
    <main className="flex flex-col gap-4">
      <header>
        <p className="label">Mental coaching</p>
        <h1 className="h-display text-3xl">Mind</h1>
        <p className="mt-1 text-muted">Cricket is played in your head as much as with your bat.</p>
      </header>

      {note ? (
        <section className="card border-turf/60 bg-turf/10">
          <p className="label text-turf">Before {note.slot.title.toLowerCase()}</p>
          <p className="mt-1 text-xl font-semibold leading-snug">{note.text}</p>
        </section>
      ) : (
        next && (
          <section className="card">
            <p className="label">Next up</p>
            <p className="mt-1 font-semibold">{next.slot.title}</p>
            <p className="text-sm text-muted">{whenLabel(next.daysAhead, next.slot)}. A positive note will be waiting here before it starts.</p>
          </section>
        )
      )}

      <section className="card border-gold/60">
        <p className="label text-gold">Remember</p>
        <p className="mt-1 text-2xl font-bold leading-snug">It&apos;s OK to get out. It happens to the best of us.</p>
        <p className="mt-1 text-muted">Your team wants you to have a go and enjoy it.</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/play/mind/reset" className="card flex flex-col gap-1">
          <span className="text-2xl">🔄</span>
          <span className="font-semibold">I just got out</span>
          <span className="text-xs text-muted">The walk-back reset</span>
        </Link>
        <Link href="/play/mind/breathe" className="card flex flex-col gap-1">
          <span className="text-2xl">🌬️</span>
          <span className="font-semibold">Calm down</span>
          <span className="text-xs text-muted">1 minute of breathing</span>
        </Link>
      </div>

      <section className="card">
        <p className="label">Quick lessons</p>
        <ul className="mt-2 flex flex-col gap-2">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <Link href={`/play/mind/${l.id}`} className="choice flex items-center gap-3 !py-3">
                <span className="text-2xl">{l.icon}</span>
                <span className="flex-1 font-semibold">{l.title}</span>
                {done.has(l.id) && <span className="text-turf" aria-label="done">✓</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <p className="label">My reset word</p>
        <p className="mt-1 text-muted">Pick a word to say to yourself between balls. Tap a different one any time.</p>
        <WordPicker words={MIND_WORDS} current={player.mindWord ?? null} />
      </section>
    </main>
  );
}
