import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImmersionStatus } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    admin: { id: "admin-1", organisationId: "org-1", email: "a@test.com", role: "ADMIN" },
    user: { email: "a@test.com" },
  }),
  requireSuperAdmin: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from "@/lib/db";
import {
  createEvent,
  updateEvent,
  transitionEventStatus,
  deleteEvent,
} from "@/app/admin/(protected)/events/actions";

const ev = vi.mocked(prisma.event);

describe("createEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an event with status=brouillon from valid input", async () => {
    ev.create.mockResolvedValue({ id: "new-event-1" } as never);

    const result = await createEvent({
      name: "Workshop édition 7",
      type: "FEMININ",
      date: "2026-09-12",
      time: "09:30",
      address: "9 rue de Vaugirard, Paris",
      capacity: 30,
      description: undefined,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe("new-event-1");
    expect(ev.create).toHaveBeenCalledOnce();
    const args = ev.create.mock.calls[0][0];
    expect(args.data.status).toBe("brouillon");
    expect(args.data.organisationId).toBe("org-1");
    expect((args.data.date as Date).getFullYear()).toBe(2026);
  });

  it("rejects invalid input with fieldErrors", async () => {
    const result = await createEvent({
      name: "",
      type: "FEMININ",
      date: "not-a-date",
      time: "09:30",
      address: "",
      capacity: -1,
    } as never);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.fieldErrors?.date).toBeDefined();
      expect(result.fieldErrors?.capacity).toBeDefined();
    }
  });
});

describe("updateEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears optional email fields when given empty strings", async () => {
    ev.update.mockResolvedValue({} as never);

    await updateEvent("ev-1", {
      name: "Test",
      type: "FEMININ",
      date: "2026-09-12",
      time: "09:30",
      address: "Paris",
      capacity: 30,
      replyToEmail: "",
      emailSignature: "   ",
    });

    const args = ev.update.mock.calls[0][0];
    expect(args.data.replyToEmail).toBeNull();
    expect(args.data.emailSignature).toBeNull();
  });

  it("trims and persists non-empty email fields", async () => {
    ev.update.mockResolvedValue({} as never);

    await updateEvent("ev-1", {
      name: "Test",
      type: "FEMININ",
      date: "2026-09-12",
      time: "09:30",
      address: "Paris",
      capacity: 30,
      replyToEmail: " amadou@les-pilotes.fr ",
      emailSignature: "Léa & Amadou\nLes Pilotes",
    });

    const args = ev.update.mock.calls[0][0];
    expect(args.data.replyToEmail).toBe("amadou@les-pilotes.fr");
    expect(args.data.emailSignature).toBe("Léa & Amadou\nLes Pilotes");
  });
});

describe("transitionEventStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows brouillon → publie", async () => {
    ev.findUnique.mockResolvedValue({ status: ImmersionStatus.brouillon } as never);
    ev.update.mockResolvedValue({} as never);

    const result = await transitionEventStatus("ev-1", ImmersionStatus.publie);

    expect(result.ok).toBe(true);
    expect(ev.update).toHaveBeenCalledWith({
      where: { id: "ev-1" },
      data: { status: ImmersionStatus.publie },
    });
  });

  it("rejects brouillon → en_cours (skipping publie)", async () => {
    ev.findUnique.mockResolvedValue({ status: ImmersionStatus.brouillon } as never);

    const result = await transitionEventStatus("ev-1", ImmersionStatus.en_cours);

    expect(result.ok).toBe(false);
    expect(ev.update).not.toHaveBeenCalled();
  });

  it("allows archive from any non-archive state", async () => {
    ev.findUnique.mockResolvedValue({ status: ImmersionStatus.termine } as never);
    ev.update.mockResolvedValue({} as never);

    const result = await transitionEventStatus("ev-1", ImmersionStatus.archive);
    expect(result.ok).toBe(true);
  });

  it("returns error when event not found", async () => {
    ev.findUnique.mockResolvedValue(null as never);

    const result = await transitionEventStatus("missing", ImmersionStatus.publie);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/introuvable/i);
  });
});

describe("deleteEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("soft-deletes by setting deletedAt", async () => {
    ev.update.mockResolvedValue({} as never);

    const result = await deleteEvent("ev-1");

    expect(result.ok).toBe(true);
    const args = ev.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: "ev-1", deletedAt: null });
    expect(args.data.deletedAt).toBeInstanceOf(Date);
  });
});
