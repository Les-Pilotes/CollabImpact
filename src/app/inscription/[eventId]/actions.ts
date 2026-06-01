"use server";

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { inscriptionSchema, type InscriptionInput } from "@/lib/validation/inscription";
import InscriptionConfirmation from "@/lib/email/templates/InscriptionConfirmation";
import ResumeInscription from "@/lib/email/templates/ResumeInscription";
import { resolveEmail } from "@/lib/email/resolve";
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
