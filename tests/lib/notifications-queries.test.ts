import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    notificationRead: {
      upsert: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  listNotifications,
  countUnread,
  markRead,
  markAllRead,
} from "@/lib/notifications/queries";

const notif = vi.mocked(prisma.notification);
const reads = vi.mocked(prisma.notificationRead);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("listNotifications", () => {
  it("annotates unread items with read=false and read items with read=true", async () => {
    notif.findMany.mockResolvedValue([
      {
        id: "n1",
        type: "enrollment.created",
        title: "Inscription",
        body: null,
        eventId: "ev-1",
        enrollmentId: "en-1",
        createdAt: new Date("2026-05-15"),
        reads: [],
      },
      {
        id: "n2",
        type: "feedback.received",
        title: "Feedback",
        body: "Note 5/5",
        eventId: "ev-1",
        enrollmentId: null,
        createdAt: new Date("2026-05-14"),
        reads: [{ id: "r1" }],
      },
    ] as never);

    const result = await listNotifications("org-1", "admin-1");

    expect(result).toEqual([
      expect.objectContaining({ id: "n1", read: false }),
      expect.objectContaining({ id: "n2", read: true, body: "Note 5/5" }),
    ]);
  });

  it("scopes the read lookup to the requesting admin only", async () => {
    notif.findMany.mockResolvedValue([] as never);

    await listNotifications("org-1", "admin-42");

    const args = notif.findMany.mock.calls[0][0];
    expect(args?.where).toMatchObject({ organisationId: "org-1" });
    expect(args?.include?.reads).toMatchObject({
      where: { adminId: "admin-42" },
      take: 1,
    });
  });

  it("returns an empty array when prisma throws (best-effort)", async () => {
    notif.findMany.mockRejectedValue(new Error("table missing") as never);

    const result = await listNotifications("org-1", "admin-1");
    expect(result).toEqual([]);
  });

  it("respects the limit option", async () => {
    notif.findMany.mockResolvedValue([] as never);

    await listNotifications("org-1", "admin-1", { limit: 10 });

    expect(notif.findMany.mock.calls[0][0]?.take).toBe(10);
  });
});

describe("countUnread", () => {
  it("returns the prisma count when successful", async () => {
    notif.count.mockResolvedValue(7 as never);

    const result = await countUnread("org-1", "admin-1");
    expect(result).toBe(7);
    const args = notif.count.mock.calls[0][0];
    expect(args?.where).toMatchObject({
      organisationId: "org-1",
      reads: { none: { adminId: "admin-1" } },
    });
  });

  it("returns 0 when prisma throws (best-effort)", async () => {
    notif.count.mockRejectedValue(new Error("boom") as never);
    expect(await countUnread("org-1", "admin-1")).toBe(0);
  });
});

describe("markRead", () => {
  it("upserts on the composite unique key (notificationId, adminId)", async () => {
    reads.upsert.mockResolvedValue({} as never);

    await markRead("admin-1", "n1");

    expect(reads.upsert).toHaveBeenCalledWith({
      where: { notificationId_adminId: { notificationId: "n1", adminId: "admin-1" } },
      create: { notificationId: "n1", adminId: "admin-1" },
      update: {},
    });
  });

  it("swallows prisma errors", async () => {
    reads.upsert.mockRejectedValue(new Error("nope") as never);
    await expect(markRead("admin-1", "n1")).resolves.toBeUndefined();
  });
});

describe("markAllRead", () => {
  it("creates a read row for every unread notif and skips duplicates", async () => {
    notif.findMany.mockResolvedValue([{ id: "n1" }, { id: "n2" }, { id: "n3" }] as never);
    reads.createMany.mockResolvedValue({ count: 3 } as never);

    await markAllRead("org-1", "admin-1");

    expect(reads.createMany).toHaveBeenCalledWith({
      data: [
        { notificationId: "n1", adminId: "admin-1" },
        { notificationId: "n2", adminId: "admin-1" },
        { notificationId: "n3", adminId: "admin-1" },
      ],
      skipDuplicates: true,
    });
  });

  it("is a no-op when there are no unread notifs", async () => {
    notif.findMany.mockResolvedValue([] as never);

    await markAllRead("org-1", "admin-1");

    expect(reads.createMany).not.toHaveBeenCalled();
  });
});
