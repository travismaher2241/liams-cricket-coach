import type { Match } from "@/db/schema";

/** Overs are stored as legal balls. 15 balls -> "2.3". */
export function ballsToOvers(balls: number): string {
  return `${Math.floor(balls / 6)}${balls % 6 ? "." + (balls % 6) : ""}`;
}

/** "2.3" -> 15. Returns null for invalid input (e.g. "2.7"). */
export function oversToBalls(overs: string): number | null {
  const m = overs.trim().match(/^(\d+)(?:\.(\d))?$/);
  if (!m) return null;
  const part = Number(m[2] ?? 0);
  if (part > 5) return null;
  return Number(m[1]) * 6 + part;
}

const sum = (xs: (number | null | undefined)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);
const known = <T>(xs: (T | null | undefined)[]) => xs.filter((x): x is T => x !== null && x !== undefined);

export interface BattingStats {
  matches: number;
  innings: number;
  runs: number;
  highest: { runs: number; notOut: boolean } | null;
  average: number | null;
  strikeRate: number | null;
  notOuts: number;
  fours: number | null;
  sixes: number | null;
  ducks: number;
  fifties: number;
}

export function battingStats(ms: Match[]): BattingStats {
  const inns = ms.filter((m) => m.batted && m.runs !== null);
  const outs = inns.filter((m) => m.battingStatus === "out");
  const runs = sum(inns.map((m) => m.runs));
  let highest: BattingStats["highest"] = null;
  for (const m of inns) {
    const notOut = m.battingStatus !== "out";
    if (!highest || m.runs! > highest.runs || (m.runs === highest.runs && notOut && !highest.notOut)) {
      highest = { runs: m.runs!, notOut };
    }
  }
  // Strike rate only from innings where balls faced is known.
  const withBalls = inns.filter((m) => m.balls !== null && m.balls! > 0);
  const sr = withBalls.length ? (sum(withBalls.map((m) => m.runs)) / sum(withBalls.map((m) => m.balls))) * 100 : null;
  const fourVals = known(inns.map((m) => m.fours));
  const sixVals = known(inns.map((m) => m.sixes));
  return {
    matches: ms.length,
    innings: inns.length,
    runs,
    highest,
    average: outs.length ? runs / outs.length : null,
    strikeRate: sr,
    notOuts: inns.length - outs.length,
    fours: fourVals.length ? sum(fourVals) : null,
    sixes: sixVals.length ? sum(sixVals) : null,
    ducks: outs.filter((m) => m.runs === 0).length,
    fifties: inns.filter((m) => (m.runs ?? 0) >= 50).length,
  };
}

export interface BowlingStats {
  innings: number;
  balls: number;
  overs: string;
  wickets: number;
  runs: number;
  best: { wickets: number; runs: number } | null;
  average: number | null;
  economy: number | null;
  strikeRate: number | null;
  maidens: number | null;
}

export function bowlingStats(ms: Match[]): BowlingStats {
  const inns = ms.filter((m) => m.bowled && m.ballsBowled !== null);
  const balls = sum(inns.map((m) => m.ballsBowled));
  const wickets = sum(inns.map((m) => m.wickets));
  // Runs-based figures only use innings where runs conceded is known.
  const withRuns = inns.filter((m) => m.runsConceded !== null);
  const runs = sum(withRuns.map((m) => m.runsConceded));
  const ballsWithRuns = sum(withRuns.map((m) => m.ballsBowled));
  const wktsWithRuns = sum(withRuns.map((m) => m.wickets));
  let best: BowlingStats["best"] = null;
  for (const m of withRuns) {
    const w = m.wickets ?? 0;
    const r = m.runsConceded!;
    if (!best || w > best.wickets || (w === best.wickets && r < best.runs)) best = { wickets: w, runs: r };
  }
  const maidenVals = known(inns.map((m) => m.maidens));
  return {
    innings: inns.length,
    balls,
    overs: ballsToOvers(balls),
    wickets,
    runs,
    best,
    average: wktsWithRuns ? runs / wktsWithRuns : null,
    economy: ballsWithRuns ? runs / (ballsWithRuns / 6) : null,
    strikeRate: wickets ? balls / wickets : null,
    maidens: maidenVals.length ? sum(maidenVals) : null,
  };
}

export function fieldingStats(ms: Match[]) {
  return {
    catches: sum(ms.map((m) => m.catches)),
    runOuts: sum(ms.map((m) => m.runOuts)),
    stumpings: sum(ms.map((m) => m.stumpings)),
  };
}

export const fmt = (n: number | null, dp = 2) => (n === null ? "–" : n.toFixed(dp));
