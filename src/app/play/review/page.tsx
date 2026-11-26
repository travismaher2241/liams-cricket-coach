import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { scheduleFor } from "@/lib/mind";
import { DAY_NAMES, formatTime } from "@/content/mind";

export default async function ReviewPage() {
  const { player } = await requirePlayerView();
  const training = scheduleFor(player).filter((s) => s.kind === "training");
  return (
    <main className="flex flex-col gap-4">
      <header>
        <h1 className="h-display text-3xl">Review a session</h1>
        <p className="mt-1 text-muted">A quick look back. Skip anything you like.</p>
      </header>

      <Link href="/play/match/new" className="card border-sky/60">
        <p className="label text-sky">Match</p>
        <p className="mt-1 text-xl font-bold">Review a match</p>
        <p className="text-sm text-muted">Your stats, then a few taps on how it went.</p>
      </Link>

      <section className="card border-turf/60">
        <p className="label text-turf">Training</p>
        <p className="mt-1 text-xl font-bold">Review training</p>
        <p className="text-sm text-muted">How it felt, what you worked on and what went well. About a minute.</p>
        <div className="mt-3 grid gap-2">
          {training.map((s) => (
            <Link key={s.id} href={`/play/after?slot=${encodeURIComponent(s.id)}`} className="choice !py-3">
              <span className="font-semibold">{s.title}</span>
              <span className="block text-sm text-muted">{DAY_NAMES[s.day]}s, {formatTime(s.time)}</span>
            </Link>
          ))}
          <Link href="/play/after" className="choice !py-3">
            <span className="font-semibold">Other practice</span>
            <span className="block text-sm text-muted">Nets with a mate, backyard, anything else</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
