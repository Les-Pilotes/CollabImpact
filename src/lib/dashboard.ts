import { prisma } from "@/lib/db";

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

// =====================
// Functions
// =====================

export async function getKpis(eventId: string): Promise<KpiData> {
  const event = await prisma.immersion.findUnique({
    where: { id: eventId },
    include: {
      enrollments: {
        where: { deletedAt: null },
        include: { feedback: { select: { id: true } } },
      },
    },
  });

  if (!event) return ZEROED_KPI;

  const enrollments = event.enrollments;

  const totalEnrolled = enrollments.length;
  const confirmed = enrollments.filter(
    (e) => e.status === "confirmee_j2"
  ).length;
  const attended = enrollments.filter((e) => e.status === "presente").length;
  const feedbackReceived = enrollments.filter(
    (e) => e.status === "feedback_recu" || e.feedback !== null
  ).length;

  return {
    totalEnrolled,
    confirmed,
    attended,
    feedbackReceived,
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

  const [event, tasks] = await Promise.all([
    prisma.immersion.findUnique({
      where: { id: eventId },
      include: {
        enrollments: {
          where: { deletedAt: null },
          include: { feedback: { select: { id: true } } },
        },
      },
    }),
    prisma.task.findMany({
      where: { eventId, doneAt: null, dueAt: { lt: now } },
    }),
  ]);

  if (!event) return actions;

  const enrollments = event.enrollments;
  const daysUntilEvent = Math.floor(
    (event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Action: unconfirmed enrollments within 9 days of event
  const confirmedStatuses = new Set([
    "confirmee_j2",
    "presente",
    "absente",
    "feedback_recu",
    "desistement",
  ]);
  const notYetConfirmed = enrollments.filter(
    (e) => !confirmedStatuses.has(e.status)
  ).length;

  if (notYetConfirmed > 0 && daysUntilEvent <= 9 && daysUntilEvent >= 0) {
    actions.push({
      label: `${notYetConfirmed} participante${notYetConfirmed > 1 ? "s" : ""} pas encore confirmée${notYetConfirmed > 1 ? "s" : ""}`,
      href: "/admin/participants?filter=non_confirmees",
      urgency: daysUntilEvent <= 3 ? "high" : "medium",
    });
  }

  // Action: pending feedbacks (attended but no feedback yet)
  const attended = enrollments.filter((e) => e.status === "presente").length;
  const feedbackReceived = enrollments.filter(
    (e) => e.status === "feedback_recu" || e.feedback !== null
  ).length;
  const pendingFeedbacks = attended - feedbackReceived;

  if (attended > 0 && pendingFeedbacks > 0) {
    actions.push({
      label: `${pendingFeedbacks} feedback${pendingFeedbacks > 1 ? "s" : ""} en attente`,
      href: "/admin/participants?filter=feedback_attente",
      urgency: "medium",
    });
  }

  // Action: overdue tasks
  if (tasks.length > 0) {
    actions.push({
      label: `${tasks.length} tâche${tasks.length > 1 ? "s" : ""} en retard`,
      href: "/admin/taches?filter=en_retard",
      urgency: "high",
    });
  }

  return actions;
}
