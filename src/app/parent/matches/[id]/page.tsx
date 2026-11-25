import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth";
import MatchForm from "@/components/MatchForm";
import { Section } from "@/components/ui";
import { Q_BY_ID, WINS, WORRIES } from "@/content/reflection";
import { deleteMatch } from "@/app/actions/parent";

export default async function EditMatch({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { player } = await requireParent();
  const [m] = await db.select().from(schema.matches).where(and(eq(schema.matches.id, Number(id)), eq(schema.matches.playerId, player.id)));
  if (!m) notFound();
  const [r] = await db.select().from(schema.reflections).where(eq(schema.reflections.matchId, m.id));
  return (
    <div className="flex flex-col gap-4">
      {r && (
        <Section title={`${player.displayName}'s reflection`}>
          <ul className="flex flex-col gap-1 text-sm">
            {Object.entries(r.answers).map(([q, a]) => (
              <li key={q}><span className="text-muted">{Q_BY_ID[q]?.q ?? q}</span> <b>{a === "skip" ? "(skipped)" : a === "unsure" ? "Not sure" : a}</b></li>
            ))}
          </ul>
          {r.worries && <p className="mt-2 text-sm"><span className="text-muted">On his mind:</span> {r.worries.length ? r.worries.map((w) => WORRIES.find((x) => x.key === w)?.label ?? w).join(", ") : "(nothing selected)"}</p>}
          {r.wins && r.wins.length > 0 && <p className="mt-1 text-sm"><span className="text-muted">Wins:</span> {r.wins.map((w) => WINS.find((x) => x.key === w)?.label ?? w).join("; ")}</p>}
          <p className="mt-2 text-xs text-muted">Self-reported feelings, not a clinical measure.</p>
        </Section>
      )}
      <MatchForm m={m} player={player} />
      <form action={deleteMatch.bind(null, m.id)}><button className="btn-small text-muted">Delete this match</button></form>
    </div>
  );
}
