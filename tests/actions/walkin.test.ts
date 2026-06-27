import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrollmentStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { upsert: vi.fn() },
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

beforeEach(() => {
  vi.clearAllMocks();
  ev.findUnique.mockResolvedValue({ id: "ev-1", organisationId: "org-1", name: "Workshop" } as never);
  usr.upsert.mockResolvedValue({ id: "user-1", firstName: "Yasmine", lastName: "Benali" } as never);
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

  it("normalises the email to lowercase on the User", async () => {
    await submitWalkin(validInput);
    expect(usr.upsert.mock.calls[0][0].where).toEqual({ email: "yasmine@test.fr" });
    expect(usr.upsert.mock.calls[0][0].create).toMatchObject({ source: "walk_in" });
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
    ev.findUnique.mockResolvedValue({ id: "ev-1", organisationId: "org-1", name: "Workshop" } as never);
    usr.upsert.mockResolvedValue({ id: "user-1", firstName: "Y", lastName: "B" } as never);
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
});
