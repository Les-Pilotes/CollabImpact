import { prisma } from "@/lib/db";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  eventId: string | null;
  enrollmentId: string | null;
  createdAt: Date;
  read: boolean;
};

const RECENT_WINDOW_DAYS = 30;

function recentSince(): Date {
  return new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Liste les notifs récentes de l'org, annotées avec l'état lu/non-lu pour
 * l'admin courant. Best-effort : table absente → tableau vide.
 */
export async function listNotifications(
  organisationId: string,
  adminId: string,
  opts: { limit?: number } = {},
): Promise<NotificationItem[]> {
  const limit = opts.limit ?? 50;
  try {
    const rows = await prisma.notification.findMany({
      where: {
        organisationId,
        createdAt: { gte: recentSince() },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        reads: {
          where: { adminId },
          select: { id: true },
          take: 1,
        },
      },
    });
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      eventId: n.eventId,
      enrollmentId: n.enrollmentId,
      createdAt: n.createdAt,
      read: n.reads.length > 0,
    }));
  } catch (err) {
    console.error("[notifications] listNotifications failed:", err);
    return [];
  }
}

/**
 * Compte les notifs non lues par l'admin sur la fenêtre récente.
 * Best-effort : table absente → 0.
 */
export async function countUnread(
  organisationId: string,
  adminId: string,
): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        organisationId,
        createdAt: { gte: recentSince() },
        reads: { none: { adminId } },
      },
    });
  } catch (err) {
    console.error("[notifications] countUnread failed:", err);
    return 0;
  }
}

/**
 * Marque une notification comme lue par l'admin (idempotent via @@unique).
 */
export async function markRead(
  adminId: string,
  notificationId: string,
): Promise<void> {
  try {
    await prisma.notificationRead.upsert({
      where: { notificationId_adminId: { notificationId, adminId } },
      create: { notificationId, adminId },
      update: {},
    });
  } catch (err) {
    console.error("[notifications] markRead failed:", err);
  }
}

/**
 * Marque toutes les notifs récentes non lues de l'org comme lues par l'admin.
 */
export async function markAllRead(
  organisationId: string,
  adminId: string,
): Promise<void> {
  try {
    const unread = await prisma.notification.findMany({
      where: {
        organisationId,
        createdAt: { gte: recentSince() },
        reads: { none: { adminId } },
      },
      select: { id: true },
    });
    if (unread.length === 0) return;
    await prisma.notificationRead.createMany({
      data: unread.map((n) => ({ notificationId: n.id, adminId })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("[notifications] markAllRead failed:", err);
  }
}
