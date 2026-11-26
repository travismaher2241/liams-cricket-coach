import { describe, expect, it } from "vitest";
import { DEFAULT_SCHEDULE, NOTE_FALLBACKS, cleanSchedule, formatTime, nextSession, sessionNow } from "@/content/mind";

// November = AEDT (UTC+11).
describe("mind schedule", () => {
  it("shows the Monday note within 2 hours of training", () => {
    const s = sessionNow(DEFAULT_SCHEDULE, new Date("2026-11-30T03:30:00Z")); // Mon 2:30pm
    expect(s?.slot.id).toBe("mon");
    expect(s?.minutesUntil).toBe(90);
    expect(sessionNow(DEFAULT_SCHEDULE, new Date("2026-11-30T02:30:00Z"))).toBeNull(); // 1:30pm, too early
  });
  it("keeps the note a little after the start", () => {
    expect(sessionNow(DEFAULT_SCHEDULE, new Date("2026-12-02T06:20:00Z"))?.slot.kind).toBe("match"); // Wed 5:20pm
    expect(sessionNow(DEFAULT_SCHEDULE, new Date("2026-12-02T07:00:00Z"))).toBeNull(); // Wed 6pm
  });
  it("finds the next session", () => {
    expect(nextSession(DEFAULT_SCHEDULE, new Date("2026-12-01T00:00:00Z"))).toMatchObject({ slot: { id: "wed" }, daysAhead: 1 });
    expect(nextSession(DEFAULT_SCHEDULE, new Date("2026-12-03T09:00:00Z"))).toMatchObject({ slot: { id: "mon" }, daysAhead: 4 }); // Thu 8pm
  });
  it("formats and cleans", () => {
    expect(formatTime("17:15")).toBe("5:15pm");
    expect(formatTime("16:00")).toBe("4pm");
    expect(cleanSchedule([{ day: 9, time: "16:00" }, { day: 2, time: "bad" }, { day: 0, time: "09:30", kind: "match" }])).toEqual([
      { id: "s0", day: 0, time: "09:30", kind: "match", title: "Game day" },
    ]);
  });
  it("backup notes avoid negative words", () => {
    for (const t of [...NOTE_FALLBACKS.match, ...NOTE_FALLBACKS.training]) expect(t).not.toMatch(/fail|disappoint|let (\w+ )?down/i);
  });
});
