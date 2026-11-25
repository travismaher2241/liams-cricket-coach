import Link from "next/link";
import { redirect } from "next/navigation";
import { listPlayers } from "@/db/repo";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const s = await getSession();
  if (s?.role === "player") redirect("/play");
  if (s?.role === "parent") redirect("/parent");
  const players = (await listPlayers()).map((p) => ({ id: p.id, name: p.displayName }));
  if (!players.length) redirect("/setup");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <div className="text-5xl">🏏</div>
        <h1 className="h-display mt-3 text-4xl">Every little bit counts</h1>
        <p className="mt-2 text-muted">Who&apos;s here?</p>
      </div>
      {players.map((p) => (
        <Link key={p.id} href={`/login/player/${p.id}`} className="btn-primary text-2xl py-6">
          I&apos;m {p.name}
        </Link>
      ))}
      <Link href="/login/parent" className="btn-ghost">
        Parent login
      </Link>
    </main>
  );
}
