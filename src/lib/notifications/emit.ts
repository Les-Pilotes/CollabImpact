import { prisma } from "@/lib/db";

export type NotificationType =
  | "enrollment.created"
  | "event.capacity_reached"
  | "event.status_changed"
  | "feedback.received";

type EmitInput = {
  organisationId: string;
  type: NotificationType;
  title: string;
  body?: string;
  eventId?: string;
  enrollmentId?: string;
  metadata?: Record<string, unknown>;
  /**
   * If true, skip emit when a Notification of the same `type` already exists
   * for the same `eventId`. Use for milestones that should only fire once
   * (e.g. capacity reached).
   */
  dedupePerEvent?: boolean;
};

/**
 * Émet une notification in-app. Idempotent pour les jalons (`dedupePerEvent`).
 *
 * Best-effort : si la table n'existe pas encore (avant `db push` post-déploiement)
 * ou si Prisma jette, on log et on continue. Une notification ratée ne doit
 * jamais faire échouer le flux métier qui l'a déclenchée (inscription, feedback,
 * transition de statut).
 */
export async function emitNotification(input: EmitInput): Promise<void> {
  try {
    if (input.dedupePerEvent && input.eventId) {
      const existing = await prisma.notification.findFirst({
        where: {
          organisationId: input.organisationId,
          type: input.type,
          eventId: input.eventId,
        },
        select: { id: true },
      });
      if (existing) return;
    }

    await prisma.notification.create({
      data: {
        organisationId: input.organisationId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        eventId: input.eventId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        metadata: input.metadata
          ? (input.metadata as Parameters<typeof prisma.notification.create>[0]["data"]["metadata"])
          : undefined,
      },
    });
  } catch (err) {
    console.error(`[notifications] emit failed (${input.type}):`, err);
  }
}
