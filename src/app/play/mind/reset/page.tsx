import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { ResetFlow } from "@/components/Mind";
import { TOUGH_MOMENTS, type ToughMoment } from "@/content/mind";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ what?: string }> }) {
  const { player } = await requirePlayerView();
  const { what } = await searchParams;
  const m = TOUGH_MOMENTS.find((t) => t.key === what) ?? TOUGH_MOMENTS[0];
  return (
    <main className="flex flex-col gap-4">
      <Link href="/play/mind" className="text-sm text-muted">‹ Back</Link>
      <p className="label">{m.icon} {m.label}</p>
      <ResetFlow what={m.key as ToughMoment} word={player.mindWord ?? null} />
    </main>
  );
}
