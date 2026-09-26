"use server";

import { verifyActionToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { EnrollmentStatus } from "@prisma/client";
import { isAttendanceLocked } from "@/lib/enrollment/eligibility";

export type ConfirmState =
  | {
      outcome: "ask" | "already_confirmed" | "confirmed";
      firstName: string;
      eventName: string;
      eventDate: Date;
      eventAddress: string;
    }
  | { outcome: "terminal" }
  | { outcome: "expired" }
  | { outcome: "not_found" }
  | { outcome: "invalid" };

type Ctx = {
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    j2SentAt: Date | null;
    user: { firstName: string };
    event: { name: string; date: Date; address: string };
  };
};

async function loadContext(
  token: string,
): Promise<Ctx | { error: "expired" | "invalid" | "not_found" }> {
  const result = verifyActionToken(token);
  if (!result.valid) {
    return { error: result.reason === "expired" ? "expired" : "invalid" };
  }
  if (result.action !== "confirm") {
    return { error: "invalid" };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: result.enrollmentId },
    include: {
      user: { select: { firstName: true } },
      event: { select: { name: true, date: true, address: true } },
    },
  });
  if (!enrollment || enrollment.deletedAt) {
    return { error: "not_found" };
  }

  return { enrollment };
}

function meta(enrollment: Ctx["enrollment"]) {
  return {
    firstName: enrollment.user.firstName,
    eventName: enrollment.event.name,
    eventDate: enrollment.event.date,
    eventAddress: enrollment.event.address,
  };
}

/**
 * Decides the next status a "confirm" click should reach — or null if there
 * is nothing to upgrade. Handles the case where a participante already
 * clicked the J-7 link and now clicks the J-2 link: without this, she'd stay
 * stuck at confirmee_j7 forever because the early "already confirmed" check
 * used to treat confirmee_j7 as a final state.
 */
function targetStatus(enrollment: Ctx["enrollment"]): EnrollmentStatus | null {
  if (
    enrollment.status === EnrollmentStatus.confirmee_j2 ||
    enrollment.status === EnrollmentStatus.presente
  ) {
    return null;
  }

  const daysToEvent = (enrollment.event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const inJ2Window = !!enrollment.j2SentAt || daysToEvent <= 4;

  if (enrollment.status === EnrollmentStatus.confirmee_j7) {
    return inJ2Window ? EnrollmentStatus.confirmee_j2 : null;
  }
  // inscrit / contactee
  return inJ2Window ? EnrollmentStatus.confirmee_j2 : EnrollmentStatus.confirmee_j7;
}

/** Read-only: never mutates — safe for GET, link previews and crawlers. */
export async function readConfirmState(token: string): Promise<ConfirmState> {
  const ctx = await loadContext(token);
  if ("error" in ctx) return { outcome: ctx.error };
  const { enrollment } = ctx;

  if (isAttendanceLocked(enrollment.status)) return { outcome: "terminal" };

  const next = targetStatus(enrollment);
  return next === null
    ? { outcome: "already_confirmed", ...meta(enrollment) }
    : { outcome: "ask", ...meta(enrollment) };
}

// Next.js requires a `<form action>` bound to a Server Action to return
// void — this thin wrapper exists purely for that binding; confirmEnrollment
// itself still returns the resulting state so tests can assert on it.
export async function confirmEnrollmentForm(token: string): Promise<void> {
  await confirmEnrollment(token);
}

/** Mutates. Only ever invoked from a POST form submission, never on GET. */
export async function confirmEnrollment(token: string): Promise<ConfirmState> {
  const ctx = await loadContext(token);
  if ("error" in ctx) return { outcome: ctx.error };
  const { enrollment } = ctx;

  if (isAttendanceLocked(enrollment.status)) return { outcome: "terminal" };

  const next = targetStatus(enrollment);
  if (next === null) {
    return { outcome: "already_confirmed", ...meta(enrollment) };
  }

  await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: next } });
  return { outcome: "confirmed", ...meta(enrollment) };
}
