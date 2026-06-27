"use server";

import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emitNotification } from "@/lib/notifications/emit";
import { walkinSchema, type WalkinInput } from "@/lib/validation/walkin";

export type WalkinResult =
  | { ok: true; enrollmentId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Walk-in submission (Jour J, scanned from the event's generic QR).
 *
 * Creates/updates the User from the minimal payload, then upserts an Enrollment
 * already marked `presente` (attendedAt = now, source = walk_in) so the
 * participante appears immediately in Suivi and is available for group
 * composition. If she was already pre-registered, we just flip her to présente
 * instead of duplicating.
 */
export async function submitWalkin(input: WalkinInput): Promise<WalkinResult> {
  const parsed = walkinSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  try {
    const event = await prisma.event.findUnique({
      where: { id: data.eventId, deletedAt: null },
      select: { id: true, organisationId: true, name: true },
    });
    if (!event) return { ok: false, error: "Événement introuvable." };

    const email = data.email; // already lowercased+trimmed by the schema
    const droitsImageStatus = data.droitsImageAccepted ? "accepted" : "pending";

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        organisationId: event.organisationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone ?? null,
        source: "walk_in",
      },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
      },
    });

    // New vs existing enrollment — fire the in-app notif only once.
    const existing = await prisma.enrollment.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      select: { id: true },
    });
    const isNew = !existing;

    const enrollment = await prisma.enrollment.upsert({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      create: {
        organisationId: event.organisationId,
        eventId: event.id,
        userId: user.id,
        status: EnrollmentStatus.presente,
        attendedAt: new Date(),
        source: "walk_in",
        droitsImageStatus,
        droitsImageSignedAt: data.droitsImageAccepted ? new Date() : null,
        droitsImageSignature: data.droitsImageAccepted
          ? `${data.firstName} ${data.lastName}`
          : null,
      },
      update: {
        status: EnrollmentStatus.presente,
        attendedAt: new Date(),
      },
    });

    if (isNew) {
      void emitNotification({
        organisationId: event.organisationId,
        type: "enrollment.created",
        title: `${user.firstName} ${user.lastName} (walk-in) à ${event.name}`,
        body: "Inscription sur place le Jour J.",
        eventId: event.id,
        enrollmentId: enrollment.id,
      });
    }

    return { ok: true, enrollmentId: enrollment.id };
  } catch (err) {
    console.error("[submitWalkin]", err);
    return { ok: false, error: "Erreur lors de l'inscription." };
  }
}
