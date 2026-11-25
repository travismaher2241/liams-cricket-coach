import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { DRILL_BY_ID, EQUIPMENT_LABEL, PLACE_LABEL, AREA_LABEL } from "@/content/drills";
import DrillRunner from "@/components/DrillRunner";

export default async function DrillPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ challenge?: string }> }) {
  const { id } = await params;
  const { challenge } = await searchParams;
  await requirePlayerView();
  const d = DRILL_BY_ID[id];
  if (!d) notFound();
  return (
    <main className="flex flex-col gap-4">
      <Link href="/play/train" className="text-sm text-muted">‹ Back</Link>
      <header>
        <p className="label text-turf">{AREA_LABEL[d.area]} · {d.minutes} min</p>
        <h1 className="h-display text-3xl">{d.name}</h1>
        <p className="mt-1 text-lg text-muted">{d.purpose}</p>
      </header>

      {(d.needsAdult || d.needsPartner || d.safety) && (
        <div className="rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm">
          {d.needsAdult && <p className="font-semibold text-gold">👋 Ask an adult to help with this one.</p>}
          {d.needsPartner && !d.needsAdult && <p className="font-semibold text-gold">👋 You need a partner for this one.</p>}
          {d.safety && <p>🛡️ {d.safety}</p>}
        </div>
      )}

      <section className="card">
        <p className="label">You need</p>
        <p className="mt-1">{d.equipment.map((e) => EQUIPMENT_LABEL[e]).join(" · ")}</p>
        <p className="mt-1 text-sm text-muted">Where: {d.places.map((p) => PLACE_LABEL[p]).join(", ")}</p>
      </section>

      <section className="card">
        <p className="label">How</p>
        <ol className="mt-2 flex flex-col gap-2">
          {d.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-lg">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-turf/20 text-sm font-bold text-turf">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <p className="label">Think about</p>
        <ul className="mt-1">
          {d.cues.map((c) => (
            <li key={c} className="text-lg font-semibold">“{c}”</li>
          ))}
        </ul>
        <p className="mt-3 label">Do</p>
        <p className="text-lg">{d.reps}</p>
        <p className="text-sm text-muted">Done when: {d.donePoint}</p>
      </section>

      <DrillRunner drillId={d.id} minutes={d.minutes} measure={d.measure ?? null} isChallenge={challenge === "1"} />
    </main>
  );
}
