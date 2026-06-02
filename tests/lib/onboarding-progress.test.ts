import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { count: vi.fn() },
    enrollment: { count: vi.fn() },
    feedback: { count: vi.fn() },
    admin: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { getOnboardingProgress } from "@/lib/onboarding/progress";

const p = prisma as unknown as {
  event: { count: ReturnType<typeof vi.fn> };
  enrollment: { count: ReturnType<typeof vi.fn> };
  feedback: { count: ReturnType<typeof vi.fn> };
  admin: { count: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

function mockCounts({
  events = 0,
  publishedEvents = 0,
  enrollments = 0,
  feedbacks = 0,
  admins = 0,
}: Partial<{
  events: number;
  publishedEvents: number;
  enrollments: number;
  feedbacks: number;
  admins: number;
}>) {
  // event.count is called twice: total then published-or-beyond
  p.event.count.mockResolvedValueOnce(events as never);
  p.event.count.mockResolvedValueOnce(publishedEvents as never);
  p.enrollment.count.mockResolvedValue(enrollments as never);
  p.feedback.count.mockResolvedValue(feedbacks as never);
  p.admin.count.mockResolvedValue(admins as never);
}

describe("getOnboardingProgress", () => {
  it("returns 5/5 items for a SUPER_ADMIN with everything done", async () => {
    mockCounts({
      events: 3,
      publishedEvents: 2,
      enrollments: 30,
      feedbacks: 8,
      admins: 3,
    });

    const r = await getOnboardingProgress({
      organisationId: "org-1",
      isSuperAdmin: true,
    });

    expect(r.total).toBe(5);
    expect(r.completed).toBe(5);
    expect(r.items.every((i) => i.done)).toBe(true);
    expect(r.items.find((i) => i.key === "team_assembled")).toBeDefined();
  });

  it("returns 4/4 items for a non-SUPER_ADMIN (no team item)", async () => {
    mockCounts({});

    const r = await getOnboardingProgress({
      organisationId: "org-1",
      isSuperAdmin: false,
    });

    expect(r.total).toBe(4);
    expect(r.items.find((i) => i.key === "team_assembled")).toBeUndefined();
  });

  it("marks first_event_created done when at least one event exists", async () => {
    mockCounts({ events: 1 });

    const r = await getOnboardingProgress({
      organisationId: "org-1",
      isSuperAdmin: false,
    });

    expect(r.completed).toBe(1);
    expect(r.items.find((i) => i.key === "first_event_created")?.done).toBe(true);
    expect(
      r.items.find((i) => i.key === "first_event_published")?.done,
    ).toBe(false);
  });

  it("marks team_assembled done only with 2+ admins", async () => {
    mockCounts({ admins: 1 });
    let r = await getOnboardingProgress({
      organisationId: "org-1",
      isSuperAdmin: true,
    });
    expect(r.items.find((i) => i.key === "team_assembled")?.done).toBe(false);

    mockCounts({ admins: 2 });
    r = await getOnboardingProgress({
      organisationId: "org-1",
      isSuperAdmin: true,
    });
    expect(r.items.find((i) => i.key === "team_assembled")?.done).toBe(true);
  });

  it("scopes every query to the provided organisationId", async () => {
    mockCounts({});
    await getOnboardingProgress({
      organisationId: "org-zen",
      isSuperAdmin: true,
    });

    expect(p.event.count).toHaveBeenCalledTimes(2);
    for (const call of p.event.count.mock.calls) {
      expect(call[0].where.organisationId).toBe("org-zen");
    }
    expect(p.enrollment.count.mock.calls[0][0].where.organisationId).toBe(
      "org-zen",
    );
    expect(p.feedback.count.mock.calls[0][0].where.enrollment.organisationId).toBe(
      "org-zen",
    );
    expect(p.admin.count.mock.calls[0][0].where.organisationId).toBe("org-zen");
  });
});
