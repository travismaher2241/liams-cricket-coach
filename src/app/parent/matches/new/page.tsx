import { requireParent } from "@/lib/auth";
import MatchForm from "@/components/MatchForm";

export default async function NewMatchParent() {
  const { player } = await requireParent();
  return <MatchForm player={player} />;
}
