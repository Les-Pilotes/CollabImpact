import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { EnrollmentStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { createActionToken } from "@/lib/tokens";
import { readDeclineState, declineEnrollment, undoDecline } from "@/app/decline/[token]/actions";

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
  j7SentAt: Date | null;
  j2SentAt: Date | null;
  eventDate: Date;
  deletedAt: Date | null;
}> = {}) {
  return {
    id: "enr-1",
    status: overrides.status ?? EnrollmentStatus.confirmee_j7,
    j7SentAt: "j7SentAt" in overrides ? overrides.j7SentAt! : new Date(),
    j2SentAt: overrides.j2SentAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
    user: { firstName: "Yasmine" },
    event: {
      name: "Découverte métiers de la tech",
      date: overrides.eventDate ?? new Date(Date.now() + 10 * 86400000),
    },
  };
}

describe("readDeclineState — critical: opening the link must NEVER mutate", () => {
  it("does not call prisma.enrollment.update for a fresh, actionable enrollment", async () => {
    mockFindUnique.mockResolvedValue(makeEnrollment() as never);
    const token = createActionToken("enr-1", "decline");

    const state = await readDeclineState(token);

    expect(state.outcome).toBe("ask");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not call update even for an already-terminal enrollment", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({ status: EnrollmentStatus.presente }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await readDeclineState(token);

    expect(state.outcome).toBe("terminal");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("reports canUndo=true for an upcoming event already declined", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.desistement,
        eventDate: new Date(Date.now() + 5 * 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await readDeclineState(token);
    expect(state).toMatchObject({ outcome: "already_declined", canUndo: true });
  });

  it("reports canUndo=false once the event has passed", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.desistement,
        eventDate: new Date(Date.now() - 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await readDeclineState(token);
    expect(state).toMatchObject({ outcome: "already_declined", canUndo: false });
  });
});

describe("declineEnrollment (POST-only mutation)", () => {
  it("sets status to desistement", async () => {
    mockFindUnique.mockResolvedValue(makeEnrollment() as never);
    const token = createActionToken("enr-1", "decline");

    const state = await declineEnrollment(token);

    expect(state.outcome).toBe("declined");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "enr-1" },
      data: { status: EnrollmentStatus.desistement },
    });
  });

  it("is idempotent — declining twice does not error and does not double-write", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({ status: EnrollmentStatus.desistement }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await declineEnrollment(token);

    expect(state.outcome).toBe("already_declined");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses to decline a terminal enrollment (presente)", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({ status: EnrollmentStatus.presente }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await declineEnrollment(token);

    expect(state.outcome).toBe("terminal");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a confirm token used on the decline route", async () => {
    const token = createActionToken("enr-1", "confirm");
    const state = await declineEnrollment(token);
    expect(state.outcome).toBe("invalid");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

describe("undoDecline", () => {
  it("restores confirmee_j7 when the J-2 reminder had already been sent", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.desistement,
        j2SentAt: new Date(),
        eventDate: new Date(Date.now() + 3 * 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await undoDecline(token);

    expect(state.outcome).toBe("undone");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "enr-1" },
      data: { status: EnrollmentStatus.confirmee_j7 },
    });
  });

  it("restores inscrit when no reminder had been sent yet", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.desistement,
        j7SentAt: null,
        j2SentAt: null,
        eventDate: new Date(Date.now() + 10 * 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await undoDecline(token);

    expect(state.outcome).toBe("undone");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "enr-1" },
      data: { status: EnrollmentStatus.inscrit },
    });
  });

  it("refuses to undo once the event has passed", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({
        status: EnrollmentStatus.desistement,
        eventDate: new Date(Date.now() - 86400000),
      }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await undoDecline(token);

    expect(state.outcome).toBe("terminal");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses to undo when the enrollment isn't currently declined", async () => {
    mockFindUnique.mockResolvedValue(
      makeEnrollment({ status: EnrollmentStatus.confirmee_j7 }) as never,
    );
    const token = createActionToken("enr-1", "decline");

    const state = await undoDecline(token);

    expect(state.outcome).toBe("terminal");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
