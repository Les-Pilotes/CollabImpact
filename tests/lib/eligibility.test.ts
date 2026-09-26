import { describe, it, expect } from "vitest";
import { EnrollmentStatus } from "@prisma/client";
import {
  isAttendanceLocked,
  isDeclineLocked,
  isFeedbackEligible,
  canWalkIn,
  isInReminderWindow,
} from "@/lib/enrollment/eligibility";

describe("isAttendanceLocked (confirm + checkin)", () => {
  it("locks absente, desistement and feedback_recu", () => {
    expect(isAttendanceLocked(EnrollmentStatus.absente)).toBe(true);
    expect(isAttendanceLocked(EnrollmentStatus.desistement)).toBe(true);
    expect(isAttendanceLocked(EnrollmentStatus.feedback_recu)).toBe(true);
  });

  it("does not lock presente — checking in twice must stay idempotent", () => {
    expect(isAttendanceLocked(EnrollmentStatus.presente)).toBe(false);
  });

  it("does not lock the pre-confirmation statuses", () => {
    expect(isAttendanceLocked(EnrollmentStatus.inscrit)).toBe(false);
    expect(isAttendanceLocked(EnrollmentStatus.contactee)).toBe(false);
    expect(isAttendanceLocked(EnrollmentStatus.confirmee_j7)).toBe(false);
    expect(isAttendanceLocked(EnrollmentStatus.confirmee_j2)).toBe(false);
  });
});

describe("isDeclineLocked", () => {
  it("locks absente, presente and feedback_recu — she can't decline once it's over", () => {
    expect(isDeclineLocked(EnrollmentStatus.absente)).toBe(true);
    expect(isDeclineLocked(EnrollmentStatus.presente)).toBe(true);
    expect(isDeclineLocked(EnrollmentStatus.feedback_recu)).toBe(true);
  });

  it("does not lock desistement — declining twice is the idempotent case", () => {
    expect(isDeclineLocked(EnrollmentStatus.desistement)).toBe(false);
  });
});

describe("isFeedbackEligible", () => {
  it("only presente can submit feedback", () => {
    expect(isFeedbackEligible(EnrollmentStatus.presente)).toBe(true);
    expect(isFeedbackEligible(EnrollmentStatus.feedback_recu)).toBe(false);
    expect(isFeedbackEligible(EnrollmentStatus.confirmee_j2)).toBe(false);
    expect(isFeedbackEligible(EnrollmentStatus.absente)).toBe(false);
  });
});

describe("canWalkIn", () => {
  const today = new Date();

  it("is true for a published event on its own day", () => {
    expect(canWalkIn({ status: "publie", date: today })).toBe(true);
  });

  it("is false for a brouillon event even on its own day", () => {
    expect(canWalkIn({ status: "brouillon", date: today })).toBe(false);
  });

  it("is false for an archived event", () => {
    expect(canWalkIn({ status: "archive", date: today })).toBe(false);
  });

  it("is false outside the event's day window", () => {
    const farFuture = new Date(Date.now() + 30 * 86400000);
    expect(canWalkIn({ status: "publie", date: farFuture })).toBe(false);
  });
});

describe("isInReminderWindow", () => {
  it("matches the J-7 window (3..7 days out)", () => {
    const now = new Date("2026-06-05T08:00:00Z");
    expect(isInReminderWindow(new Date("2026-06-12T14:00:00Z"), 3, 7, now)).toBe(true);
    expect(isInReminderWindow(new Date("2026-06-13T14:00:00Z"), 3, 7, now)).toBe(false);
  });

  it("matches the J-2 window (1..2 days out)", () => {
    const now = new Date("2026-06-10T08:00:00Z");
    expect(isInReminderWindow(new Date("2026-06-12T14:00:00Z"), 1, 2, now)).toBe(true);
    expect(isInReminderWindow(new Date("2026-06-13T14:00:00Z"), 1, 2, now)).toBe(false);
  });
});
