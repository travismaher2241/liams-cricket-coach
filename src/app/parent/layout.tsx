import Link from "next/link";
import ParentNav from "@/components/ParentNav";
import { requireParent } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { player } = await requireParent();
  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 pb-16 pt-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label">Parent dashboard</p>
          <h1 className="h-display text-2xl">{player.displayName}&apos;s cricket</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/play" className="btn-small">Preview {player.displayName}&apos;s app</Link>
          <form action={logout}>
            <button className="btn-small">Log out</button>
          </form>
        </div>
      </header>
      <ParentNav />
      <div className="mt-4">{children}</div>
    </div>
  );
}
