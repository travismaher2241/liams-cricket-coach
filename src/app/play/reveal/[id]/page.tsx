import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePlayerView } from "@/lib/auth";
import { TEMPLATE_BY_KEY } from "@/content/programmes";
import { DRILL_BY_ID } from "@/content/drills";
import { personalBests } from "@/lib/data";
import { markRevealSeen } from "@/app/actions/player";

export default async function Reveal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { player } = await requirePlayerView();
  const [p] = await db
    .select()
    .from(schema.programmes)
    .where(and(eq(schema.programmes.id, Number(id)), eq(schema.programmes.playerId, player.id), eq(schema.programmes.status, "completed")));
  if (!p) notFound();
  const acts = await db.select().from(schema.activities).where(eq(schema.activities.programmeId, p.id));
  const minutes = acts.reduce((a, b) => a + b.minutes, 0);
  const skills = [...new Set(acts.map((a) => DRILL_BY_ID[a.drillId]?.name).filter(Boolean))];
  const end = p.completedAt ?? new Date();
  const weeks = Math.max(1, Math.round((end.getTime() - p.startedAt.getTime()) / (7 * 86400000)));
  const progDrills = new Set(acts.map((a) => a.drillId));
  const pbs = (await personalBests(player.id)).filter((b) => progDrills.has(b.drillId) && b.setAt >= p.startedAt && b.setAt <= end && b.attempts > 1 && b.best !== b.first);
  const area = TEMPLATE_BY_KEY[p.templateKey]?.revealArea ?? p.title.toLowerCase();
  const seen = markRevealSeen.bind(null, p.id);

  // Only factual numbers. No invented improvement. Parent notes are never shown here.
  return (
    <main className="flex flex-col gap-4 pt-4">
      <div className="text-center text-6xl">🏆</div>
      <h1 className="h-display text-center text-3xl">Look how far you&apos;ve come!</h1>
      <p className="text-center text-lg">
        {weeks === 1 ? "Over the past week" : `Over the past ${weeks} weeks`}, your cricket challenges have been helping you develop <b>{area}</b>.
      </p>
      <section className="grid grid-cols-2 gap-3">
        <div className="card text-center"><p className="text-3xl font-bold text-turf">{acts.length}</p><p className="text-sm text-muted">activities</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-turf">{minutes}</p><p className="text-sm text-muted">minutes of practice</p></div>
      </section>
      {skills.length > 0 && (
        <section className="card">
          <p className="label">Skills you explored</p>
          <p className="mt-1">{skills.join(" · ")}</p>
        </section>
      )}
      {pbs.length > 0 && (
        <section className="card">
          <p className="label">Personal bests along the way</p>
          <ul className="mt-1">
            {pbs.map((b) => (
              <li key={b.drillId}>⭐ {b.label}: {b.first} → <b>{b.best}</b> {b.unit}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-muted">That&apos;s something worth being proud of.</p>
      <form action={seen}>
        <button className="btn-primary w-full">Add it to my Journey</button>
      </form>
    </main>
  );
}
