import { EnrollmentStatus } from "@prisma/client";
import { isWalkinWindowOpen, parisCalendarDaysUntil } from "@/lib/datetime";

/**
 * Statuses where "confirming attendance" (the J-7/J-2 email link) or
 * "checking in" (the personal Jour-J QR) should both be refused: the
 * participante's journey already reached a state that neither action should
 * reopen — she never showed up, she cancelled, or she already gave feedback.
 * Shared by src/app/confirm/[token]/actions.ts and
 * src/app/checkin/[token]/actions.ts.
 */
export const ATTENDANCE_LOCKED_STATUSES: ReadonlySet<EnrollmentStatus> = new Set<EnrollmentStatus>([
  EnrollmentStatus.absente,
  EnrollmentStatus.desistement,
  EnrollmentStatus.feedback_recu,
]);

export function isAttendanceLocked(status: EnrollmentStatus): boolean {
  return ATTENDANCE_LOCKED_STATUSES.has(status);
}

/**
 * Statuses where "declining" (the J-7/J-2 email link) should be refused: she
 * already showed up, or the event is already wrapped up for her.
 */
export const DECLINE_LOCKED_STATUSES: ReadonlySet<EnrollmentStatus> = new Set<EnrollmentStatus>([
  EnrollmentStatus.absente,
  EnrollmentStatus.presente,
  EnrollmentStatus.feedback_recu,
]);

export function isDeclineLocked(status: EnrollmentStatus): boolean {
  return DECLINE_LOCKED_STATUSES.has(status);
}

/** Can she open and submit the post-event feedback questionnaire? */
export function isFeedbackEligible(status: EnrollmentStatus): boolean {
  return status === EnrollmentStatus.presente;
}

const WALKIN_OPEN_EVENT_STATUSES: ReadonlySet<string> = new Set(["publie", "complet", "en_cours"]);

/** Is the walk-in form open for this event right now? */
export function canWalkIn(event: { status: string; date: Date }, now: Date = new Date()): boolean {
  return WALKIN_OPEN_EVENT_STATUSES.has(event.status) && isWalkinWindowOpen(event.date, now);
}

/**
 * Is "now" within the calendar-day window for a reminder (J-7: 3..7 days
 * out, J-2: 1..2 days out — see the j7/j2 cron routes for the constants).
 */
export function isInReminderWindow(
  eventDate: Date,
  minDays: number,
  maxDays: number,
  now: Date = new Date(),
): boolean {
  const daysUntil = parisCalendarDaysUntil(eventDate, now);
  return daysUntil >= minDays && daysUntil <= maxDays;
}
