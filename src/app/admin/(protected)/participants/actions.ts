'use server';

import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { createFeedbackToken } from '@/lib/tokens';
import { sendEmail } from '@/lib/email/client';
import J7Reminder from '@/lib/email/templates/J7Reminder';
import J2Reminder from '@/lib/email/templates/J2Reminder';
import FeedbackInvite from '@/lib/email/templates/FeedbackInvite';
import React from 'react';

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
      include: { user: true, immersion: true },
    });

    if (!enrollment) {
      return { ok: false, error: 'Inscription introuvable.' };
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const confirmUrl = `${appUrl}/confirm/${enrollmentId}`;
    const dateLabel = enrollment.immersion.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await sendEmail({
      to: enrollment.user.email,
      subject: `Rappel J-7 — ${enrollment.immersion.name}`,
      react: React.createElement(J7Reminder, {
        firstName: enrollment.user.firstName,
        immersionName: enrollment.immersion.name,
        companyName: enrollment.immersion.name,
        dateLabel,
        confirmUrl,
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
      include: { user: true, immersion: true },
    });

    if (!enrollment) {
      return { ok: false, error: 'Inscription introuvable.' };
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const confirmUrl = `${appUrl}/confirm/${enrollmentId}`;
    const dateLabel = enrollment.immersion.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await sendEmail({
      to: enrollment.user.email,
      subject: `Rappel J-2 — ${enrollment.immersion.name}`,
      react: React.createElement(J2Reminder, {
        firstName: enrollment.user.firstName,
        immersionName: enrollment.immersion.name,
        dateLabel,
        address: enrollment.immersion.address,
        confirmUrl,
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

export async function markDesistement(enrollmentId: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: EnrollmentStatus.desistement },
    });
    return { ok: true };
  } catch (err) {
    console.error('[markDesistement]', err);
    return { ok: false };
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
      include: { user: true, immersion: true },
    });

    if (!enrollment) {
      return { ok: false, error: 'Inscription introuvable.' };
    }

    const token = createFeedbackToken(enrollmentId);
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const feedbackUrl = `${appUrl}/feedback/${token}`;

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        feedbackToken: token,
        feedbackSentAt: new Date(),
      },
    });

    await sendEmail({
      to: enrollment.user.email,
      subject: `Ton avis sur ${enrollment.immersion.name}`,
      react: React.createElement(FeedbackInvite, {
        firstName: enrollment.user.firstName,
        immersionName: enrollment.immersion.name,
        feedbackUrl,
      }),
    });

    return { ok: true };
  } catch (err) {
    console.error('[sendFeedbackInvite]', err);
    return { ok: false, error: "Erreur lors de l'envoi du feedback." };
  }
}
