'use server';

import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { createFeedbackToken, createActionToken } from '@/lib/tokens';
import { getAppUrl } from '@/lib/app-url';
import { sendEmail } from '@/lib/email/client';
import { resolveEmail } from '@/lib/email/resolve';
import J7Reminder from '@/lib/email/templates/J7Reminder';
import J2Reminder from '@/lib/email/templates/J2Reminder';
import FeedbackInvite from '@/lib/email/templates/FeedbackInvite';
import React from 'react';

function buildEmailVars(enrollment: {
  user: { firstName: string };
  event: { name: string; date: Date; address: string };
}) {
  const dateLabel = enrollment.event.date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = enrollment.event.date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    prenom: enrollment.user.firstName,
    event: enrollment.event.name,
    date: dateLabel,
    horaire: timeLabel,
    lieu: enrollment.event.address,
  };
}

/**
 * Update enrollment status (admin manual control)
 */
export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
    });
    return { ok: true };
  } catch (err) {
    console.error('[updateEnrollmentStatus]', err);
    return { ok: false, error: 'Erreur lors de la mise à jour du statut.' };
  }
}

/**
 * Bulk status change (admin manual control, Jour J). Lets an admin move many
 * participantes at once — typically marking the room "présentes" on the day
 * without waiting for each one to self-confirm. Applies the same side effects
 * as markAttendance for présente/absente (attendedAt / noShow).
 */
export async function bulkUpdateStatus(
  enrollmentIds: string[],
  status: EnrollmentStatus,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  await requireAdmin();

  if (enrollmentIds.length === 0) return { ok: true, count: 0 };

  const data: {
    status: EnrollmentStatus;
    attendedAt?: Date;
    noShow?: boolean;
  } = { status };
  if (status === EnrollmentStatus.presente) {
    data.attendedAt = new Date();
    data.noShow = false;
  } else if (status === EnrollmentStatus.absente) {
    data.noShow = true;
  }

  try {
    const result = await prisma.enrollment.updateMany({
      where: { id: { in: enrollmentIds } },
      data,
    });
    return { ok: true, count: result.count };
  } catch (err) {
    console.error('[bulkUpdateStatus]', err);
    return { ok: false, error: 'Erreur lors de la mise à jour des statuts.' };
  }
}

/**
 * Mark attendance (Jour J emargement)
 * true = presente, false = absente
 */
export async function markAttendance(
  enrollmentId: string,
  attended: boolean
): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    if (attended) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: EnrollmentStatus.presente,
          attendedAt: new Date(),
          noShow: false,
        },
      });
    } else {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: EnrollmentStatus.absente,
          noShow: true,
        },
      });
    }
    return { ok: true };
  } catch (err) {
    console.error('[markAttendance]', err);
    return { ok: false };
  }
}

/**
 * Send manual J7 reminder to a specific enrollee
 */
export async function sendManualReminder(
  enrollmentId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, event: { include: { emailConfig: true } } },
    });

    if (!enrollment) {
      return { ok: false, error: 'Inscription introuvable.' };
    }

    const appUrl = getAppUrl();
    const confirmToken = createActionToken(enrollmentId, 'confirm');
    const declineToken = createActionToken(enrollmentId, 'decline');
    const isMinor = enrollment.user.birthDate
      ? (enrollment.event.date.getTime() - enrollment.user.birthDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365.25) <
        18
      : false;

    const resolved = resolveEmail('j7', enrollment.event.emailConfig, buildEmailVars(enrollment));

    await sendEmail({
      to: enrollment.user.email,
      subject: resolved.subject,
      replyTo: enrollment.event.replyToEmail ?? undefined,
      react: React.createElement(J7Reminder, {
        heading: resolved.heading,
        body: resolved.body,
        immersionName: enrollment.event.name,
        confirmUrl: `${appUrl}/confirm/${confirmToken}`,
        declineUrl: `${appUrl}/decline/${declineToken}`,
        isMinor,
        customNote: resolved.note ?? undefined,
        signature: enrollment.event.emailSignature ?? undefined,
      }),
    });

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { j7SentAt: new Date() },
    });

    return { ok: true };
  } catch (err) {
    console.error('[sendManualReminder]', err);
    return { ok: false, error: "Erreur lors de l'envoi du rappel." };
  }
}

export async function markContactee(enrollmentId: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.contactee },
    });
    return { ok: true };
  } catch (err) {
    console.error('[markContactee]', err);
    return { ok: false };
  }
}

export async function markConfirmeeJ7(enrollmentId: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.confirmee_j7 },
    });
    return { ok: true };
  } catch (err) {
    console.error('[markConfirmeeJ7]', err);
    return { ok: false };
  }
}

export async function sendJ2Reminder(
  enrollmentId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, event: { include: { emailConfig: true } } },
    });

    if (!enrollment) {
      return { ok: false, error: 'Inscription introuvable.' };
    }

    const appUrl = getAppUrl();
    const confirmToken = createActionToken(enrollmentId, 'confirm');
    const declineToken = createActionToken(enrollmentId, 'decline');
    const isMinor = enrollment.user.birthDate
      ? (enrollment.event.date.getTime() - enrollment.user.birthDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365.25) <
        18
      : false;

    const resolved = resolveEmail('j2', enrollment.event.emailConfig, buildEmailVars(enrollment));

    await sendEmail({
      to: enrollment.user.email,
      subject: resolved.subject,
      replyTo: enrollment.event.replyToEmail ?? undefined,
      react: React.createElement(J2Reminder, {
        heading: resolved.heading,
        body: resolved.body,
        immersionName: enrollment.event.name,
        confirmUrl: `${appUrl}/confirm/${confirmToken}`,
        declineUrl: `${appUrl}/decline/${declineToken}`,
        isMinor,
        customNote: resolved.note ?? undefined,
        signature: enrollment.event.emailSignature ?? undefined,
      }),
    });

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { j2SentAt: new Date() },
    });

    return { ok: true };
  } catch (err) {
    console.error('[sendJ2Reminder]', err);
    return { ok: false, error: "Erreur lors de l'envoi du rappel J-2." };
  }
}

export async function markConfirmeeJ2(enrollmentId: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.confirmee_j2 },
    });
    return { ok: true };
  } catch (err) {
    console.error('[markConfirmeeJ2]', err);
    return { ok: false };
  }
}

/**
 * Mark désistement. Returns the previous status so the caller can offer Undo
 * via a toast action.
 */
export async function markDesistement(
  enrollmentId: string,
): Promise<{ ok: true; previousStatus: EnrollmentStatus } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const before = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { status: true },
    });
    if (!before) return { ok: false, error: 'Inscription introuvable.' };

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.desistement },
    });
    return { ok: true, previousStatus: before.status };
  } catch (err) {
    console.error('[markDesistement]', err);
    return { ok: false, error: 'Erreur lors du désistement.' };
  }
}

/**
 * Generate feedback token and send feedback invite
 */
export async function sendFeedbackInvite(
  enrollmentId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: true, event: { include: { emailConfig: true } } },
    });

    if (!enrollment) {
      return { ok: false, error: 'Inscription introuvable.' };
    }

    const token = createFeedbackToken(enrollmentId);
    const appUrl = getAppUrl();
    const feedbackUrl = `${appUrl}/feedback/${token}`;

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        feedbackToken: token,
        feedbackSentAt: new Date(),
      },
    });

    const resolved = resolveEmail('feedback', enrollment.event.emailConfig, buildEmailVars(enrollment));

    await sendEmail({
      to: enrollment.user.email,
      subject: resolved.subject,
      replyTo: enrollment.event.replyToEmail ?? undefined,
      react: React.createElement(FeedbackInvite, {
        heading: resolved.heading,
        body: resolved.body,
        immersionName: enrollment.event.name,
        feedbackUrl,
        customNote: resolved.note ?? undefined,
        signature: enrollment.event.emailSignature ?? undefined,
      }),
    });

    return { ok: true };
  } catch (err) {
    console.error('[sendFeedbackInvite]', err);
    return { ok: false, error: "Erreur lors de l'envoi du feedback." };
  }
}

// ─── Undo / reversal actions ────────────────────────────────────────────────
// All "destructive" admin actions surface an Annuler toast. These mutations
// reverse the original action so the previous state can be restored.

/**
 * Mark the J-7 reminder as not sent (resets `j7SentAt`). Does NOT recall
 * the actual email — that's not possible — but the system will consider the
 * reminder un-sent, so future cron / manual triggers can fire again.
 */
export async function revertJ7Send(enrollmentId: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { j7SentAt: null },
    });
    return { ok: true };
  } catch (err) {
    console.error('[revertJ7Send]', err);
    return { ok: false };
  }
}

export async function revertJ2Send(enrollmentId: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { j2SentAt: null },
    });
    return { ok: true };
  } catch (err) {
    console.error('[revertJ2Send]', err);
    return { ok: false };
  }
}

/**
 * Generic status revert. Caller passes the previous status captured before
 * the original mutation. Used to power Annuler toasts on désistement,
 * markPresente, markAbsente, etc.
 */
export async function revertStatus(
  enrollmentId: string,
  previousStatus: EnrollmentStatus,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: previousStatus },
    });
    return { ok: true };
  } catch (err) {
    console.error('[revertStatus]', err);
    return { ok: false };
  }
}

