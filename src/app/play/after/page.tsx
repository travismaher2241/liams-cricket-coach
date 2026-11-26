import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { scheduleFor } from "@/lib/mind";
import Checkin from "@/components/Checkin";

export default async function AfterPage({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const { player } = await requirePlayerView();
  const { slot: slotId } = await searchParams;
  const slot = scheduleFor(player).find((s) => s.id === slotId && s.kind === "training");
  return (
    <main className="flex flex-col gap-4">
      <Link href="/play" className="text-sm text-muted">‹ Home</Link>
      <p className="label">Training update</p>
      <Checkin slotId={slot?.id ?? "extra"} title={slot?.title ?? "Training"} />
    </main>
  );
}
