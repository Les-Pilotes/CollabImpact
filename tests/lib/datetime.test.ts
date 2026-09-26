import { describe, it, expect } from "vitest";
import { combineParisDateTime, splitParisDateTime, isWalkinWindowOpen } from "@/lib/datetime";

describe("combineParisDateTime", () => {
  it("converts summer time (UTC+2) correctly: 09:30 Paris = 07:30 UTC", () => {
    const date = combineParisDateTime("2026-09-12", "09:30");
    expect(date.getUTCHours()).toBe(7);
    expect(date.getUTCMinutes()).toBe(30);
  });

  it("converts winter time (UTC+1) correctly: 09:30 Paris = 08:30 UTC", () => {
    const date = combineParisDateTime("2026-01-15", "09:30");
    expect(date.getUTCHours()).toBe(8);
    expect(date.getUTCMinutes()).toBe(30);
  });
});

describe("splitParisDateTime — regression for the Informations save timezone shift", () => {
  it("is the exact inverse of combineParisDateTime in summer (UTC+2)", () => {
    const combined = combineParisDateTime("2026-09-12", "09:30");
    const split = splitParisDateTime(combined);
    expect(split).toEqual({ date: "2026-09-12", time: "09:30" });
  });

  it("is the exact inverse of combineParisDateTime in winter (UTC+1)", () => {
    const combined = combineParisDateTime("2026-01-15", "18:45");
    const split = splitParisDateTime(combined);
    expect(split).toEqual({ date: "2026-01-15", time: "18:45" });
  });

  it("differs from naively slicing the raw UTC ISO string (the actual bug)", () => {
    const combined = combineParisDateTime("2026-01-15", "09:30");
    const naiveUtcSlice = {
      date: combined.toISOString().slice(0, 10),
      time: combined.toISOString().slice(11, 16),
    };
    // The bug: naive slicing shows 08:30 (UTC) instead of 09:30 (Paris).
    expect(naiveUtcSlice.time).toBe("08:30");
    expect(splitParisDateTime(combined).time).toBe("09:30");
  });

  it("round-trips across a UTC day boundary (late Paris evening)", () => {
    // 23:15 Paris in summer is 21:15 UTC — no day rollover in this case,
    // but 01:15 Paris is the day AFTER 23:15 UTC the previous day.
    const combined = combineParisDateTime("2026-09-13", "01:15");
    expect(splitParisDateTime(combined)).toEqual({ date: "2026-09-13", time: "01:15" });
  });
});

describe("isWalkinWindowOpen", () => {
  const eventNoon = combineParisDateTime("2026-06-12", "12:00"); // event day, Paris

  it("is open right at the start of the event day (Paris midnight)", () => {
    const justAfterMidnight = combineParisDateTime("2026-06-12", "00:01");
    expect(isWalkinWindowOpen(eventNoon, justAfterMidnight)).toBe(true);
  });

  it("is open during the event itself", () => {
    expect(isWalkinWindowOpen(eventNoon, eventNoon)).toBe(true);
  });

  it("is open late the same evening", () => {
    const lateEvening = combineParisDateTime("2026-06-12", "23:30");
    expect(isWalkinWindowOpen(eventNoon, lateEvening)).toBe(true);
  });

  it("is open just after midnight into the next day (05:59)", () => {
    const stillOpen = combineParisDateTime("2026-06-13", "05:59");
    expect(isWalkinWindowOpen(eventNoon, stillOpen)).toBe(true);
  });

  it("closes at 06:00 the next day", () => {
    const closed = combineParisDateTime("2026-06-13", "06:00");
    expect(isWalkinWindowOpen(eventNoon, closed)).toBe(false);
  });

  it("is closed the day before the event", () => {
    const dayBefore = combineParisDateTime("2026-06-11", "23:59");
    expect(isWalkinWindowOpen(eventNoon, dayBefore)).toBe(false);
  });

  it("is closed a week after the event", () => {
    const weekAfter = combineParisDateTime("2026-06-19", "12:00");
    expect(isWalkinWindowOpen(eventNoon, weekAfter)).toBe(false);
  });
});
