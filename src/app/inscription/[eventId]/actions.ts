"use server";

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { inscriptionSchema, type InscriptionInput } from "@/lib/validation/inscription";
import InscriptionConfirmation from "@/lib/email/templates/InscriptionConfirmation";
import { resolveEmail } from "@/lib/email/resolve";
import { emitNotification } from "@/lib/notifications/emit";
import React from "react";

const STALE_ORIENTATION_MONTHS = 6;

export type LookupResult =
  | {
      kind: "new";
    }
  | {
      kind: "returning";
      isStale: boolean;
      // pre-fill payload (no sensitive checks here — verification done client-side via DOB)
      firstName: string;
      lastName: string;
      // Verification challenge: DOB hash so we don't leak the full date
      verifyBirthDate: string; // YYYY-MM-DD
      lastEventName: string | null;
      lastEventDate: string | null;
    };

/**
 * Step 0 lookup: does this email match an existing user ?
 * Returns a minimal payload — the client must verify identity via DOB before
 * receiving any other pre-filled data (handled by `verifyAndFetchProfile`).
 */
export async function lookupUserByEmail(email: string): Promise<LookupResult> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) return { kind: "new" };

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      orientationUpdatedAt: true,
      enrollments: {
        where: { deletedAt: null },
        orderBy: { enrolledAt: "desc" },
        take: 1,
        select: {
          event: { select: { name: true, date: true } },
        },
      },
    },
  });

  if (!user || !user.birthDate) {
    return { kind: "new" };
  }

  const ageMonths = user.orientationUpdatedAt
    ? (Date.now() - user.orientationUpdatedAt.getTime()) /
      (1000 * 60 * 60 * 24 * 30)
    : Infinity;
  const isStale = ageMonths > STALE_ORIENTATION_MONTHS;

  const lastEnrollment = user.enrollments[0];

  return {
    kind: "returning",
    isStale,
    firstName: user.firstName,
    lastName: user.lastName,
    verifyBirthDate: user.birthDate.toISOString().slice(0, 10),
    lastEventName: lastEnrollment?.event.name ?? null,
    lastEventDate: lastEnrollment?.event.date.toISOString() ?? null,
  };
}

export type ReturningProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  city: string;
  gender: string | null;
  // Orientation (may be stale)
  niveauScolaire: string | null;
  etablissement: string | null;
  region: string | null;
  projetPro: string | null;
  motivation: string[];
  motivationDetail: string | null;
  commentConnu: string | null;
  orientationUpdatedAt: string | null;
};

/**
 * Step 0v: client claims a DOB to prove ownership of this email.
 * If it matches the stored DOB → return the full profile for pre-fill.
 * Otherwise → returns null (client falls back to NEW flow, silently).
 */
export async function verifyAndFetchProfile(
  email: string,
  claimedBirthDate: string,
): Promise<ReturningProfile | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user || !user.birthDate) return null;

  const storedDob = user.birthDate.toISOString().slice(0, 10);
  if (storedDob !== claimedBirthDate) {
    return null;
  }

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
    birthDate: storedDob,
    city: user.city ?? "",
    gender: user.gender,
    niveauScolaire: user.niveauScolaire,
    etablissement: user.etablissement,
    region: user.region,
    projetPro: user.projetPro,
    motivation: user.motivation,
    motivationDetail: user.motivationDetail,
    commentConnu: user.commentConnu,
    orientationUpdatedAt: user.orientationUpdatedAt?.toISOString() ?? null,
  };
}

export type SubmitResult =
  | { ok: true; enrollmentId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Submit a complete inscription. Upserts User (with orientation refresh)
 * and creates Enrollment. Sends confirmation email.
 */
export async function submitInscription(
  input: InscriptionInput,
): Promise<SubmitResult> {
  const parsed = inscriptionSchema.safeParse(input);
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
      select: {
        id: true,
        name: true,
        date: true,
        address: true,
        capacity: true,
        organisationId: true,
        replyToEmail: true,
        emailSignature: true,
        emailConfig: true,
      },
    });
    if (!event) {
      return { ok: false, error: "Événement introuvable." };
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    const isMinor = computeIsMinor(data.birthDate, event.date);
    const droitsImageStatus = isMinor
      ? "minor_parental_pending"
      : data.droitsImageAccepted
        ? "accepted"
        : "refused";

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        organisationId: event.organisationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: normalizedEmail,
        phone: data.phone,
        birthDate: new Date(data.birthDate),
        gender: data.gender,
        city: data.city,
        niveauScolaire: data.niveauScolaire,
        niveauScolaireAutre: data.niveauScolaireAutre,
        etablissement: data.etablissement,
        region: data.region,
        projetPro: data.projetPro,
        motivation: data.motivation,
        motivationDetail: data.motivationDetail,
        commentConnu: data.commentConnu,
        orientationUpdatedAt: new Date(),
      },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: new Date(data.birthDate),
        gender: data.gender ?? undefined,
        city: data.city,
        niveauScolaire: data.niveauScolaire,
        niveauScolaireAutre: data.niveauScolaireAutre,
        etablissement: data.etablissement,
        region: data.region,
        projetPro: data.projetPro,
        motivation: data.motivation,
        motivationDetail: data.motivationDetail,
        commentConnu: data.commentConnu,
        orientationUpdatedAt: new Date(),
      },
    });

    // Detect whether this is a brand-new enrollment (notif fires only once)
    // before the upsert collapses create/update into one call.
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      select: { id: true },
    });
    const isNewEnrollment = !existingEnrollment;

    const enrollment = await prisma.enrollment.upsert({
      where: {
        eventId_userId: { eventId: event.id, userId: user.id },
      },
      create: {
        organisationId: event.organisationId,
        eventId: event.id,
        userId: user.id,
        droitsImageStatus,
        droitsImageSignedAt: data.droitsImageAccepted ? new Date() : null,
        droitsImageSignature: isMinor ? null : data.droitsImageSignature,
        regime: data.regime,
        accessibilite: data.accessibilite,
        accompagnateur: data.accompagnateur,
        commentaire: data.commentaire,
      },
      update: {
        droitsImageStatus,
        droitsImageSignedAt: data.droitsImageAccepted ? new Date() : null,
        droitsImageSignature: isMinor ? null : data.droitsImageSignature,
        regime: data.regime,
        accessibilite: data.accessibilite,
        accompagnateur: data.accompagnateur,
        commentaire: data.commentaire,
      },
    });

    if (isNewEnrollment) {
      void emitNotification({
        organisationId: event.organisationId,
        type: "enrollment.created",
        title: `${user.firstName} ${user.lastName} s'est inscrite à ${event.name}`,
        body: user.city ? `Depuis ${user.city}.` : undefined,
        eventId: event.id,
        enrollmentId: enrollment.id,
      });

      if (event.capacity > 0) {
        const count = await prisma.enrollment.count({
          where: { eventId: event.id, deletedAt: null },
        });
        if (count >= event.capacity) {
          void emitNotification({
            organisationId: event.organisationId,
            type: "event.capacity_reached",
            title: `${event.name} est complet`,
            body: `${count} inscrites sur ${event.capacity} places.`,
            eventId: event.id,
            dedupePerEvent: true,
          });
        }
      }
    }

    try {
      const resolved = resolveEmail("confirmation", event.emailConfig, {
        prenom: user.firstName,
        event: event.name,
        date: formatEventDate(event.date),
        horaire: event.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        lieu: event.address,
      });
      await sendEmail({
        to: user.email,
        subject: resolved.subject,
        replyTo: event.replyToEmail ?? undefined,
        react: React.createElement(InscriptionConfirmation, {
          heading: resolved.heading,
          body: resolved.body,
          eventName: event.name,
          customNote: resolved.note ?? undefined,
          signature: event.emailSignature ?? undefined,
        }),
      });
    } catch (err) {
      console.error("[submitInscription] email failed:", err);
      // non-fatal — inscription is still saved
    }

    return { ok: true, enrollmentId: enrollment.id };
  } catch (err) {
    console.error("[submitInscription] DB error:", err);
    return { ok: false, error: "Erreur serveur, réessaie." };
  }
}

function computeIsMinor(birthDateISO: string, eventDate: Date): boolean {
  const dob = new Date(birthDateISO);
  const ageAtEvent =
    (eventDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return ageAtEvent < 18;
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
