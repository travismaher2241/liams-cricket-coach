const int = (v: unknown, max = 1000): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};

export interface MatchPayload {
  matchDate: string;
  team?: string;
  opposition?: string;
  competition?: string;
  season?: string;
  format?: string;
  result?: string;
  batted: boolean;
  runs?: number | null;
  balls?: number | null;
  fours?: number | null;
  sixes?: number | null;
  battingStatus?: "out" | "not_out" | "retired" | null;
  howOut?: string | null;
  bowled: boolean;
  ballsBowled?: number | null;
  runsConceded?: number | null;
  wickets?: number | null;
  maidens?: number | null;
  wides?: number | null;
  noBalls?: number | null;
  catches?: number | null;
  runOuts?: number | null;
  stumpings?: number | null;
}

export function cleanMatch(p: MatchPayload) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.matchDate) ? p.matchDate : new Date().toISOString().slice(0, 10);
  const t = (s?: string) => (s && s.trim() ? s.trim().slice(0, 80) : null);
  return {
    matchDate: date,
    team: t(p.team),
    opposition: t(p.opposition),
    competition: t(p.competition),
    season: t(p.season),
    format: t(p.format),
    result: t(p.result),
    batted: !!p.batted,
    runs: p.batted ? int(p.runs) : null,
    balls: p.batted ? int(p.balls) : null,
    fours: p.batted ? int(p.fours, 100) : null,
    sixes: p.batted ? int(p.sixes, 100) : null,
    battingStatus: p.batted ? (p.battingStatus ?? null) : null,
    howOut: p.batted && p.battingStatus === "out" ? t(p.howOut ?? undefined) : null,
    bowled: !!p.bowled,
    ballsBowled: p.bowled ? int(p.ballsBowled, 600) : null,
    runsConceded: p.bowled ? int(p.runsConceded) : null,
    wickets: p.bowled ? int(p.wickets, 10) : null,
    maidens: p.bowled ? int(p.maidens, 100) : null,
    wides: p.bowled ? int(p.wides, 100) : null,
    noBalls: p.bowled ? int(p.noBalls, 100) : null,
    catches: int(p.catches, 20),
    runOuts: int(p.runOuts, 20),
    stumpings: int(p.stumpings, 20),
  };
}

