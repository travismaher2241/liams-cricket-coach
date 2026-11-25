import { getEvent } from "@/db/repo";
import { requirePlayerView } from "@/lib/auth";
import { upcomingEvents } from "@/lib/data";
import MatchDay from "@/components/MatchDay";

export default async function MatchDayPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event } = await searchParams;
  const { player } = await requirePlayerView();
  let ev = null;
  if (event) ev = await getEvent(player.id, event);
  if (!ev) ev = (await upcomingEvents(player.id, 5)).find((e) => e.type === "match") ?? null;
  const fav = player.playerAnswers?.favShot;
  const battingFocus = fav && fav !== "skip" && fav !== "Defence!" ? `Trust your ${fav.toLowerCase()}.` : null;
  return <MatchDay eventId={ev?.id ?? null} title={ev?.title ?? "Game day"} battingFocus={battingFocus} />;
}
