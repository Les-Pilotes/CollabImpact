import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { emitNotification } from "@/lib/notifications/emit";

const notif = vi.mocked(prisma.notification);

describe("emitNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("creates a notification with all provided fields", async () => {
    notif.create.mockResolvedValue({ id: "n1" } as never);

    await emitNotification({
      organisationId: "org-1",
      type: "enrollment.created",
      title: "Lisa s'est inscrite à Workshop 7",
      body: "Depuis Paris.",
      eventId: "ev-1",
      enrollmentId: "en-1",
      metadata: { source: "form" },
    });

    expect(notif.create).toHaveBeenCalledOnce();
    const args = notif.create.mock.calls[0][0];
    expect(args.data.organisationId).toBe("org-1");
    expect(args.data.type).toBe("enrollment.created");
    expect(args.data.title).toBe("Lisa s'est inscrite à Workshop 7");
    expect(args.data.body).toBe("Depuis Paris.");
    expect(args.data.eventId).toBe("ev-1");
    expect(args.data.enrollmentId).toBe("en-1");
    expect(args.data.metadata).toEqual({ source: "form" });
  });

  it("defaults body, eventId, enrollmentId to null when omitted", async () => {
    notif.create.mockResolvedValue({ id: "n2" } as never);

    await emitNotification({
      organisationId: "org-1",
      type: "feedback.received",
      title: "Feedback reçu",
    });

    const args = notif.create.mock.calls[0][0];
    expect(args.data.body).toBeNull();
    expect(args.data.eventId).toBeNull();
    expect(args.data.enrollmentId).toBeNull();
    expect(args.data.metadata).toBeUndefined();
  });

  it("skips create when dedupePerEvent and a notif of same type exists for the event", async () => {
    notif.findFirst.mockResolvedValue({ id: "existing" } as never);

    await emitNotification({
      organisationId: "org-1",
      type: "event.capacity_reached",
      title: "Workshop 7 est complet",
      eventId: "ev-1",
      dedupePerEvent: true,
    });

    expect(notif.findFirst).toHaveBeenCalledWith({
      where: {
        organisationId: "org-1",
        type: "event.capacity_reached",
        eventId: "ev-1",
      },
      select: { id: true },
    });
    expect(notif.create).not.toHaveBeenCalled();
  });

  it("creates when dedupePerEvent and no existing notif for the event", async () => {
    notif.findFirst.mockResolvedValue(null as never);
    notif.create.mockResolvedValue({ id: "n3" } as never);

    await emitNotification({
      organisationId: "org-1",
      type: "event.capacity_reached",
      title: "Workshop 7 est complet",
      eventId: "ev-1",
      dedupePerEvent: true,
    });

    expect(notif.create).toHaveBeenCalledOnce();
  });

  it("ignores dedupePerEvent when no eventId is provided", async () => {
    notif.create.mockResolvedValue({ id: "n4" } as never);

    await emitNotification({
      organisationId: "org-1",
      type: "feedback.received",
      title: "Feedback",
      dedupePerEvent: true,
    });

    expect(notif.findFirst).not.toHaveBeenCalled();
    expect(notif.create).toHaveBeenCalledOnce();
  });

  it("swallows prisma errors so the calling flow is never broken", async () => {
    notif.create.mockRejectedValue(new Error("DB exploded") as never);

    await expect(
      emitNotification({
        organisationId: "org-1",
        type: "enrollment.created",
        title: "Anything",
      }),
    ).resolves.toBeUndefined();
  });
});
