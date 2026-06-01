"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  countUnread as _countUnread,
  listNotifications as _listNotifications,
  markAllRead as _markAllRead,
  markRead as _markRead,
  type NotificationItem,
} from "@/lib/notifications/queries";

export async function fetchUnreadCount(): Promise<number> {
  const { admin } = await requireAdmin();
  return _countUnread(admin.organisationId, admin.id);
}

export async function fetchRecentNotifications(
  limit = 10,
): Promise<NotificationItem[]> {
  const { admin } = await requireAdmin();
  return _listNotifications(admin.organisationId, admin.id, { limit });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { admin } = await requireAdmin();
  await _markRead(admin.id, notificationId);
  revalidatePath("/admin/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const { admin } = await requireAdmin();
  await _markAllRead(admin.organisationId, admin.id);
  revalidatePath("/admin/notifications");
}
