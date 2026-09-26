"use server";

import { verifyActionToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { EnrollmentStatus } from "@prisma/client";
import { isDeclineLocked } from "@/lib/enrollment/eligibility";
import { logEnrollmentEvent } from "@/lib/enrollment/timeline";

export type DeclineState =
  | { outcome: "ask"; firstName: string; eventName: string }
  | { outcome: "already_declined"; firstName: string; eventName: string; canUndo: boolean }
  | { outcome: "declined"; firstName: string; eventName: string }
  | { outcome: "undone"; firstName: string; eventName: string }
  | { outcome: "terminal" }
  | { outcome: "expired" }
  | { outcome: "not_found" }
  | { outcome: "invalid" };

type Ctx = {
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    j7SentAt: Date | null;
    j2SentAt: Date | null;
    user: { firstName: string };
    event: { name: string; date: Date };
  };
};

async function loadContext(
  token: string,
): Promise<Ctx | { error: "expired" | "invalid" | "not_found" }> {
  const result = verifyActionToken(token);
  if (!result.valid) {
    return { error: result.reason === "expired" ? "expired" : "invalid" };
  }
  if (result.action !== "decline") {
    return { error: "invalid" };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: result.enrollmentId },
    include: {
      user: { select: { firstName: true } },
      event: { select: { name: true, date: true } },
    },
  });
  if (!enrollment || enrollment.deletedAt) {
    return { error: "not_found" };
  }

  return { enrollment };
}

function meta(enrollment: Ctx["enrollment"]) {
  return { firstName: enrollment.user.firstName, eventName: enrollment.event.name };
}

/**
 * Read-only: decides what the page should show. Never mutates — safe to run
 * on a plain GET, including link-preview crawlers and antivirus scanners
 * that pre-fetch links from emails.
 */
export async function readDeclineState(token: string): Promise<DeclineState> {
  const ctx = await loadContext(token);
  if ("error" in ctx) return { outcome: ctx.error };
  const { enrollment } = ctx;

  if (enrollment.status === EnrollmentStatus.desistement) {
    return {
      outcome: "already_declined",
      ...meta(enrollment),
      canUndo: enrollment.event.date.getTime() > Date.now(),
    };
  }
  if (isDeclineLocked(enrollment.status)) {
    return { outcome: "terminal" };
  }
  return { outcome: "ask", ...meta(enrollment) };
}

// Next.js requires a `<form action>` bound to a Server Action to return
// void — these thin wrappers exist purely for that binding; the underlying
// functions below still return the resulting state so tests can assert on it.
export async function declineEnrollmentForm(token: string): Promise<void> {
  await declineEnrollment(token);
}

export async function undoDeclineForm(token: string): Promise<void> {
  await undoDecline(token);
}

/** Mutates. Only ever invoked from a POST form submission, never on GET. */
export async function declineEnrollment(token: string): Promise<DeclineState> {
  const ctx = await loadContext(token);
  if ("error" in ctx) return { outcome: ctx.error };
  const { enrollment } = ctx;

  if (enrollment.status === EnrollmentStatus.desistement) {
    return {
      outcome: "already_declined",
      ...meta(enrollment),
      canUndo: enrollment.event.date.getTime() > Date.now(),
    };
  }
  if (isDeclineLocked(enrollment.status)) {
    return { outcome: "terminal" };
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: EnrollmentStatus.desistement },
  });
  await logEnrollmentEvent({
    enrollmentId: enrollment.id,
    type: "status_changed",
    label: "Désistement",
  });
  return { outcome: "declined", ...meta(enrollment) };
}

/**
 * Reversal: only while the event hasn't happened yet. Puts her back at the
 * stage the reminders had already reached, so the cron windows still make
 * sense (it won't re-send an email that already went out).
 */
export async function undoDecline(token: string): Promise<DeclineState> {
  const ctx = await loadContext(token);
  if ("error" in ctx) return { outcome: ctx.error };
  const { enrollment } = ctx;

  if (enrollment.status !== EnrollmentStatus.desistement) {
    return { outcome: "terminal" };
  }
  if (enrollment.event.date.getTime() <= Date.now()) {
    return { outcome: "terminal" };
  }

  const restored = enrollment.j2SentAt
    ? EnrollmentStatus.confirmee_j7
    : enrollment.j7SentAt
      ? EnrollmentStatus.contactee
      : EnrollmentStatus.inscrit;

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: restored },
  });
  await logEnrollmentEvent({
    enrollmentId: enrollment.id,
    type: "status_changed",
    label: "Désistement annulé",
  });
  return { outcome: "undone", ...meta(enrollment) };
}
