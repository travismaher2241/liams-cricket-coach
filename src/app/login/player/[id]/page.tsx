import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PinPad from "@/components/PinPad";

export default async function PlayerLogin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await db.select().from(schema.players).where(eq(schema.players.id, Number(id)));
  if (!p) notFound();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <h1 className="h-display text-center text-3xl">Hey {p.displayName}!</h1>
      <p className="text-center text-muted">Tap in your PIN</p>
      <PinPad playerId={p.id} />
    </main>
  );
}
