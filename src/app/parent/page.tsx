import Link from "next/link";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireParent } from "@/lib/auth";
import { programmeProgress, upcomingEvents, weekSummary, recommendContext } from "@/lib/data";
import { dailyChallenge } from "@/lib/recommend";
import { levelName } from "@/content/quiz";
import { AREA_LABEL, type Area } from "@/content/drills";
import { Bar, Section } from "@/components/ui";

export default async function ParentHome() {
  const { player } = await requireParent();
  if (!player.parentOverview && !player.equipment.length) {
    return (
      <Section title="Welcome! Let's set things up">
        <p className="text-muted">Start with a profile overview, training equipment and spaces. It takes about 5 minutes and personalises everything.</p>
        <Link href="/parent/profile" className="btn-primary mt-3">Set up profile</Link>
      </Section>
    );
  }
  const progs = await db
    .select()
    .from(schema.programmes)
    .where(and(eq(schema.programmes.playerId, player.id), ne(schema.programmes.status, "completed")));
  const prog = await programmeProgress(progs.map((p) => p.id));
  const w = await weekSummary(player.id);
  const events = await upcomingEvents(player.id, 4);
  const [lastQuiz] = await db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.playerId, player.id), eq(schema.quizAttempts.kind, "weekly")))
    .orderBy(desc(schema.quizAttempts.completedAt))
    .limit(1);
  const ctx = await recommendContext(player);
  const today = dailyChallenge(ctx);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Section title="This week">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-2xl font-bold">{w.sessions}</p><p className="text-xs text-muted">sessions</p></div>
          <div><p className="text-2xl font-bold">{w.minutes}</p><p className="text-xs text-muted">minutes</p></div>
          <div><p className="text-2xl font-bold">{w.matches.length}</p><p className="text-xs text-muted">matches</p></div>
        </div>
        {w.areas.length > 0 && <p className="mt-3 text-sm">Areas: {w.areas.map((a) => AREA_LABEL[a as Area]).join(", ")}</p>}
        {w.loved.length > 0 && <p className="mt-1 text-sm">Enjoyed: {w.loved.join(", ")}</p>}
        {w.discomfort.length > 0 && (
          <p className="mt-3 rounded-lg bg-gold/10 p-2 text-sm text-gold">
            ⚠️ Reported discomfort after: {w.discomfort.join(", ")}. Those activities are being avoided for a week. Worth a check-in.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">Shown to Liam as a short positive summary only. No targets or missed-day counts.</p>
      </Section>

      <Section title="Active development programmes" aside={<Link href="/parent/programmes" className="btn-small">Manage</Link>}>
        {progs.length === 0 ? (
          <p className="text-sm text-muted">None yet. Start one to steer Liam&apos;s daily challenges towards a goal (he won&apos;t see the plan).</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {progs.map((p) => {
              const pr = prog.get(p.id) ?? { sessions: 0, minutes: 0 };
              return (
                <li key={p.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{p.title}{p.status === "paused" && <span className="ml-2 chip">paused</span>}</span>
                    <span className="text-muted">{pr.sessions}/{p.targetSessions} · {pr.minutes} min</span>
                  </div>
                  <Bar value={pr.sessions} max={p.targetSessions} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Why today's challenge?">
        {today ? (
          <>
            <p className="font-semibold">{today.name} <span className="text-sm text-muted">({AREA_LABEL[today.area]}, {today.minutes} min)</span></p>
            <p className="mt-1 text-sm text-muted">
              Picked because it fits his equipment and spaces, is short and solo-friendly, and
              {ctx.programmeTags.some((t) => today.tags.includes(t)) ? " matches an active programme's focus" : " adds variety"}
              {player.priorities[today.area] ? `, and ${AREA_LABEL[today.area].toLowerCase()} is one of your priorities` : ""}.
              Activities he enjoyed get a boost; ones that caused discomfort are avoided.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Add equipment in Profile to unlock challenges.</p>
        )}
      </Section>

      <Section title="Cricket IQ" aside={<Link href="/parent/iq" className="btn-small">Details</Link>}>
        <p className="font-semibold">Level {player.quizLevel}: {levelName(player.quizLevel)}</p>
        {lastQuiz ? (
          <p className="mt-1 text-sm text-muted">
            Last weekly quiz: {lastQuiz.score}/{lastQuiz.total} on {lastQuiz.completedAt.toLocaleDateString("en-AU")}
            {lastQuiz.levelUp ? " (levelled up)" : ""}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">No weekly quiz yet.</p>
        )}
      </Section>

      <Section title="Coming up" aside={<Link href="/parent/schedule" className="btn-small">Schedule</Link>}>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Nothing scheduled. Add matches and training so Match Day mode and recovery work.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {events.map((e) => (
              <li key={e.id}>
                <span className="font-semibold">{e.title}</span>{" "}
                <span className="text-muted">
                  {e.startsAt.toLocaleString("en-AU", { timeZone: "Australia/Melbourne", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Link href="/parent/notes" className="btn-small">Add private note</Link>
          <Link href="/parent/matches/new" className="btn-small">Add / correct a match</Link>
          <Link href="/parent/wellbeing" className="btn-small">Confidence trends</Link>
          <Link href="/play" className="btn-small">Preview Liam&apos;s app</Link>
        </div>
      </Section>
    </div>
  );
}
