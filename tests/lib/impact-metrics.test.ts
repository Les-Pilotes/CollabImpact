import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { getFunnelCounts, ATTENDED_STATUSES, CONFIRMED_STATUSES } from "@/lib/impact/metrics";

const mockGroupBy = vi.mocked(prisma.enrollment.groupBy);
const mockCount = vi.mocked(prisma.enrollment.count);

function group(status: string, n: number) {
  return { status, _count: { _all: n } } as never;
}

beforeEach(() => vi.clearAllMocks());

describe("ATTENDED_STATUSES / CONFIRMED_STATUSES", () => {
  it("attended includes feedback_recu — it is reached FROM presente, not instead of it", () => {
    expect(ATTENDED_STATUSES.has("presente")).toBe(true);
    expect(ATTENDED_STATUSES.has("feedback_recu")).toBe(true);
    expect(ATTENDED_STATUSES.has("confirmee_j2")).toBe(false);
  });

  it("confirmed is a superset that includes attended", () => {
    for (const s of ATTENDED_STATUSES) expect(CONFIRMED_STATUSES.has(s)).toBe(true);
    expect(CONFIRMED_STATUSES.has("confirmee_j2")).toBe(true);
  });
});

describe("getFunnelCounts — regression for the >100% funnel bug", () => {
  it("does not drop attendance once a participante submits feedback", async () => {
    mockGroupBy.mockResolvedValue([group("presente", 2), group("feedback_recu", 3)] as never);
    mockCount.mockResolvedValue(3);

    const funnel = await getFunnelCounts("ev-1");

    expect(funnel.totalEnrolled).toBe(5);
    expect(funnel.attended).toBe(5); // all 5 were physically there
    expect(funnel.feedbackReceived).toBe(3);
    // The feedback response rate must never exceed 100%.
    expect(funnel.feedbackReceived).toBeLessThanOrEqual(funnel.attended);
  });

  it("confirmed counts everyone who reached confirmee_j2 or further", async () => {
    mockGroupBy.mockResolvedValue([
      group("confirmee_j7", 2),
      group("confirmee_j2", 4),
      group("presente", 3),
      group("absente", 1),
    ] as never);
    mockCount.mockResolvedValue(0);

    const funnel = await getFunnelCounts("ev-1");

    expect(funnel.totalEnrolled).toBe(10);
    expect(funnel.confirmed).toBe(7); // confirmee_j2(4) + presente(3) — not confirmee_j7 or absente
    // Percentages derived from these numbers can never exceed 100%.
    const confirmedPct = Math.round((funnel.confirmed / funnel.totalEnrolled) * 100);
    expect(confirmedPct).toBeLessThanOrEqual(100);
  });

  it("handles an empty event without crashing", async () => {
    mockGroupBy.mockResolvedValue([] as never);
    mockCount.mockResolvedValue(0);

    const funnel = await getFunnelCounts("ev-empty");

    expect(funnel).toEqual({
      totalEnrolled: 0,
      confirmed: 0,
      attended: 0,
      feedbackReceived: 0,
    });
  });
});
