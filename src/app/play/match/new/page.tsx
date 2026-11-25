import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePlayerView } from "@/lib/auth";
import MatchWizard from "@/components/MatchWizard";

export default async function NewMatch() {
  const { player } = await requirePlayerView();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.matches).where(eq(schema.matches.playerId, player.id));
  // Suggest opposition from the most recent past match event.
  const [ev] = await db
    .select()
    .from(schema.events)
    .where(sql`${schema.events.playerId} = ${player.id} and ${schema.events.type} = 'match' and ${schema.events.startsAt} <= now() + interval '6 hours'`)
    .orderBy(desc(schema.events.startsAt))
    .limit(1);
  const recent = ev && Date.now() - ev.startsAt.getTime() < 4 * 86400000 ? ev : null;
  return (
    <main className="flex flex-col gap-4">
      <h1 className="h-display text-3xl">Record a match</h1>
      <MatchWizard
        matchNumber={n + 1}
        defaults={{
          team: player.team ?? undefined,
          competition: player.competition ?? undefined,
          season: player.season ?? undefined,
          opposition: recent?.title.replace(/^vs\.?\s*/i, "") ?? undefined,
          date: recent ? recent.startsAt.toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }) : undefined,
        }}
      />
    </main>
  );
}
