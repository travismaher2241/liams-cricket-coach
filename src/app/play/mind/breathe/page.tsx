import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { Breathe } from "@/components/Mind";

export default async function BreathePage() {
  await requirePlayerView();
  return (
    <main className="flex flex-col gap-4">
      <Link href="/play/mind" className="text-sm text-muted">‹ Back</Link>
      <header>
        <h1 className="h-display text-3xl">Calm breathing</h1>
        <p className="mt-1 text-muted">Breathe in while the circle grows, and out slowly while it shrinks. Three rounds.</p>
      </header>
      <section className="card">
        <Breathe />
      </section>
      <p className="text-center text-sm text-muted">Long breaths out tell your body it&apos;s safe to relax.</p>
    </main>
  );
}
