"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { saveMatchWithReflection } from "@/app/actions/match";
import type { MatchPayload } from "@/lib/matchClean";
import { Q_BY_ID, WINS, WORRIES, askWorries, pickReflectionQs } from "@/content/reflection";
import { OptionQuestion, Progress, opts } from "./Stepper";

function Counter({ label, value, onChange, unknownOk = true, max = 300 }: { label: string; value: number | null; onChange: (v: number | null) => void; unknownOk?: boolean; max?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="font-semibold">{label}</span>
      <span className="flex items-center gap-2">
        <button type="button" className="btn-ghost !min-h-11 !px-4 !py-2" onClick={() => onChange(Math.max(0, (value ?? 0) - 1))}>−</button>
        <input
          className="input w-16 text-center text-xl font-bold"
          inputMode="numeric"
          value={value ?? ""}
          placeholder="?"
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            onChange(v === "" ? null : Math.min(max, Number(v)));
          }}
        />
        <button type="button" className="btn-ghost !min-h-11 !px-4 !py-2" onClick={() => onChange(Math.min(max, (value ?? 0) + 1))}>+</button>
        {unknownOk && (
          <button type="button" onClick={() => onChange(null)} className={`text-xs ${value === null ? "text-turf" : "text-muted"} underline`}>
            Don&apos;t know
          </button>
        )}
      </span>
    </div>
  );
}

type Step = { kind: string; id?: string };

export default function MatchWizard({ defaults, matchNumber }: { defaults: { team?: string; competition?: string; season?: string; opposition?: string; date?: string }; matchNumber: number }) {
  const [m, setM] = useState<MatchPayload>({
    matchDate: defaults.date ?? new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }),
    team: defaults.team,
    competition: defaults.competition,
    season: defaults.season,
    opposition: defaults.opposition ?? "",
    batted: false,
    bowled: false,
    runs: 0,
    battingStatus: null,
    catches: 0,
    runOuts: 0,
    stumpings: 0,
  });
  const [overs, setOvers] = useState(0);
  const [extraBalls, setExtraBalls] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wins, setWins] = useState<string[]>([]);
  const [worries, setWorries] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [done, setDone] = useState<null | { achievements: { title: string; detail: string }[] }>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<MatchPayload>) => setM((x) => ({ ...x, ...patch }));

  const steps: Step[] = useMemo(() => {
    const s: Step[] = [{ kind: "info" }, { kind: "batted" }];
    if (m.batted) s.push({ kind: "batting" });
    s.push({ kind: "bowled" });
    if (m.bowled) s.push({ kind: "bowling" });
    s.push({ kind: "fielding" }, { kind: "reflectIntro" });
    for (const id of pickReflectionQs({ batted: m.batted, bowled: m.bowled, matchNumber })) s.push({ kind: "q", id });
    if (askWorries(matchNumber)) s.push({ kind: "worries" });
    s.push({ kind: "wins" });
    return s;
  }, [m.batted, m.bowled, matchNumber]);

  const step = steps[i];
  const next = () => setI((x) => Math.min(x + 1, steps.length - 1));
  const back = () => setI((x) => Math.max(0, x - 1));
  const isLast = i === steps.length - 1;

  const save = () =>
    start(async () => {
      const r = await saveMatchWithReflection(
        { ...m, ballsBowled: m.bowled ? overs * 6 + extraBalls : null },
        { answers, worries: askWorries(matchNumber) ? worries : null, wins },
      );
      setDone({ achievements: r.achievements });
    });

  if (done) {
    const winLabel = WINS.find((w) => w.key === wins[0])?.label;
    return (
      <section className="card flex flex-col items-center gap-3 text-center">
        <div className="text-5xl">🏏</div>
        <h2 className="h-display text-3xl">Match saved!</h2>
        {winLabel ? <p className="text-lg">“{winLabel}” That&apos;s something worth being proud of.</p> : <p className="text-lg">Every match is part of your cricket journey.</p>}
        <p className="text-muted">Remember: one match never defines a cricketer.</p>
        {done.achievements.map((a) => (
          <p key={a.title} className="rounded-xl bg-gold/15 px-3 py-2 font-semibold text-gold">🏅 {a.title}</p>
        ))}
        <div className="mt-2 grid w-full gap-2">
          <Link href="/play/journey" className="btn-primary">See my Journey</Link>
          <Link href="/play" className="btn-ghost">Home</Link>
        </div>
      </section>
    );
  }

  const nav = (canNext = true, label = "Next") => (
    <div className="mt-2 grid grid-cols-3 gap-2">
      <button type="button" onClick={back} className="btn-ghost text-base" disabled={i === 0}>Back</button>
      <button type="button" onClick={isLast ? save : next} className="btn-primary col-span-2" disabled={!canNext || pending}>
        {isLast ? (pending ? "Saving…" : "Save match") : label}
      </button>
    </div>
  );

  let body: React.ReactNode = null;
  switch (step.kind) {
    case "info":
      body = (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">The match</h2>
          <label className="label">Date</label>
          <input type="date" className="input" value={m.matchDate} onChange={(e) => set({ matchDate: e.target.value })} />
          <label className="label">Who did you play?</label>
          <input className="input" value={m.opposition ?? ""} onChange={(e) => set({ opposition: e.target.value })} placeholder="Opposition (optional)" />
          <label className="label">Result</label>
          <div className="grid grid-cols-3 gap-2">
            {["Won", "Lost", "Draw", "Tie", "No result", "Not sure"].map((r) => (
              <button key={r} type="button" onClick={() => set({ result: r })} className={`choice !px-2 !py-3 text-center !text-base ${m.result === r ? "choice-on" : ""}`}>{r}</button>
            ))}
          </div>
          {nav()}
        </div>
      );
      break;
    case "batted":
      body = (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">Did you bat?</h2>
          <button type="button" className={`choice ${m.batted ? "choice-on" : ""}`} onClick={() => { set({ batted: true }); next(); }}>Yes, I batted</button>
          <button type="button" className={`choice ${!m.batted ? "choice-on" : ""}`} onClick={() => { set({ batted: false }); setI(i + 1); }}>Didn&apos;t bat this time</button>
          {nav(true, "Next")}
        </div>
      );
      break;
    case "batting":
      body = (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your batting</h2>
          <Counter label="Runs" value={m.runs ?? null} onChange={(v) => set({ runs: v })} unknownOk={false} />
          <p className="label mt-2">How did your innings finish?</p>
          <div className="grid grid-cols-3 gap-2">
            {([["not_out", "Not out"], ["retired", "Retired"], ["out", "Out"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => set({ battingStatus: k })} className={`choice !px-2 !py-3 text-center !text-base ${m.battingStatus === k ? "choice-on" : ""}`}>{l}</button>
            ))}
          </div>
          {m.battingStatus === "out" && (
            <>
              <p className="rounded-xl bg-turf/10 p-3 text-base">Getting out is part of cricket. It happens to every batter, even the best in the world. 🌱</p>
              <p className="label mt-2">How? (if you know)</p>
              <div className="grid grid-cols-3 gap-2">
                {["Bowled", "Caught", "LBW", "Run out", "Stumped", "Other"].map((h) => (
                  <button key={h} type="button" onClick={() => set({ howOut: h })} className={`choice !px-2 !py-3 text-center !text-base ${m.howOut === h ? "choice-on" : ""}`}>{h}</button>
                ))}
              </div>
            </>
          )}
          <p className="label mt-3">If you know (you can skip these)</p>
          <Counter label="Balls faced" value={m.balls ?? null} onChange={(v) => set({ balls: v })} />
          <Counter label="Fours" value={m.fours ?? null} onChange={(v) => set({ fours: v })} max={50} />
          <Counter label="Sixes" value={m.sixes ?? null} onChange={(v) => set({ sixes: v })} max={50} />
          {nav(m.runs !== null && !!m.battingStatus)}
        </div>
      );
      break;
    case "bowled":
      body = (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">Did you bowl?</h2>
          <button type="button" className={`choice ${m.bowled ? "choice-on" : ""}`} onClick={() => { set({ bowled: true }); next(); }}>Yes, I bowled</button>
          <button type="button" className={`choice ${!m.bowled ? "choice-on" : ""}`} onClick={() => { set({ bowled: false }); setI(i + 1); }}>Didn&apos;t bowl this time</button>
          {nav()}
        </div>
      );
      break;
    case "bowling":
      body = (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your bowling</h2>
          <Counter label="Full overs" value={overs} onChange={(v) => setOvers(v ?? 0)} unknownOk={false} max={50} />
          <p className="label mt-1">Plus extra balls (if you didn&apos;t finish an over)</p>
          <div className="grid grid-cols-6 gap-1">
            {[0, 1, 2, 3, 4, 5].map((b) => (
              <button key={b} type="button" onClick={() => setExtraBalls(b)} className={`choice !px-0 !py-2 text-center !text-base ${extraBalls === b ? "choice-on" : ""}`}>{b}</button>
            ))}
          </div>
          <Counter label="Runs given" value={m.runsConceded ?? null} onChange={(v) => set({ runsConceded: v })} />
          <Counter label="Wickets" value={m.wickets ?? 0} onChange={(v) => set({ wickets: v })} unknownOk={false} max={10} />
          <p className="label mt-3">If you know</p>
          <Counter label="Maidens" value={m.maidens ?? null} onChange={(v) => set({ maidens: v })} max={20} />
          <Counter label="Wides" value={m.wides ?? null} onChange={(v) => set({ wides: v })} max={50} />
          <Counter label="No-balls" value={m.noBalls ?? null} onChange={(v) => set({ noBalls: v })} max={50} />
          {nav(overs * 6 + extraBalls > 0)}
        </div>
      );
      break;
    case "fielding":
      body = (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your fielding</h2>
          <Counter label="Catches" value={m.catches ?? 0} onChange={(v) => set({ catches: v })} max={20} />
          <Counter label="Run-outs" value={m.runOuts ?? 0} onChange={(v) => set({ runOuts: v })} max={20} />
          <Counter label="Stumpings" value={m.stumpings ?? 0} onChange={(v) => set({ stumpings: v })} max={20} />
          {nav()}
        </div>
      );
      break;
    case "reflectIntro":
      body = (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">Stats done! ✅</h2>
          <p className="text-lg">Now a few quick taps about how the game felt. There are no wrong answers, and you can skip any question.</p>
          {nav(true, "Let's go")}
        </div>
      );
      break;
    case "q": {
      const q = Q_BY_ID[step.id!];
      body = (
        <div className="flex flex-col gap-2">
          <OptionQuestion
            title={q.q}
            options={[...opts(q.options), { value: "unsure", label: "Not sure" }]}
            onPick={(v) => {
              setAnswers({ ...answers, [q.id]: v });
              next();
            }}
          />
          <button type="button" onClick={back} className="text-sm text-muted">‹ Back</button>
        </div>
      );
      break;
    }
    case "worries":
      body = (
        <div className="flex flex-col gap-3">
          <OptionQuestion
            title="Was anything on your mind during the game? Pick any."
            options={WORRIES.map((w) => ({ value: w.key, label: w.label }))}
            multi
            selected={worries}
            onPick={(v) => setWorries(worries.includes(v) ? worries.filter((x) => x !== v) : [...worries, v])}
          />
          <p className="text-sm text-muted">Lots of cricketers feel these. Prefer not to say? Just tap Next.</p>
          {nav()}
        </div>
      );
      break;
    case "wins": {
      const options = WINS.filter((w) => !w.needs || (w.needs === "batting" ? m.batted : m.bowled));
      body = (
        <div className="flex flex-col gap-3">
          <OptionQuestion
            title="What went well for you today? Pick any 🙌"
            options={options.map((w) => ({ value: w.key, label: w.label }))}
            multi
            selected={wins}
            onPick={(v) => setWins(wins.includes(v) ? wins.filter((x) => x !== v) : [...wins, v])}
          />
          {nav()}
        </div>
      );
      break;
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <Progress step={i} total={steps.length} />
      {body}
    </section>
  );
}
