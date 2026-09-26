import type React from "react";
import { sendEmail } from "@/lib/email/client";
import { prisma } from "@/lib/db";
import { EmailKind } from "@prisma/client";
import { logEnrollmentEvent } from "@/lib/enrollment/timeline";

export type DeliverInput = {
  kind: EmailKind;
  organisationId: string;
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
  eventId?: string;
  enrollmentId?: string;
};

export type DeliverResult = { sent: true; id?: string } | { sent: false; reason: string };

const KIND_LABEL: Record<EmailKind, string> = {
  inscription_confirmation: "Email de confirmation d'inscription",
  j7_reminder: "Rappel J-7",
  j2_reminder: "Rappel J-2",
  feedback_invite: "Invitation feedback",
  feedback_relance: "Relance feedback",
  droits_relance: "Relance autorisation parentale",
  admin_alert: "Alerte admin",
  admin_invitation: "Invitation administrateur",
  custom: "Email personnalisé",
};

/**
 * The one path every transactional email must go through. Journals every
 * attempt — success or failure — to EmailLog, so a bounced/rejected send is
 * visible to an admin instead of silently counted as delivered (the bug this
 * replaces: sendEmail's result used to be ignored by most callers).
 *
 * Also appends to the enrollment's real timeline (EnrollmentEvent) when an
 * enrollmentId is given, instead of the fiche's history being reconstructed
 * with fabricated offsets.
 */
export async function deliver(input: DeliverInput): Promise<DeliverResult> {
  const result = await sendEmail({
    to: input.to,
    subject: input.subject,
    react: input.react,
    replyTo: input.replyTo,
  });

  await prisma.emailLog
    .create({
      data: {
        organisationId: input.organisationId,
        kind: input.kind,
        to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
        status: result.sent ? "sent" : "failed",
        providerId: result.sent ? (result.id ?? null) : null,
        error: result.sent ? null : String(result.reason),
        eventId: input.eventId,
        enrollmentId: input.enrollmentId,
      },
    })
    .catch((err) => console.error("[deliver] EmailLog write failed:", err));

  if (input.enrollmentId) {
    await logEnrollmentEvent({
      enrollmentId: input.enrollmentId,
      type: result.sent ? "email_sent" : "email_failed",
      label: result.sent
        ? `${KIND_LABEL[input.kind]} · email envoyé`
        : `${KIND_LABEL[input.kind]} · échec d'envoi (${result.reason})`,
      metadata: { kind: input.kind, sent: result.sent },
    });
  }

  return result;
}
