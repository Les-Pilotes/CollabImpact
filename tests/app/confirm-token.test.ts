import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { EnrollmentStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    enrollmentEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import { prisma } from "@/lib/db";
import { createActionToken } from "@/lib/tokens";
import { readConfirmState, confirmEnrollment } from "@/app/confirm/[token]/actions";

const mockFindUnique = vi.mocked(prisma.enrollment.findUnique);
const mockUpdate = vi.mocked(prisma.enrollment.update);

beforeAll(() => {
  process.env.FEEDBACK_TOKEN_SECRET = "test-secret-for-vitest-only";
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({} as never);
});

function makeEnrollment(overrides: Partial<{
  status: EnrollmentStatus;
  j2SentAt: Date | null;
  eventDate: Date;
  deletedAt: Date | null;
}> = {}) {
  return {
    id: "enr-1",
    status: overrides.status ?? EnrollmentStatus.confirmee_j7,
    j2SentAt: overrides.j2SentAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
    user: { firstName: "Yasmine" },
    event: {
      name: "Découverte métiers de la tech",
      date: overrides.eventDate ?? new Date(Date.now() + 10 * 86400000),
      address: "1 rue de la Paix, 75002 Paris",
    },
  };
}

describe("readConfirmState (read-only, must never mutate)", () => {
  it("never calls prisma.enrollment.update", async () => {
    mockFindUnique.mockResolvedValue(makeEnrollment() as never);
    const token = createActionToken("enr-1", "confirm");

    await readConfirmState(token);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 'ask' for a not-yet-confirmed enrollment far from the event", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({ status: EnrollmentStatus.inscrit, eventDate: new Date(Date.now() + 10 * 86400000) }) as never,
    );
    const token = createActionToken("enr-1", "confirm");

    const state = await readConfirmState(token);
    expect(state.outcome).toBe("ask");
  });
});

describe("confirmEnrollment — critical regression: J-7 confirm then J-2 confirm must upgrade", () => {
  it("upgrades confirmee_j7 -> confirmee_j2 when the J-2 email has been sent", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.confirmee_j7,
        j2SentAt: new Date(),
        eventDate: new Date(Date.now() + 3 * 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "confirm");

    const state = await confirmEnrollment(token);

    expect(state.outcome).toBe("confirmed");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "enr-1" },
      data: { status: EnrollmentStatus.confirmee_j2 },
    });
  });

  it("upgrades confirmee_j7 -> confirmee_j2 when the event is within 4 days, even without j2SentAt", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.confirmee_j7,
        j2SentAt: null,
        eventDate: new Date(Date.now() + 2 * 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "confirm");

    const state = await confirmEnrollment(token);

    expect(state.outcome).toBe("confirmed");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "enr-1" },
      data: { status: EnrollmentStatus.confirmee_j2 },
    });
  });

  it("does NOT upgrade confirmee_j7 when far from the event and J-2 not sent yet (nothing to do)", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.confirmee_j7,
        j2SentAt: null,
        eventDate: new Date(Date.now() + 10 * 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "confirm");

    const state = await confirmEnrollment(token);

    expect(state.outcome).toBe("already_confirmed");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("is idempotent once confirmee_j2", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({ status: EnrollmentStatus.confirmee_j2 }) as never,
    );
    const token = createActionToken("enr-1", "confirm");

    const state = await confirmEnrollment(token);

    expect(state.outcome).toBe("already_confirmed");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("moves inscrit straight to confirmee_j2 when already close to the event", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.inscrit,
        eventDate: new Date(Date.now() + 1 * 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "confirm");

    const state = await confirmEnrollment(token);

    expect(state.outcome).toBe("confirmed");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "enr-1" },
      data: { status: EnrollmentStatus.confirmee_j2 },
    });
  });

  it("refuses to confirm a terminal enrollment (desistement)", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({ status: EnrollmentStatus.desistement }) as never,
    );
    const token = createActionToken("enr-1", "confirm");

    const state = await confirmEnrollment(token);

    expect(state.outcome).toBe("terminal");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a decline token used on the confirm route", async () => {
    const token = createActionToken("enr-1", "decline");
    const state = await confirmEnrollment(token);
    expect(state.outcome).toBe("invalid");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    const token = createActionToken("enr-1", "confirm", -1);
    const state = await confirmEnrollment(token);
    expect(state.outcome).toBe("expired");
  });
});
