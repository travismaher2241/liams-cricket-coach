import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { ResetFlow } from "@/components/Mind";

export default async function ResetPage() {
  const { player } = await requirePlayerView();
  return (
    <main className="flex flex-col gap-4">
      <Link href="/play/mind" className="text-sm text-muted">‹ Back</Link>
      <p className="label">The walk-back reset</p>
      <ResetFlow word={player.mindWord ?? null} />
    </main>
  );
}
