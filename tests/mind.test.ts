import { describe, expect, it } from "vitest";
import { DEFAULT_SCHEDULE, LESSONS, NOTE_FALLBACKS, RESET_STEPS, cleanSchedule, formatTime, isDistress, nextSession, sessionDueForAfterPush, sessionEndedToday, sessionDueForPush, sessionNow } from "@/content/mind";

// November = AEDT (UTC+11).
describe("mind schedule", () => {
  it("shows the Monday note within 2.5 hours of training", () => {
    const s = sessionNow(DEFAULT_SCHEDULE, new Date("2026-11-30T03:30:00Z")); // Mon 2:30pm
    expect(s?.slot.id).toBe("mon");
    expect(s?.minutesUntil).toBe(90);
    expect(sessionNow(DEFAULT_SCHEDULE, new Date("2026-11-30T01:20:00Z"))).toBeNull(); // 12:20pm, too early
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
  it("sends the phone notification 30 to 150 minutes before", () => {
    expect(sessionDueForPush(DEFAULT_SCHEDULE, new Date("2026-12-03T04:15:00Z"))?.slot.id).toBe("thu"); // Thu 3:15pm, 2h before 5:15
    expect(sessionDueForPush(DEFAULT_SCHEDULE, new Date("2026-12-03T05:55:00Z"))).toBeNull(); // 4:55pm, 20 min before
    expect(sessionDueForPush(DEFAULT_SCHEDULE, new Date("2026-12-03T03:00:00Z"))).toBeNull(); // 2pm, too early
  });
  it("covers bowling and fielding, not just batting", () => {
    expect(LESSONS.map((l) => l.id)).toEqual(expect.arrayContaining(["ok-to-get-out", "hit-for-four", "misfields"]));
    expect(Object.keys(RESET_STEPS)).toEqual(["out", "hit", "misfield"]);
  });
  it("spots thoughts that need a grown-up, not normal cricket nerves", () => {
    expect(isDistress("I feel like nobody likes me at cricket")).toBe(true);
    expect(isDistress("I'm nervous about getting out on Wednesday")).toBe(false);
    expect(isDistress("I got hit for six and felt bad")).toBe(false);
  });
  it("reminds him to add an update after the session ends", () => {
    expect(sessionDueForAfterPush(DEFAULT_SCHEDULE, new Date("2026-11-30T06:50:00Z"))?.slot.id).toBe("mon"); // Mon 5:50pm, 20 min after 5:30 end
    expect(sessionDueForAfterPush(DEFAULT_SCHEDULE, new Date("2026-11-30T06:35:00Z"))).toBeNull(); // 5:35pm, too soon
    expect(sessionDueForAfterPush(DEFAULT_SCHEDULE, new Date("2026-12-02T08:50:00Z"))?.slot.kind).toBe("match"); // Wed 7:50pm
    expect(sessionDueForAfterPush([{ ...DEFAULT_SCHEDULE[0], durationMin: 60 }], new Date("2026-11-30T06:20:00Z"))?.slot.id).toBe("mon"); // 1h session
    expect(sessionEndedToday(DEFAULT_SCHEDULE, new Date("2026-11-30T09:00:00Z"))?.slot.id).toBe("mon"); // 8pm
    expect(sessionEndedToday(DEFAULT_SCHEDULE, new Date("2026-11-30T05:00:00Z"))).toBeNull(); // 4pm, still on
  });
});
