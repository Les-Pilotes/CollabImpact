import { describe, it, expect, vi, beforeEach } from "vitest";
import type { KpiData, TaskProgress, NextAction } from "@/lib/dashboard";

// Mock prisma before importing dashboard
vi.mock("@/lib/db", () => ({
  prisma: {
    immersion: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
  },
}));

// Import after mocking
import { getKpis, getTaskProgress, getNextActions } from "@/lib/dashboard";
import { prisma } from "@/lib/db";

const mockPrisma = prisma as {
  immersion: { findUnique: ReturnType<typeof vi.fn> };
  task: { findMany: ReturnType<typeof vi.fn> };
};

const EVENT_ID = "test-event-id";
const NOW = new Date("2026-05-04T10:00:00Z");

// Fixture data
const baseEvent = {
  id: EVENT_ID,
  name: "Cité Audacieuse",
  address: "10 rue des Lilas, Paris",
  date: new Date("2026-05-10T09:00:00Z"), // 6 days in the future from NOW
  capacity: 20,
  status: "publie",
};

const makeEnrollment = (
  id: string,
  status: string,
  hasFeedback = false
) => ({
  id,
  status,
  attendedAt: status === "presente" ? new Date() : null,
  feedback: hasFeedback ? { id: `feedback-${id}` } : null,
});

describe("getKpis", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("returns correct counts for known fixture data", async () => {
    const enrollments = [
      makeEnrollment("e1", "inscrit"),
      makeEnrollment("e2", "contactee"),
      makeEnrollment("e3", "confirmee_j7"),
      makeEnrollment("e4", "confirmee_j2"),
      makeEnrollment("e5", "presente"),
      makeEnrollment("e6", "presente", true), // has feedback
      makeEnrollment("e7", "feedback_recu"),
      makeEnrollment("e8", "desistement"),
    ];

    mockPrisma.immersion.findUnique.mockResolvedValue({
      ...baseEvent,
      enrollments,
    });

    const kpis: KpiData = await getKpis(EVENT_ID);

    expect(kpis.totalEnrolled).toBe(8);
    expect(kpis.confirmed).toBe(1); // only confirmee_j2
    expect(kpis.attended).toBe(2); // status === "presente"
    expect(kpis.feedbackReceived).toBe(2); // e6 (has feedback row) + e7 (status feedback_recu)
    expect(kpis.capacity).toBe(20);
    expect(kpis.eventName).toBe("Cité Audacieuse");
    expect(kpis.eventAddress).toBe("10 rue des Lilas, Paris");
  });

  it("returns zeroed KpiData when event does not exist", async () => {
    mockPrisma.immersion.findUnique.mockResolvedValue(null);

    const kpis: KpiData = await getKpis("nonexistent-event");

    expect(kpis.totalEnrolled).toBe(0);
    expect(kpis.capacity).toBe(0);
    expect(kpis.eventName).toBe("");
  });
});

describe("getTaskProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("returns 3 phases with correct done/total counts", async () => {
    mockPrisma.task.findMany.mockResolvedValue([
      { phase: "PREPARATION", doneAt: new Date() },
      { phase: "PREPARATION", doneAt: new Date() },
      { phase: "PREPARATION", doneAt: null },
      { phase: "WORKSHOP", doneAt: new Date() },
      { phase: "WORKSHOP", doneAt: null },
      { phase: "WORKSHOP", doneAt: null },
      { phase: "POST_EVENT", doneAt: null },
    ]);

    const progress: TaskProgress[] = await getTaskProgress(EVENT_ID);

    expect(progress).toHaveLength(3);

    const prep = progress.find((p) => p.phase === "PREPARATION")!;
    expect(prep.total).toBe(3);
    expect(prep.done).toBe(2);

    const workshop = progress.find((p) => p.phase === "WORKSHOP")!;
    expect(workshop.total).toBe(3);
    expect(workshop.done).toBe(1);

    const post = progress.find((p) => p.phase === "POST_EVENT")!;
    expect(post.total).toBe(1);
    expect(post.done).toBe(0);
  });
});

describe("getNextActions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // Default: no overdue tasks
    mockPrisma.task.findMany.mockResolvedValue([]);
  });

  it("returns urgency:high action when feedbacks are pending after event", async () => {
    // Event is in the past — attended but no feedback
    mockPrisma.immersion.findUnique.mockResolvedValue({
      ...baseEvent,
      date: new Date("2026-04-30T09:00:00Z"), // 4 days ago
      enrollments: [
        makeEnrollment("e1", "presente"),
        makeEnrollment("e2", "presente"),
        makeEnrollment("e3", "presente", true), // has feedback
      ],
    });

    const actions: NextAction[] = await getNextActions(EVENT_ID);

    const feedbackAction = actions.find((a) =>
      a.label.includes("feedback")
    );
    expect(feedbackAction).toBeDefined();
    expect(feedbackAction!.urgency).toBe("medium");
    expect(feedbackAction!.href).toContain("feedback_attente");
  });

  it("returns urgency:high action for overdue tasks", async () => {
    mockPrisma.task.findMany.mockResolvedValue([
      { id: "t1", phase: "PREPARATION", dueAt: new Date("2026-05-01"), doneAt: null },
      { id: "t2", phase: "WORKSHOP", dueAt: new Date("2026-05-02"), doneAt: null },
    ]);

    mockPrisma.immersion.findUnique.mockResolvedValue({
      ...baseEvent,
      enrollments: [],
    });

    const actions: NextAction[] = await getNextActions(EVENT_ID);

    const taskAction = actions.find((a) => a.label.includes("retard"));
    expect(taskAction).toBeDefined();
    expect(taskAction!.urgency).toBe("high");
    expect(taskAction!.label).toContain("2 tâches");
  });

  it("returns empty array when everything is done", async () => {
    // Event in the future (> 9 days), no attendees, no overdue tasks
    mockPrisma.immersion.findUnique.mockResolvedValue({
      ...baseEvent,
      date: new Date("2026-06-01T09:00:00Z"), // 28 days away
      enrollments: [
        makeEnrollment("e1", "confirmee_j2"),
        makeEnrollment("e2", "confirmee_j2"),
      ],
    });

    mockPrisma.task.findMany.mockResolvedValue([]);

    const actions: NextAction[] = await getNextActions(EVENT_ID);

    expect(actions).toHaveLength(0);
  });
});
