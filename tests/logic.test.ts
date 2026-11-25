import { describe, it, expect } from "vitest";
import { nextLevel, buildWeeklyQuiz, reinforcementConcepts, weekKey, type AnswerHistory } from "@/lib/quizEngine";
import { CONCEPTS, CONCEPT_BY_ID } from "@/content/quiz";
import { oversToBalls, ballsToOvers, battingStats, bowlingStats } from "@/lib/stats";
import { recommend } from "@/lib/recommend";
import type { Match } from "@/db/schema";

describe("quiz progression", () => {
  it("75% exactly keeps the level", () => expect(nextLevel(1, 15, 20)).toEqual({ level: 1, levelUp: false }));
  it("above 75% unlocks", () => expect(nextLevel(1, 16, 20)).toEqual({ level: 2, levelUp: true }));
  it("low score never drops level", () => expect(nextLevel(3, 2, 20).level).toBe(3));
});

describe("weekly quiz builder", () => {
  it("builds 20 unique concepts at level 1", () => {
    const q = buildWeeklyQuiz(1, [], 42);
    expect(q).toHaveLength(20);
    expect(new Set(q.map((x) => x.conceptId)).size).toBe(20);
  });
  it("builds 20 at the highest level too", () => {
    expect(buildWeeklyQuiz(9, [], 7)).toHaveLength(20);
  });
  it("every missed concept returns next week with different wording", () => {
    const first = buildWeeklyQuiz(1, [], 1);
    const at = new Date("2026-11-20");
    const history: AnswerHistory[] = first.map((q, i) => ({
      conceptId: q.conceptId, questionId: q.id, correct: i >= 5, kind: "weekly", attemptId: 1, at,
    }));
    const missed = reinforcementConcepts(history);
    expect(missed).toHaveLength(5);
    const next = buildWeeklyQuiz(1, history, 2);
    for (const c of missed) {
      const q = next.find((x) => x.conceptId === c);
      expect(q).toBeDefined();
      const prev = first.find((x) => x.conceptId === c)!;
      expect(q!.q).not.toBe(prev.q);
    }
  });
  it("answer index points at the right option after shuffling", () => {
    for (const q of buildWeeklyQuiz(2, [], 99)) {
      const [cid, vi] = q.id.split("#");
      const v = CONCEPT_BY_ID[cid].variants[Number(vi)];
      expect(q.options[q.answer]).toBe(v.options[v.answer]);
    }
  });
  it("every concept has 2+ variants with valid answers", () => {
    for (const c of CONCEPTS) {
      expect(c.variants.length).toBeGreaterThanOrEqual(2);
      for (const v of c.variants) expect(v.answer).toBeLessThan(v.options.length);
    }
  });
  it("week keys are Monday-based in Melbourne", () => {
    // Sunday 11pm UTC = Monday 10am Melbourne
    expect(weekKey(new Date("2026-11-29T23:00:00Z"))).toBe("2026-W49");
    expect(weekKey(new Date("2026-11-25T08:00:00Z"))).toBe("2026-W48");
  });
});

const m = (p: Partial<Match>): Match => ({
  id: 1, playerId: 1, matchDate: "2026-11-01", team: null, opposition: null, competition: null, season: null, format: null, result: null,
  batted: false, runs: null, balls: null, fours: null, sixes: null, battingStatus: null, howOut: null,
  bowled: false, ballsBowled: null, runsConceded: null, wickets: null, maidens: null, wides: null, noBalls: null,
  catches: null, runOuts: null, stumpings: null, isHistorical: false, editedByParent: false, createdAt: new Date(), ...p,
});

describe("stats", () => {
  it("handles incomplete overs", () => {
    expect(oversToBalls("2.3")).toBe(15);
    expect(oversToBalls("2.6")).toBeNull();
    expect(ballsToOvers(15)).toBe("2.3");
  });
  it("averages by dismissals, retired counts as not out, unknowns stay unknown", () => {
    const s = battingStats([
      m({ batted: true, runs: 20, battingStatus: "out", balls: 40 }),
      m({ batted: true, runs: 25, battingStatus: "retired" }),
      m({ batted: true, runs: 0, battingStatus: "out", balls: 3, fours: 0 }),
    ]);
    expect(s.runs).toBe(45);
    expect(s.average).toBe(22.5);
    expect(s.notOuts).toBe(1);
    expect(s.ducks).toBe(1);
    expect(s.strikeRate).toBeCloseTo((20 / 43) * 100);
    expect(s.sixes).toBeNull();
    expect(s.highest).toEqual({ runs: 25, notOut: true });
  });
  it("bowling economy and best figures", () => {
    const s = bowlingStats([
      m({ bowled: true, ballsBowled: 12, runsConceded: 10, wickets: 1 }),
      m({ bowled: true, ballsBowled: 9, runsConceded: 4, wickets: 1 }),
    ]);
    expect(s.overs).toBe("3.3");
    expect(s.economy).toBeCloseTo(14 / 3.5);
    expect(s.best).toEqual({ wickets: 1, runs: 4 });
  });
});

describe("recommend", () => {
  it("respects equipment and programme focus", () => {
    const list = recommend({ equipment: ["bat"], spaces: [], priorities: {}, programmeTags: ["power"], recent: [], now: new Date() });
    expect(list.every((d) => d.equipment.every((e) => e === "bat" || e === "none"))).toBe(true);
    expect(list[0].tags).toContain("power");
  });
});

describe("bowling with unknown runs", () => {
  it("doesn't invent economy when runs are unknown", () => {
    const s = bowlingStats([m({ bowled: true, ballsBowled: 12, runsConceded: null, wickets: 0 })]);
    expect(s.economy).toBeNull();
    expect(s.best).toBeNull();
    expect(s.overs).toBe("2");
  });
});
