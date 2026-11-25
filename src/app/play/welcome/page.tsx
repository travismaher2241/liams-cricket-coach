import { requirePlayerView } from "@/lib/auth";
import WelcomeFlow from "@/components/WelcomeFlow";

export default async function Welcome() {
  const { player } = await requirePlayerView();
  return <WelcomeFlow name={player.displayName} />;
}
