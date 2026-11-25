import { listEvents, listMatches } from "@/db/repo";
import { requirePlayerView } from "@/lib/auth";
import MatchWizard from "@/components/MatchWizard";

export default async function NewMatch() {
  const { player } = await requirePlayerView();
  const n = (await listMatches(player.id)).length;
  // Suggest opposition from the most recent past match event.
  const ev = (await listEvents(player.id, new Date(Date.now() - 4 * 86400000)))
    .filter((e) => e.type === "match" && e.startsAt.getTime() <= Date.now() + 6 * 3600000)
    .pop();
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
