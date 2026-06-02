import { describe, it, expect, vi, beforeEach } from "vitest";
import type { KpiData, TaskProgress, NextAction } from "@/lib/dashboard";

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
    enrollment: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { getKpis, getTaskProgress, getNextActions } from "@/lib/dashboard";
import { prisma } from "@/lib/db";

const mockPrisma = prisma as unknown as {
  event: { findUnique: ReturnType<typeof vi.fn> };
  task: { findMany: ReturnType<typeof vi.fn> };
  enrollment: {
    groupBy: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

const EVENT_ID = "test-event-id";
const NOW = new Date("2026-05-04T10:00:00Z");

const baseEvent = {
  capacity: 20,
  date: new Date("2026-05-10T09:00:00Z"), // 6 days in the future from NOW
  name: "Cité Audacieuse",
  address: "10 rue des Lilas, Paris",
};

function group(status: string, n: number) {
  return { status, _count: { _all: n } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getKpis", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("aggregates status counts via SQL groupBy and counts feedbacks separately", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(baseEvent);
    mockPrisma.enrollment.groupBy.mockResolvedValue([
      group("inscrit", 1),
      group("contactee", 1),
      group("confirmee_j7", 1),
      group("confirmee_j2", 1),
      group("presente", 2),
      group("feedback_recu", 1),
      group("desistement", 1),
    ]);
    mockPrisma.enrollment.count.mockResolvedValue(2); // feedback union

    const kpis: KpiData = await getKpis(EVENT_ID);

    expect(kpis.totalEnrolled).toBe(8);
    expect(kpis.confirmed).toBe(1);
    expect(kpis.attended).toBe(2);
    expect(kpis.feedbackReceived).toBe(2);
    expect(kpis.capacity).toBe(20);
    expect(kpis.eventName).toBe("Cité Audacieuse");
  });

  it("returns zeroed KpiData when event does not exist", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);
    mockPrisma.enrollment.groupBy.mockResolvedValue([]);
    mockPrisma.enrollment.count.mockResolvedValue(0);

    const kpis: KpiData = await getKpis("nonexistent-event");

    expect(kpis.totalEnrolled).toBe(0);
    expect(kpis.capacity).toBe(0);
    expect(kpis.eventName).toBe("");
  });

  it("handles a totally empty enrollment set without crashing", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(baseEvent);
    mockPrisma.enrollment.groupBy.mockResolvedValue([]);
    mockPrisma.enrollment.count.mockResolvedValue(0);

    const kpis: KpiData = await getKpis(EVENT_ID);

    expect(kpis.totalEnrolled).toBe(0);
    expect(kpis.confirmed).toBe(0);
    expect(kpis.attended).toBe(0);
    expect(kpis.feedbackReceived).toBe(0);
    expect(kpis.capacity).toBe(20);
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
    expect(progress.find((p) => p.phase === "PREPARATION")).toEqual({
      phase: "PREPARATION",
      total: 3,
      done: 2,
    });
    expect(progress.find((p) => p.phase === "WORKSHOP")).toEqual({
      phase: "WORKSHOP",
      total: 3,
      done: 1,
    });
    expect(progress.find((p) => p.phase === "POST_EVENT")).toEqual({
      phase: "POST_EVENT",
      total: 1,
      done: 0,
    });
  });
});

describe("getNextActions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mockPrisma.task.findMany.mockResolvedValue([]);
  });

  it("surfaces pending feedbacks after the event", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      date: new Date("2026-04-30T09:00:00Z"), // 4 days ago
    });
    mockPrisma.enrollment.groupBy.mockResolvedValue([group("presente", 3)]);
    mockPrisma.enrollment.count.mockResolvedValue(1); // only 1 feedback in

    const actions: NextAction[] = await getNextActions(EVENT_ID);

    const feedbackAction = actions.find((a) => a.label.includes("feedback"));
    expect(feedbackAction).toBeDefined();
    expect(feedbackAction!.urgency).toBe("medium");
    expect(feedbackAction!.label).toContain("2 feedbacks");
  });

  it("surfaces overdue tasks with high urgency", async () => {
    mockPrisma.task.findMany.mockResolvedValue([
      { id: "t1" },
      { id: "t2" },
    ]);
    mockPrisma.event.findUnique.mockResolvedValue({ date: baseEvent.date });
    mockPrisma.enrollment.groupBy.mockResolvedValue([]);
    mockPrisma.enrollment.count.mockResolvedValue(0);

    const actions: NextAction[] = await getNextActions(EVENT_ID);

    const taskAction = actions.find((a) => a.label.includes("retard"));
    expect(taskAction).toBeDefined();
    expect(taskAction!.urgency).toBe("high");
    expect(taskAction!.label).toContain("2 tâches");
  });

  it("returns no action when everything is on track", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      date: new Date("2026-06-01T09:00:00Z"), // 28 days away
    });
    mockPrisma.enrollment.groupBy.mockResolvedValue([
      group("confirmee_j2", 2),
    ]);
    mockPrisma.enrollment.count.mockResolvedValue(0);

    const actions: NextAction[] = await getNextActions(EVENT_ID);

    expect(actions).toHaveLength(0);
  });

  it("surfaces not-yet-confirmed participants when event is approaching", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      date: new Date("2026-05-06T09:00:00Z"), // 2 days from NOW → high urgency
    });
    mockPrisma.enrollment.groupBy.mockResolvedValue([
      group("inscrit", 1),
      group("contactee", 2),
      group("confirmee_j7", 1), // not in the "confirmed" set
      group("confirmee_j2", 3), // ✅ confirmed
    ]);
    mockPrisma.enrollment.count.mockResolvedValue(0);

    const actions: NextAction[] = await getNextActions(EVENT_ID);

    const confirmAction = actions.find((a) =>
      a.label.includes("pas encore confirmée"),
    );
    expect(confirmAction).toBeDefined();
    expect(confirmAction!.urgency).toBe("high");
    expect(confirmAction!.label).toContain("4 participantes");
  });
});
