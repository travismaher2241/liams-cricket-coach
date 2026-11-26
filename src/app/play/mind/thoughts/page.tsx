import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { listThoughts } from "@/db/repo";
import { addThought, deleteMyThought } from "@/app/actions/player";
import { THOUGHT_PROMPTS, isDistress } from "@/content/mind";
import { dateSeed } from "@/lib/recommend";

export default async function ThoughtsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { player } = await requirePlayerView();
  const { saved } = await searchParams;
  const thoughts = await listThoughts(player.id, 10);
  const prompt = THOUGHT_PROMPTS[dateSeed(new Date()) % THOUGHT_PROMPTS.length];
  const latestUpset = thoughts[0] && saved && isDistress(thoughts[0].text);

  return (
    <main className="flex flex-col gap-4">
      <Link href="/play/mind" className="text-sm text-muted">‹ Back</Link>
      <header>
        <h1 className="h-display text-3xl">My thoughts</h1>
        <p className="mt-1 text-muted">Only if you want to. Write anything about cricket or how you&apos;re feeling, and your coach messages will keep it in mind.</p>
      </header>

      {saved && (
        <div className="card border-turf/60 bg-turf/10">
          <p className="font-semibold">Thanks for sharing.</p>
          {latestUpset && <p className="mt-1">If something is really bothering you, please talk to Mum or Dad or another grown-up you trust. They&apos;d really want to know.</p>}
        </div>
      )}

      <form action={addThought} className="card flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="font-semibold">{prompt}</span>
          <textarea name="text" className="input min-h-36 text-lg" maxLength={1000} placeholder="Type here… (optional)" />
        </label>
        <button className="btn-primary">Save</button>
      </form>

      {thoughts.length > 0 && (
        <section className="card">
          <p className="label">What you&apos;ve written</p>
          <ul className="mt-2 flex flex-col gap-3">
            {thoughts.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-xs text-muted">{t.createdAt.toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne", weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="whitespace-pre-wrap">{t.text}</span>
                </span>
                <form action={deleteMyThought.bind(null, t.id)}>
                  <button className="text-xs text-muted underline">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
