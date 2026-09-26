import type { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Single source of truth for "who counts as what" in an event's funnel.
 *
 * `EnrollmentStatus` is a single-track field that a participante moves
 * through — `feedback_recu` is reached FROM `presente` once she answers the
 * questionnaire, it does not replace it. Any KPI that looks only at
 * `status === "presente"` therefore under-counts attendance (and everything
 * derived from it — the feedback response rate, the funnel percentages)
 * as soon as the first feedback comes in. Every funnel/KPI computation must
 * go through these sets rather than comparing `status` to a single value.
 */
export const ATTENDED_STATUSES: ReadonlySet<EnrollmentStatus> = new Set<EnrollmentStatus>([
  "presente",
  "feedback_recu",
]);

export const CONFIRMED_STATUSES: ReadonlySet<EnrollmentStatus> = new Set<EnrollmentStatus>([
  "confirmee_j2",
  "presente",
  "feedback_recu",
]);

export type StatusCounts = Partial<Record<EnrollmentStatus, number>> & {
  __total: number;
};

function sumStatuses(byStatus: StatusCounts, statuses: ReadonlySet<EnrollmentStatus>): number {
  let sum = 0;
  for (const status of statuses) sum += byStatus[status] ?? 0;
  return sum;
}

/**
 * Aggregates enrollment counts by status in a single SQL roundtrip, plus the
 * feedback count (union of `status = feedback_recu` and "a Feedback row
 * exists", in case those two ever diverge).
 */
export async function getEnrollmentCounts(eventId: string): Promise<{
  byStatus: StatusCounts;
  feedbackReceived: number;
}> {
  const [groups, feedbackReceived] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ["status"],
      where: { eventId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.enrollment.count({
      where: {
        eventId,
        deletedAt: null,
        OR: [{ status: "feedback_recu" }, { feedback: { isNot: null } }],
      },
    }),
  ]);

  const byStatus: StatusCounts = { __total: 0 };
  for (const g of groups) {
    const n = g._count?._all ?? 0;
    byStatus[g.status] = n;
    byStatus.__total += n;
  }

  return { byStatus, feedbackReceived };
}

export type FunnelCounts = {
  totalEnrolled: number;
  confirmed: number;
  attended: number;
  feedbackReceived: number;
};

/**
 * The funnel numbers shown on Aperçu / Bilan: confirmed and attended are
 * supersets (anyone further along the funnel still counts), so percentages
 * never exceed 100% and the feedback rate stays meaningful once responses
 * start coming in.
 */
export async function getFunnelCounts(eventId: string): Promise<FunnelCounts> {
  const { byStatus, feedbackReceived } = await getEnrollmentCounts(eventId);
  return {
    totalEnrolled: byStatus.__total,
    confirmed: sumStatuses(byStatus, CONFIRMED_STATUSES),
    attended: sumStatuses(byStatus, ATTENDED_STATUSES),
    feedbackReceived,
  };
}
