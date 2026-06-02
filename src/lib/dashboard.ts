import { prisma } from "@/lib/db";
import type { EnrollmentStatus } from "@prisma/client";

// =====================
// Types
// =====================

export type KpiData = {
  totalEnrolled: number;
  confirmed: number;
  attended: number;
  feedbackReceived: number;
  capacity: number;
  eventDate: Date;
  eventName: string;
  eventAddress: string;
};

export type TaskProgress = {
  phase: "PREPARATION" | "WORKSHOP" | "POST_EVENT";
  total: number;
  done: number;
};

export type NextAction = {
  label: string;
  href: string;
  urgency: "high" | "medium" | "low";
};

// =====================
// Helpers
// =====================

const ZEROED_KPI: KpiData = {
  totalEnrolled: 0,
  confirmed: 0,
  attended: 0,
  feedbackReceived: 0,
  capacity: 0,
  eventDate: new Date(0),
  eventName: "",
  eventAddress: "",
};

/**
 * Statuses that count as "confirmed" for the next-action threshold below.
 * Anything outside this set is considered "not yet confirmed" and may
 * surface a follow-up reminder when the event is approaching.
 */
const CONFIRMED_STATUSES: ReadonlySet<EnrollmentStatus> = new Set<EnrollmentStatus>([
  "confirmee_j2",
  "presente",
  "absente",
  "feedback_recu",
  "desistement",
]);

type StatusCounts = Partial<Record<EnrollmentStatus, number>> & {
  __total: number;
};

/**
 * Aggregates enrollment counts by status in a single SQL roundtrip. Replaces
 * the previous pattern of loading every enrollment into RAM and filtering
 * in JS — that scaled linearly with attendance.
 */
async function getEnrollmentCounts(eventId: string): Promise<{
  byStatus: StatusCounts;
  feedbackReceived: number;
}> {
  const [groups, feedbackReceived] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ["status"],
      where: { eventId, deletedAt: null },
      _count: { _all: true },
    }),
    // Union of (status=feedback_recu) and (feedback row exists) — matches
    // the prior JS predicate `e.status === "feedback_recu" || e.feedback !== null`.
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

// =====================
// Functions
// =====================

export async function getKpis(eventId: string): Promise<KpiData> {
  const [event, counts] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: {
        capacity: true,
        date: true,
        name: true,
        address: true,
      },
    }),
    getEnrollmentCounts(eventId),
  ]);

  if (!event) return ZEROED_KPI;

  return {
    totalEnrolled: counts.byStatus.__total,
    confirmed: counts.byStatus.confirmee_j2 ?? 0,
    attended: counts.byStatus.presente ?? 0,
    feedbackReceived: counts.feedbackReceived,
    capacity: event.capacity,
    eventDate: event.date,
    eventName: event.name,
    eventAddress: event.address,
  };
}

export async function getTaskProgress(
  eventId: string
): Promise<TaskProgress[]> {
  const tasks = await prisma.task.findMany({
    where: { eventId },
    select: { phase: true, doneAt: true },
  });

  const phases: Array<"PREPARATION" | "WORKSHOP" | "POST_EVENT"> = [
    "PREPARATION",
    "WORKSHOP",
    "POST_EVENT",
  ];

  return phases.map((phase) => {
    const phaseTasks = tasks.filter((t) => t.phase === phase);
    return {
      phase,
      total: phaseTasks.length,
      done: phaseTasks.filter((t) => t.doneAt !== null).length,
    };
  });
}

export async function getNextActions(eventId: string): Promise<NextAction[]> {
  const now = new Date();
  const actions: NextAction[] = [];

  const [event, counts, overdueTasks] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { date: true },
    }),
    getEnrollmentCounts(eventId),
    prisma.task.findMany({
      where: { eventId, doneAt: null, dueAt: { lt: now } },
      select: { id: true },
    }),
  ]);

  if (!event) return actions;

  const daysUntilEvent = Math.floor(
    (event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  let notYetConfirmed = 0;
  for (const [status, n] of Object.entries(counts.byStatus)) {
    if (status === "__total") continue;
    if (!CONFIRMED_STATUSES.has(status as EnrollmentStatus)) {
      notYetConfirmed += n ?? 0;
    }
  }

  if (notYetConfirmed > 0 && daysUntilEvent <= 9 && daysUntilEvent >= 0) {
    actions.push({
      label: `${notYetConfirmed} participante${notYetConfirmed > 1 ? "s" : ""} pas encore confirmée${notYetConfirmed > 1 ? "s" : ""}`,
      href: `/admin/events/${eventId}/inscrites`,
      urgency: daysUntilEvent <= 3 ? "high" : "medium",
    });
  }

  const attended = counts.byStatus.presente ?? 0;
  const pendingFeedbacks = attended - counts.feedbackReceived;
  if (attended > 0 && pendingFeedbacks > 0) {
    actions.push({
      label: `${pendingFeedbacks} feedback${pendingFeedbacks > 1 ? "s" : ""} en attente`,
      href: `/admin/events/${eventId}/inscrites`,
      urgency: "medium",
    });
  }

  if (overdueTasks.length > 0) {
    actions.push({
      label: `${overdueTasks.length} tâche${overdueTasks.length > 1 ? "s" : ""} en retard`,
      href: `/admin/events/${eventId}/taches`,
      urgency: "high",
    });
  }

  return actions;
}
