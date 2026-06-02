import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    admin: { id: "a-1", organisationId: "org-1", role: "ADMIN" },
    user: { email: "amadou@les-pilotes.fr" },
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { findFirst: vi.fn() },
    speaker: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
} from "@/app/admin/(protected)/events/[eventId]/intervenantes/actions";

const ev = vi.mocked(prisma.event);
const sp = vi.mocked(prisma.speaker);

const validInput = {
  eventId: "ev-1",
  firstName: "Emna",
  lastName: "Dupont",
  jobTitle: "Développeuse",
  company: "ACME",
  domain: "Informatique",
  bio: "",
  photoUrl: "",
  status: "invitee" as const,
};

beforeEach(() => vi.clearAllMocks());

describe("createSpeaker", () => {
  it("creates a speaker scoped to the admin's org", async () => {
    ev.findFirst.mockResolvedValue({ id: "ev-1" } as never);
    sp.create.mockResolvedValue({ id: "s-1" } as never);

    const res = await createSpeaker(validInput);

    expect(res.ok).toBe(true);
    const data = sp.create.mock.calls[0][0].data;
    expect(data.organisationId).toBe("org-1");
    expect(data.eventId).toBe("ev-1");
    expect(data.firstName).toBe("Emna");
    expect(data.status).toBe("invitee");
  });

  it("normalizes empty optional strings to undefined", async () => {
    ev.findFirst.mockResolvedValue({ id: "ev-1" } as never);
    sp.create.mockResolvedValue({ id: "s-1" } as never);

    await createSpeaker({ ...validInput, bio: "   ", photoUrl: "" });

    const data = sp.create.mock.calls[0][0].data;
    expect(data.bio).toBeUndefined();
    expect(data.photoUrl).toBeUndefined();
  });

  it("rejects missing first/last name", async () => {
    const res = await createSpeaker({ ...validInput, firstName: "", lastName: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.fieldErrors?.firstName).toBeDefined();
      expect(res.fieldErrors?.lastName).toBeDefined();
    }
    expect(sp.create).not.toHaveBeenCalled();
  });

  it("refuses to create on an event outside the admin's org", async () => {
    ev.findFirst.mockResolvedValue(null as never);

    const res = await createSpeaker(validInput);

    expect(res.ok).toBe(false);
    expect(sp.create).not.toHaveBeenCalled();
  });

  it("returns not-authorized when requireAdmin throws", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("denied"));
    const res = await createSpeaker(validInput);
    expect(res.ok).toBe(false);
    expect(sp.create).not.toHaveBeenCalled();
  });
});

describe("updateSpeaker", () => {
  it("updates an existing speaker in the org", async () => {
    sp.findFirst.mockResolvedValue({ id: "s-1" } as never);
    sp.update.mockResolvedValue({ id: "s-1" } as never);

    const res = await updateSpeaker("s-1", { ...validInput, jobTitle: "CTO" });

    expect(res.ok).toBe(true);
    expect(sp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s-1" },
        data: expect.objectContaining({ jobTitle: "CTO" }),
      }),
    );
  });

  it("clears optional fields to null when emptied", async () => {
    sp.findFirst.mockResolvedValue({ id: "s-1" } as never);
    sp.update.mockResolvedValue({ id: "s-1" } as never);

    await updateSpeaker("s-1", { ...validInput, company: "", domain: "" });

    const data = sp.update.mock.calls[0][0].data;
    expect(data.company).toBeNull();
    expect(data.domain).toBeNull();
  });

  it("refuses to update a speaker from another org", async () => {
    sp.findFirst.mockResolvedValue(null as never);
    const res = await updateSpeaker("s-x", validInput);
    expect(res.ok).toBe(false);
    expect(sp.update).not.toHaveBeenCalled();
  });
});

describe("deleteSpeaker", () => {
  it("soft-deletes by setting deletedAt", async () => {
    sp.findFirst.mockResolvedValue({ id: "s-1" } as never);
    sp.update.mockResolvedValue({ id: "s-1" } as never);

    const res = await deleteSpeaker("s-1", "ev-1");

    expect(res.ok).toBe(true);
    const data = sp.update.mock.calls[0][0].data;
    expect(data.deletedAt).toBeInstanceOf(Date);
  });

  it("refuses to delete a speaker from another org", async () => {
    sp.findFirst.mockResolvedValue(null as never);
    const res = await deleteSpeaker("s-x", "ev-1");
    expect(res.ok).toBe(false);
    expect(sp.update).not.toHaveBeenCalled();
  });
});
