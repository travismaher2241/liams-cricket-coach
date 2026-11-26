import Link from "next/link";
import { Activity, Eye, Hand, Pause, PenLine, RotateCcw, ShieldCheck, Target, Users, Wind, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "ok-to-get-out": ShieldCheck,
  "play-the-ball": Eye,
  "walk-back": RotateCcw,
  "hit-for-four": Target,
  misfields: Hand,
  nerves: Activity,
  teammates: Users,
  "between-balls": Pause,
  out: RotateCcw,
  hit: Target,
  misfield: Hand,
};
function Ico({ k }: { k: string }) {
  const I = ICONS[k] ?? Activity;
  return <I size={22} strokeWidth={1.75} className="shrink-0 text-turf" aria-hidden />;
}
import { requirePlayerView } from "@/lib/auth";
import { preSessionNote, pushPublicKey, scheduleFor } from "@/lib/mind";
import { LESSONS, MIND_WORDS, TOUGH_MOMENTS, nextSession, whenLabel } from "@/content/mind";
import PushToggle from "@/components/PushToggle";
import { WordPicker } from "@/components/Mind";

export default async function MindPage() {
  const { player } = await requirePlayerView();
  const [note, vapid] = await Promise.all([preSessionNote(player), pushPublicKey()]);
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
        <p className="mt-1 text-muted">Getting hit for four or six, or misfielding, happens to everyone too. They&apos;re all part of the game, and they give you fun things to get better at.</p>
      </section>

      <section className="card">
        <p className="label">Tough moment? Tap one</p>
        <div className="mt-2 grid gap-2">
          {TOUGH_MOMENTS.map((t) => (
            <Link key={t.key} href={`/play/mind/reset?what=${t.key}`} className="choice flex items-center gap-3 !py-3">
              <Ico k={t.key} />
              <span className="font-semibold">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/play/mind/breathe" className="card flex flex-col gap-1">
          <Wind size={26} strokeWidth={1.75} className="text-turf" />
          <span className="font-semibold">Calm down</span>
          <span className="text-xs text-muted">1 minute of breathing</span>
        </Link>
        <Link href="/play/mind/thoughts" className="card flex flex-col gap-1">
          <PenLine size={26} strokeWidth={1.75} className="text-turf" />
          <span className="font-semibold">My thoughts</span>
          <span className="text-xs text-muted">Only if you want to</span>
        </Link>
      </div>

      <section className="card">
        <p className="label">Quick lessons</p>
        <ul className="mt-2 flex flex-col gap-2">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <Link href={`/play/mind/${l.id}`} className="choice flex items-center gap-3 !py-3">
                <Ico k={l.id} />
                <span className="flex-1 font-semibold">{l.title}</span>
                {done.has(l.id) && <span className="text-turf" aria-label="done">✓</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PushToggle publicKey={vapid} />

      <section className="card">
        <p className="label">My reset word</p>
        <p className="mt-1 text-muted">Pick a word to say to yourself between balls. Tap a different one any time.</p>
        <WordPicker words={MIND_WORDS} current={player.mindWord ?? null} />
      </section>
    </main>
  );
}
