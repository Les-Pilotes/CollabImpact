import type { Prisma } from "@prisma/client";

/**
 * Per-event admin notification settings — stored as JSON on `Event.notificationConfig`.
 * Kept here (not in schema.prisma) so the shape can evolve without a migration
 * each time we add a new alert type or channel.
 *
 * `recipientAdminIds` is the source of truth. An admin can only be ticked once
 * they have signed in at least once (validated). The UI filters out
 * never-connected admins, and the runtime emitter does too as a defense in depth.
 */
export type NotificationConfig = {
  /** Send an email to recipients on every new enrollment. */
  newEnrollmentEnabled: boolean;
  /** Admin.id list — must be validated (lastLoginAt !== null) to receive. */
  recipientAdminIds: string[];
};

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  newEnrollmentEnabled: false,
  recipientAdminIds: [],
};

/**
 * Coerce a Prisma JSON value into a typed NotificationConfig with defaults.
 * Tolerates missing / partial / null / wrong-shape data without crashing.
 */
export function parseNotificationConfig(
  raw: Prisma.JsonValue | null | undefined,
): NotificationConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_NOTIFICATION_CONFIG };
  }
  const obj = raw as Record<string, unknown>;
  const ids = Array.isArray(obj.recipientAdminIds)
    ? obj.recipientAdminIds.filter((v): v is string => typeof v === "string")
    : [];
  return {
    newEnrollmentEnabled: obj.newEnrollmentEnabled === true,
    recipientAdminIds: ids,
  };
}
