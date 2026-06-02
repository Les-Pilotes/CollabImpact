import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/cron", () => ({
  assertCronRequest: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: false, reason: "no-api-key" }),
}));

vi.mock("@/lib/email/templates/FeedbackInvite", () => ({
  default: () => null,
}));

import { GET } from "@/app/api/cron/feedback-relance/route";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { makeEnrollment, makeUser, makeEvent } from "../factories";

const mockFindMany = vi.mocked(prisma.enrollment.findMany);
const mockSendEmail = vi.mocked(sendEmail);

const makeRequest = () =>
  new Request("http://localhost:3000/api/cron/feedback-relance", {
    headers: { Authorization: "Bearer dev-cron-secret" },
  });

beforeEach(() => vi.clearAllMocks());

describe("GET /api/cron/feedback-relance", () => {
  it("sends a relance email only to enrollments with a feedbackToken", async () => {
    const withToken = makeEnrollment({
      id: "with",
      feedbackToken: "tok-1",
      user: makeUser({ firstName: "Léa" }),
      event: makeEvent({ name: "Atelier X" }),
    });
    const withoutToken = makeEnrollment({
      id: "without",
      feedbackToken: null,
      user: makeUser({ firstName: "Mei" }),
      event: makeEvent({ name: "Atelier Y" }),
    });
    mockFindMany.mockResolvedValue([withToken, withoutToken] as never);

    const response = await GET(makeRequest() as never);
    const json = await response.json();

    expect(json).toEqual({ ok: true, sent: 1 });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0].subject).toContain("ton avis");
  });

  it("returns sent=0 when nothing is eligible", async () => {
    mockFindMany.mockResolvedValue([] as never);
    const json = await (await GET(makeRequest() as never)).json();
    expect(json).toEqual({ ok: true, sent: 0 });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
