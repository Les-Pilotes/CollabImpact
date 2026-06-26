import { describe, it, expect, vi, beforeEach } from "vitest";

// Feedback invites are sent manually (server action `sendFeedbackInvite`), so
// the cron is intentionally a no-op. These tests pin that behaviour: it stays
// auth-gated but never sends.

vi.mock("@/lib/cron", () => ({
  assertCronRequest: vi.fn().mockReturnValue(null),
}));

import { GET } from "@/app/api/cron/feedback/route";
import { assertCronRequest } from "@/lib/cron";
import { NextResponse } from "next/server";

const mockAssert = vi.mocked(assertCronRequest);

beforeEach(() => {
  vi.clearAllMocks();
  mockAssert.mockReturnValue(null);
});

const makeRequest = () =>
  new Request("http://localhost:3000/api/cron/feedback", {
    headers: { Authorization: "Bearer dev-cron-secret" },
  });

describe("GET /api/cron/feedback (disabled — manual sending only)", () => {
  it("is a no-op: returns sent 0 and the disabled flag", async () => {
    const response = await GET(makeRequest() as never);
    const json = await response.json();

    expect(json).toEqual({ ok: true, sent: 0, disabled: true });
  });

  it("still enforces the cron authorization", async () => {
    mockAssert.mockReturnValue(
      NextResponse.json({ error: "unauthorized" }, { status: 401 }) as never,
    );

    const response = await GET(makeRequest() as never);

    expect(response.status).toBe(401);
  });
});
