"use server";

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { inscriptionSchema, type InscriptionInput } from "@/lib/validation/inscription";
import InscriptionConfirmation from "@/lib/email/templates/InscriptionConfirmation";
import ResumeInscription from "@/lib/email/templates/ResumeInscription";
import { resolveEmail } from "@/lib/email/resolve";
import { emitNotification } from "@/lib/notifications/emit";
import { dispatchEnrollmentAlerts } from "@/lib/notifications/admin-alerts";
import { getAppUrl } from "@/lib/app-url";
import { createResumeToken, verifyResumeToken } from "@/lib/tokens";
import React from "react";

const STALE_ORIENTATION_MONTHS = 6;
const RESUME_LINK_MIN_INTERVAL_MS = 60 * 1000;

export type LookupResult =
  | {
      kind: "new";
    }
  | {
      kind: "returning";
      isStale: boolean;
      firstName: string;
      lastName: string;
      maskedEmail: string;
      lastEventName: string | null;
      lastEventDate: string | null;
      // Statut global du droit à l'image (majeure). Si "accepted" ou "refused",
      // l'étape de consentement est skippée sur le formulaire et on snapshotte
      // ce choix sur l'Enrollment. NULL = jamais demandé globalement.
      droitsImageGlobalStatus: "accepted" | "refused" | null;
    };

/**
 * Step 0 lookup : cet email est-il rattaché à un.e participant.e déjà connu.e ?
 * Renvoie le strict minimum pour la chaleur UX (prénom, dernier event). Tout
 * pré-remplissage exige la possession d'un magic-link reçu par email (cf.
 * `sendResumeLink` / `consumeResumeToken`).
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
      droitsImageStatus: true,
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
    maskedEmail: maskEmail(normalizedEmail),
    lastEventName: lastEnrollment?.event.name ?? null,
    lastEventDate: lastEnrollment?.event.date.toISOString() ?? null,
    droitsImageGlobalStatus:
      user.droitsImageStatus === "accepted" || user.droitsImageStatus === "refused"
        ? user.droitsImageStatus
        : null,
  };
}

export type ReturningProfile = {
  firstName: string;
  lastName: string;
  email: string;
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
  // Statut global du droit à l'image. Sert au formulaire pour skipper l'étape
  // de consentement quand la personne a déjà donné son avis globalement.
  droitsImageGlobalStatus: "accepted" | "refused" | null;
};

export type SendResumeLinkResult =
  | { ok: true }
  | { ok: false; reason: "unknown_email" | "rate_limited" | "no_event" };

/**
 * Envoie un magic-link de reprise d'inscription. Lié à l'event courant : un
 * lien généré pour event A ne pré-remplira pas event B.
 *
 * Rate-limit best-effort à 1 envoi / minute via `User.updatedAt`. Acceptable
 * pour ce volume — pas besoin d'un store dédié.
 */
export async function sendResumeLink(
  email: string,
  eventId: string,
): Promise<SendResumeLinkResult> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) return { ok: false, reason: "unknown_email" };

  const [user, event] = await Promise.all([
    prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, firstName: true, updatedAt: true },
    }),
    prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { id: true, name: true, replyToEmail: true },
    }),
  ]);

  if (!event) return { ok: false, reason: "no_event" };
  if (!user) return { ok: false, reason: "unknown_email" };

  if (Date.now() - user.updatedAt.getTime() < RESUME_LINK_MIN_INTERVAL_MS) {
    return { ok: false, reason: "rate_limited" };
  }

  const token = createResumeToken(user.id, event.id);
  const resumeUrl = `${getAppUrl()}/inscription/${event.id}?resume=${token}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  });

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: `Reprends ton inscription à ${event.name}`,
      replyTo: event.replyToEmail ?? undefined,
      react: React.createElement(ResumeInscription, {
        firstName: user.firstName,
        eventName: event.name,
        resumeUrl,
      }),
    });
  } catch (err) {
    console.error("[sendResumeLink] email failed:", err);
  }

  return { ok: true };
}

export type ConsumeResumeTokenResult =
  | { ok: true; profile: ReturningProfile; isStale: boolean }
  | { ok: false; reason: "invalid" | "expired" | "wrong_event" | "user_gone" };

/**
 * Consomme un magic-link : vérifie HMAC + TTL + event match, puis renvoie le
 * profil complet pour pré-remplir le formulaire. Pas de stockage côté DB :
 * le token est self-verifiable, et son TTL court (15 min) limite la réutilisation.
 */
export async function consumeResumeToken(
  token: string,
  eventId: string,
): Promise<ConsumeResumeTokenResult> {
  const result = verifyResumeToken(token, eventId);
  if (!result.valid) {
    if (result.reason === "expired") return { ok: false, reason: "expired" };
    if (result.reason === "wrong_event") return { ok: false, reason: "wrong_event" };
    return { ok: false, reason: "invalid" };
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
  });
  if (!user || !user.birthDate) {
    return { ok: false, reason: "user_gone" };
  }

  const ageMonths = user.orientationUpdatedAt
    ? (Date.now() - user.orientationUpdatedAt.getTime()) /
      (1000 * 60 * 60 * 24 * 30)
    : Infinity;
  const isStale = ageMonths > STALE_ORIENTATION_MONTHS;

  return {
    ok: true,
    isStale,
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "",
      birthDate: user.birthDate.toISOString().slice(0, 10),
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
      droitsImageGlobalStatus:
        user.droitsImageStatus === "accepted" || user.droitsImageStatus === "refused"
          ? user.droitsImageStatus
          : null,
    },
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
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
    // Fields are individually toggleable per-event via FormConfig. If a field
    // was disabled in the form, the corresponding payload key is absent —
    // persist NULL rather than failing.
    const birthDateValue = data.birthDate ? new Date(data.birthDate) : null;
    const isMinor = birthDateValue
      ? computeIsMinor(data.birthDate as string, event.date)
      : false;

    // Read existing global droit-à-l'image state BEFORE upsert so we can:
    //   1) snapshot it into Enrollment when the form skipped the step
    //      (returning majeure already consented once globally)
    //   2) avoid wiping the global status when this enrollment doesn't ask
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        droitsImageStatus: true,
        droitsImageSignedAt: true,
        droitsImageSignature: true,
      },
    });

    // Did the form ASK the droit-image question on this submit?
    // - true  → user is new, or majeure with no global status yet, or minor
    // - false → form skipped it (majeure inherits global) OR toggle is off
    const formAskedDroitImage = data.droitsImageAccepted !== undefined;

    // Enrollment snapshot (per-event copy for legal traceability).
    let enrollmentDroitsStatus:
      | "pending"
      | "accepted"
      | "refused"
      | "minor_parental_pending" = "pending";
    let enrollmentDroitsSignedAt: Date | null = null;
    let enrollmentDroitsSignature: string | null = null;

    if (formAskedDroitImage) {
      if (isMinor) {
        enrollmentDroitsStatus = "minor_parental_pending";
      } else if (data.droitsImageAccepted) {
        enrollmentDroitsStatus = "accepted";
        enrollmentDroitsSignedAt = new Date();
        enrollmentDroitsSignature = data.droitsImageSignature ?? null;
      } else {
        enrollmentDroitsStatus = "refused";
      }
    } else if (
      !isMinor &&
      (existingUser?.droitsImageStatus === "accepted" ||
        existingUser?.droitsImageStatus === "refused")
    ) {
      // Form skipped the step because user has a global decision — inherit it.
      enrollmentDroitsStatus = existingUser.droitsImageStatus;
      enrollmentDroitsSignedAt = existingUser.droitsImageSignedAt;
      enrollmentDroitsSignature = existingUser.droitsImageSignature;
    }

    // Global User update : only majeures, only when they expressed a fresh
    // choice on this submit. Minors stay per-event (parental consent doesn't
    // transfer to global). When form is skipped, we don't touch the global
    // value so a prior "accepted" / "refused" survives.
    const userDroitsUpdate =
      formAskedDroitImage && !isMinor
        ? {
            droitsImageStatus: (data.droitsImageAccepted ? "accepted" : "refused") as
              | "accepted"
              | "refused",
            droitsImageSignedAt: data.droitsImageAccepted ? new Date() : null,
            droitsImageSignature: data.droitsImageAccepted
              ? (data.droitsImageSignature ?? null)
              : null,
          }
        : {};

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        organisationId: event.organisationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: normalizedEmail,
        phone: data.phone ?? null,
        birthDate: birthDateValue,
        gender: data.gender,
        city: data.city ?? null,
        niveauScolaire: data.niveauScolaire ?? null,
        niveauScolaireAutre: data.niveauScolaireAutre ?? null,
        etablissement: data.etablissement ?? null,
        region: data.region ?? null,
        projetPro: data.projetPro ?? null,
        motivation: data.motivation ?? [],
        motivationDetail: data.motivationDetail ?? null,
        commentConnu: data.commentConnu ?? null,
        orientationUpdatedAt: new Date(),
        ...userDroitsUpdate,
      },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        birthDate: birthDateValue,
        gender: data.gender ?? undefined,
        city: data.city ?? null,
        niveauScolaire: data.niveauScolaire ?? null,
        niveauScolaireAutre: data.niveauScolaireAutre ?? null,
        etablissement: data.etablissement ?? null,
        region: data.region ?? null,
        projetPro: data.projetPro ?? null,
        motivation: data.motivation ?? [],
        motivationDetail: data.motivationDetail ?? null,
        commentConnu: data.commentConnu ?? null,
        orientationUpdatedAt: new Date(),
        ...userDroitsUpdate,
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
        droitsImageStatus: enrollmentDroitsStatus,
        droitsImageSignedAt: enrollmentDroitsSignedAt,
        droitsImageSignature: enrollmentDroitsSignature,
        regime: data.regime ?? [],
        accessibilite: data.accessibilite ?? null,
        accompagnateur: data.accompagnateur,
        commentaire: data.commentaire ?? null,
      },
      update: {
        droitsImageStatus: enrollmentDroitsStatus,
        droitsImageSignedAt: enrollmentDroitsSignedAt,
        droitsImageSignature: enrollmentDroitsSignature,
        regime: data.regime ?? [],
        accessibilite: data.accessibilite ?? null,
        accompagnateur: data.accompagnateur,
        commentaire: data.commentaire ?? null,
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

      // Fan-out email alert to admins who opted in (best-effort, never blocks).
      void dispatchEnrollmentAlerts({
        eventId: event.id,
        enrollmentId: enrollment.id,
        organisationId: event.organisationId,
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
