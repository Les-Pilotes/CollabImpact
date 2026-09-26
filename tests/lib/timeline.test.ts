import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollmentEvent: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { logEnrollmentEvent } from "@/lib/enrollment/timeline";

const mockCreate = vi.mocked(prisma.enrollmentEvent.create);

beforeEach(() => vi.clearAllMocks());

describe("logEnrollmentEvent", () => {
  it("writes the row with the given type, label and metadata", async () => {
    mockCreate.mockResolvedValue({} as never);

    await logEnrollmentEvent({
      enrollmentId: "enr-1",
      type: "checked_in",
      label: "Présente — émargement Jour J",
      metadata: { source: "walk_in" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        enrollmentId: "enr-1",
        type: "checked_in",
        label: "Présente — émargement Jour J",
        metadata: { source: "walk_in" },
      },
    });
  });

  it("never throws even when the write fails — a timeline gap must not break the caller", async () => {
    mockCreate.mockRejectedValue(new Error("db blip"));

    await expect(
      logEnrollmentEvent({ enrollmentId: "enr-1", type: "status_changed", label: "Test" }),
    ).resolves.toBeUndefined();
  });
});
