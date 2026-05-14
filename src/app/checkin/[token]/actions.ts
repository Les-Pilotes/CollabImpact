'use server';

/**
 * markPresent — flips an enrollment to `presente` after verifying the signed
 * checkin token. Called from the QR check-in landing page (the participante
 * herself scans the QR; no admin session is required).
 *
 * Idempotent: if the enrollment is already `presente`, returns the existing
 * `attendedAt` instead of overwriting it. Returns the welcome payload
 * (`firstName`, `eventName`, …) so the page can render a personalised greeting
 * without re-querying.
 *
 * Terminal states (`absente`, `desistement`, `feedback_recu`) block the action
 * to avoid resurrecting a participante who explicitly dropped out.
 */

import { prisma } from '@/lib/db';
import { verifyCheckinToken } from '@/lib/tokens';
import { EnrollmentStatus } from '@prisma/client';

export type CheckinOutcome =
  | {
      ok: true;
      kind: 'just_checked_in' | 'already_present';
      firstName: string;
      eventName: string;
      eventDate: Date;
      attendedAt: Date;
    }
  | {
      ok: false;
      reason: 'expired' | 'invalid' | 'not_found' | 'terminal';
      firstName?: string;
    };

export async function markPresent(token: string): Promise<CheckinOutcome> {
  const result = verifyCheckinToken(token);
  if (!result.valid) {
    return {
      ok: false,
      reason: result.reason === 'expired' ? 'expired' : 'invalid',
    };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: result.enrollmentId },
    include: {
      user: { select: { firstName: true } },
      event: { select: { name: true, date: true } },
    },
  });

  if (!enrollment || enrollment.deletedAt) {
    return { ok: false, reason: 'not_found' };
  }

  // Already checked in — idempotent
  if (
    enrollment.status === EnrollmentStatus.presente &&
    enrollment.attendedAt
  ) {
    return {
      ok: true,
      kind: 'already_present',
      firstName: enrollment.user.firstName,
      eventName: enrollment.event.name,
      eventDate: enrollment.event.date,
      attendedAt: enrollment.attendedAt,
    };
  }

  // Blocked: terminal states
  if (
    enrollment.status === EnrollmentStatus.absente ||
    enrollment.status === EnrollmentStatus.desistement ||
    enrollment.status === EnrollmentStatus.feedback_recu
  ) {
    return {
      ok: false,
      reason: 'terminal',
      firstName: enrollment.user.firstName,
    };
  }

  const now = new Date();
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: EnrollmentStatus.presente,
      attendedAt: now,
      noShow: false,
    },
  });

  return {
    ok: true,
    kind: 'just_checked_in',
    firstName: enrollment.user.firstName,
    eventName: enrollment.event.name,
    eventDate: enrollment.event.date,
    attendedAt: now,
  };
}
