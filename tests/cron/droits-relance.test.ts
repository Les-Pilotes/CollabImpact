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

vi.mock("@/lib/email/templates/DroitsRelance", () => ({
  default: () => null,
}));

import { GET } from "@/app/api/cron/droits-relance/route";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { makeEnrollment, makeUser, makeEvent } from "../factories";

const mockFindMany = vi.mocked(prisma.enrollment.findMany);
const mockSendEmail = vi.mocked(sendEmail);

const makeRequest = () =>
  new Request("http://localhost:3000/api/cron/droits-relance", {
    headers: { Authorization: "Bearer dev-cron-secret" },
  });

beforeEach(() => vi.clearAllMocks());

describe("GET /api/cron/droits-relance", () => {
  it("sends a reminder email for every minor with pending parental rights", async () => {
    mockFindMany.mockResolvedValue([
      makeEnrollment({
        id: "minor-1",
        droitsImageStatus: "minor_parental_pending",
        user: makeUser({ firstName: "Ada" }),
        event: makeEvent({ name: "Workshop A" }),
      }),
      makeEnrollment({
        id: "minor-2",
        droitsImageStatus: "minor_parental_pending",
        user: makeUser({ firstName: "Bea" }),
        event: makeEvent({ name: "Workshop B" }),
      }),
    ] as never);

    const json = await (await GET(makeRequest() as never)).json();

    expect(json).toEqual({ ok: true, sent: 2 });
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail.mock.calls[0][0].subject).toContain(
      "autorisation parentale",
    );
  });

  it("returns sent=0 with no eligible enrollments", async () => {
    mockFindMany.mockResolvedValue([] as never);
    const json = await (await GET(makeRequest() as never)).json();
    expect(json).toEqual({ ok: true, sent: 0 });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
