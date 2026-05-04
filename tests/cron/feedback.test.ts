import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
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

vi.mock("@/lib/tokens", () => ({
  createFeedbackToken: vi.fn().mockReturnValue("mock-token-abc"),
}));

import { GET } from "@/app/api/cron/feedback/route";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { createFeedbackToken } from "@/lib/tokens";

const mockFindMany = vi.mocked(prisma.enrollment.findMany);
const mockUpdate = vi.mocked(prisma.enrollment.update);
const mockSendEmail = vi.mocked(sendEmail);
const mockCreateToken = vi.mocked(createFeedbackToken);

const makeEnrollment = (id: string) => ({
  id,
  userId: "user-1",
  immersionId: "seed-event-cite-audacieuse",
  organisationId: "seed-org-lespilotes",
  status: "presente" as const,
  mode: "individuel" as const,
  referentName: null,
  source: null,
  attendedAt: new Date(),
  noShow: false,
  j7SentAt: new Date(),
  j2SentAt: new Date(),
  feedbackToken: null,
  feedbackSentAt: null,
  deletedAt: null,
  enrolledAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: "user-1",
    firstName: "Yasmine",
    lastName: "Benali",
    email: "yasmine@test.fr",
    organisationId: "seed-org-lespilotes",
    supabaseAuthId: null,
    phone: null,
    birthDate: null,
    city: null,
    source: null,
    reliabilityScore: 0,
    emailVerified: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  immersion: {
    id: "seed-event-cite-audacieuse",
    organisationId: "seed-org-lespilotes",
    type: "FEMININ" as const,
    name: "Découverte métiers de la tech",
    status: "publie" as const,
    address: "1 rue de la Paix, 75002 Paris",
    date: new Date("2026-06-12T14:00:00Z"),
    capacity: 20,
    description: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({} as never);
  mockCreateToken.mockReturnValue("mock-token-abc");
});

const makeRequest = () =>
  new Request("http://localhost:3000/api/cron/feedback", {
    headers: { Authorization: "Bearer dev-cron-secret" },
  });

describe("GET /api/cron/feedback", () => {
  it("creates tokens, updates enrollment, and sends emails when presente enrollments exist", async () => {
    const enrollments = [makeEnrollment("e-1"), makeEnrollment("e-2")];
    mockFindMany.mockResolvedValue(enrollments as never);

    const response = await GET(makeRequest() as never);
    const json = await response.json();

    expect(json).toEqual({ ok: true, sent: 2 });
    expect(mockCreateToken).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "e-1" },
        data: expect.objectContaining({
          feedbackToken: "mock-token-abc",
          feedbackSentAt: expect.any(Date),
        }),
      }),
    );
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it("returns { sent: 0 } and sends no emails when no presente enrollments", async () => {
    mockFindMany.mockResolvedValue([] as never);

    const response = await GET(makeRequest() as never);
    const json = await response.json();

    expect(json).toEqual({ ok: true, sent: 0 });
    expect(mockCreateToken).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
