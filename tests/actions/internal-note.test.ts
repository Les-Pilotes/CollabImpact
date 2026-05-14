import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    admin: { id: "admin-1", organisationId: "org-1", email: "a@test.com", role: "ADMIN" },
    user: { email: "a@test.com" },
  }),
  requireSuperAdmin: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { updateInternalNote } from "@/app/admin/(protected)/events/[eventId]/inscrites/[enrollmentId]/actions";

const enroll = vi.mocked(prisma.enrollment);

describe("updateInternalNote", () => {
  beforeEach(() => vi.clearAllMocks());

  it("trims and persists a non-empty note", async () => {
    enroll.findUnique.mockResolvedValue({ eventId: "ev-1" } as never);
    enroll.update.mockResolvedValue({} as never);

    const result = await updateInternalNote("en-1", "  À rappeler  \n");

    expect(result.ok).toBe(true);
    expect(enroll.update).toHaveBeenCalledWith({
      where: { id: "en-1" },
      data: { internalNote: "À rappeler" },
    });
  });

  it("clears the note when given whitespace-only input", async () => {
    enroll.findUnique.mockResolvedValue({ eventId: "ev-1" } as never);
    enroll.update.mockResolvedValue({} as never);

    const result = await updateInternalNote("en-1", "   \n  ");

    expect(result.ok).toBe(true);
    const args = enroll.update.mock.calls[0][0];
    expect(args.data.internalNote).toBeNull();
  });

  it("returns an error when the enrollment is not found", async () => {
    enroll.findUnique.mockResolvedValue(null as never);

    const result = await updateInternalNote("missing", "hello");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/introuvable/i);
    expect(enroll.update).not.toHaveBeenCalled();
  });

  it("rejects notes that exceed the max length", async () => {
    const tooLong = "x".repeat(5001);
    const result = await updateInternalNote("en-1", tooLong);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/5000/);
    expect(enroll.findUnique).not.toHaveBeenCalled();
    expect(enroll.update).not.toHaveBeenCalled();
  });
});
