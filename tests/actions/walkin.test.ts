import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrollmentStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    enrollment: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/lib/notifications/emit", () => ({
  emitNotification: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { emitNotification } from "@/lib/notifications/emit";
import { submitWalkin } from "@/app/walk-in/[eventId]/actions";

const ev = vi.mocked(prisma.event);
const usr = vi.mocked(prisma.user);
const en = vi.mocked(prisma.enrollment);
const emit = vi.mocked(emitNotification);

const validInput = {
  eventId: "ev-1",
  firstName: "Yasmine",
  lastName: "Benali",
  email: "Yasmine@Test.FR",
  phone: "0600000000",
  droitsImageAccepted: true,
};

// "Today" from the event's point of view — the window is Paris midnight of
// the event day through 06:00 the next day.
const TODAY_EVENT_DATE = new Date();

beforeEach(() => {
  vi.clearAllMocks();
  ev.findUnique.mockResolvedValue({
    id: "ev-1",
    organisationId: "org-1",
    name: "Workshop",
    date: TODAY_EVENT_DATE,
    status: "publie",
  } as never);
  usr.findUnique.mockResolvedValue(null as never);
  usr.create.mockResolvedValue({ id: "user-1", firstName: "Yasmine", lastName: "Benali" } as never);
  usr.update.mockResolvedValue({ id: "user-1", firstName: "Yasmine", lastName: "Benali" } as never);
  en.findUnique.mockResolvedValue(null as never);
  en.upsert.mockResolvedValue({ id: "enr-1" } as never);
});

describe("submitWalkin", () => {
  it("creates a présente / walk_in enrollment and returns its id", async () => {
    const res = await submitWalkin(validInput);

    expect(res).toEqual({ ok: true, enrollmentId: "enr-1" });
    expect(en.upsert).toHaveBeenCalledOnce();
    const createData = en.upsert.mock.calls[0][0].create;
    expect(createData).toMatchObject({
      eventId: "ev-1",
      userId: "user-1",
      status: EnrollmentStatus.presente,
      source: "walk_in",
      droitsImageStatus: "accepted",
    });
    expect(createData.attendedAt).toBeInstanceOf(Date);
  });

  it("normalises the email to lowercase when creating a new profile", async () => {
    await submitWalkin(validInput);
    expect(usr.findUnique.mock.calls[0][0].where).toEqual({ email: "yasmine@test.fr" });
    expect(usr.create.mock.calls[0][0].data).toMatchObject({ source: "walk_in" });
  });

  it("stores droitsImageStatus=pending when consent is not given", async () => {
    await submitWalkin({ ...validInput, droitsImageAccepted: false });
    const createData = en.upsert.mock.calls[0][0].create;
    expect(createData.droitsImageStatus).toBe("pending");
    expect(createData.droitsImageSignedAt).toBeNull();
  });

  it("emits a notification for a brand-new enrollment only", async () => {
    await submitWalkin(validInput);
    expect(emit).toHaveBeenCalledOnce();
    expect(emit.mock.calls[0][0]).toMatchObject({ type: "enrollment.created", eventId: "ev-1" });

    vi.clearAllMocks();
    ev.findUnique.mockResolvedValue({
      id: "ev-1",
      organisationId: "org-1",
      name: "Workshop",
      date: TODAY_EVENT_DATE,
      status: "publie",
    } as never);
    usr.findUnique.mockResolvedValue({ id: "user-1", firstName: "Y", lastName: "B", phone: "0600000000" } as never);
    usr.update.mockResolvedValue({ id: "user-1", firstName: "Y", lastName: "B" } as never);
    en.findUnique.mockResolvedValue({ id: "enr-1" } as never); // already enrolled
    en.upsert.mockResolvedValue({ id: "enr-1" } as never);
    await submitWalkin(validInput);
    expect(emit).not.toHaveBeenCalled();
  });

  it("rejects an invalid email with fieldErrors", async () => {
    const res = await submitWalkin({ ...validInput, email: "not-an-email" });
    expect(res.ok).toBe(false);
    expect(en.upsert).not.toHaveBeenCalled();
  });

  it("fails gracefully when the event does not exist", async () => {
    ev.findUnique.mockResolvedValue(null as never);
    const res = await submitWalkin(validInput);
    expect(res).toEqual({ ok: false, error: "Événement introuvable." });
  });

  describe("never overwrites an existing profile's identity", () => {
    it("does not touch firstName/lastName for a returning email", async () => {
      usr.findUnique.mockResolvedValue({
        id: "user-1",
        firstName: "PrénomOriginal",
        lastName: "NomOriginal",
        phone: "0600000000",
      } as never);

      await submitWalkin(validInput);

      expect(usr.create).not.toHaveBeenCalled();
      expect(usr.update).toHaveBeenCalledOnce();
      expect(usr.update.mock.calls[0][0].data).toEqual({});
    });

    it("fills in the phone only when the existing profile has none", async () => {
      usr.findUnique.mockResolvedValue({
        id: "user-1",
        firstName: "PrénomOriginal",
        lastName: "NomOriginal",
        phone: null,
      } as never);

      await submitWalkin(validInput);

      expect(usr.update.mock.calls[0][0].data).toEqual({ phone: "0600000000" });
    });
  });

  describe("walk-in window", () => {
    it("refuses walk-in for an event that already happened", async () => {
      const pastDate = new Date(Date.now() - 10 * 86400000);
      ev.findUnique.mockResolvedValue({
        id: "ev-1",
        organisationId: "org-1",
        name: "Workshop",
        date: pastDate,
        status: "publie",
      } as never);

      const res = await submitWalkin(validInput);

      expect(res.ok).toBe(false);
      expect(en.upsert).not.toHaveBeenCalled();
      expect(usr.findUnique).not.toHaveBeenCalled();
    });

    it("refuses walk-in for an event that hasn't happened yet", async () => {
      const futureDate = new Date(Date.now() + 10 * 86400000);
      ev.findUnique.mockResolvedValue({
        id: "ev-1",
        organisationId: "org-1",
        name: "Workshop",
        date: futureDate,
        status: "publie",
      } as never);

      const res = await submitWalkin(validInput);

      expect(res.ok).toBe(false);
      expect(en.upsert).not.toHaveBeenCalled();
    });

    it("refuses walk-in for a draft (brouillon) event even on the calendar day", async () => {
      ev.findUnique.mockResolvedValue({
        id: "ev-1",
        organisationId: "org-1",
        name: "Workshop",
        date: TODAY_EVENT_DATE,
        status: "brouillon",
      } as never);

      const res = await submitWalkin(validInput);

      expect(res.ok).toBe(false);
      expect(en.upsert).not.toHaveBeenCalled();
    });

    it("refuses walk-in for an archived event", async () => {
      ev.findUnique.mockResolvedValue({
        id: "ev-1",
        organisationId: "org-1",
        name: "Workshop",
        date: TODAY_EVENT_DATE,
        status: "archive",
      } as never);

      const res = await submitWalkin(validInput);

      expect(res.ok).toBe(false);
      expect(en.upsert).not.toHaveBeenCalled();
    });

    it("allows walk-in for an event happening today", async () => {
      const res = await submitWalkin(validInput);
      expect(res.ok).toBe(true);
    });
  });
});
