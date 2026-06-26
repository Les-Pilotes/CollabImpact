import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    enrollment: { findUnique: vi.fn(), update: vi.fn() },
    feedback: { create: vi.fn() },
  },
}));

vi.mock("@/lib/tokens", () => ({
  verifyFeedbackToken: vi.fn(),
}));

vi.mock("@/lib/notifications/emit", () => ({
  emitNotification: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { verifyFeedbackToken } from "@/lib/tokens";
import { emitNotification } from "@/lib/notifications/emit";
import { POST } from "@/app/api/feedback/[token]/route";

const en = vi.mocked(prisma.enrollment);
const fb = vi.mocked(prisma.feedback);
const verify = vi.mocked(verifyFeedbackToken);
const emit = vi.mocked(emitNotification);

function makeRequest(body: unknown): Request {
  return new Request("https://x/api/feedback/t", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  answers: {
    noteAnimation: "5",
    rencontresAide: "Oui",
    momentPrefere: "Réseautage de fin",
    ameliorations: "",
    motDeLaFin: "Top",
  },
};

beforeEach(() => vi.clearAllMocks());

describe("POST /api/feedback/[token] — notification trigger", () => {
  it("emits feedback.received with rating summary after a valid submission", async () => {
    verify.mockReturnValue({ valid: true, enrollmentId: "en-1" } as never);
    en.findUnique.mockResolvedValue({
      id: "en-1",
      organisationId: "org-1",
      status: "presente",
      feedback: null,
      user: { firstName: "Lisa", lastName: "Martin" },
      event: { id: "ev-1", name: "Workshop 7" },
    } as never);
    fb.create.mockResolvedValue({} as never);
    en.update.mockResolvedValue({} as never);

    const res = await POST(makeRequest(validBody) as never, {
      params: Promise.resolve({ token: "t" }),
    });

    expect(res.status).toBe(200);
    expect(emit).toHaveBeenCalledOnce();
    expect(emit.mock.calls[0][0]).toMatchObject({
      organisationId: "org-1",
      type: "feedback.received",
      eventId: "ev-1",
      enrollmentId: "en-1",
      metadata: { overallRating: 5 },
    });
    expect(emit.mock.calls[0][0].title).toContain("Lisa Martin");
    expect(emit.mock.calls[0][0].title).toContain("Workshop 7");
    expect(emit.mock.calls[0][0].body).toContain("5/5");

    // The v2 questionnaire is persisted under `answers`, with the legacy
    // overallRating derived from the animation score.
    expect(fb.create).toHaveBeenCalledOnce();
    expect(fb.create.mock.calls[0][0].data).toMatchObject({
      enrollmentId: "en-1",
      overallRating: 5,
      changedVision: true,
    });
    expect(fb.create.mock.calls[0][0].data.answers).toMatchObject({
      noteAnimation: "5",
      motDeLaFin: "Top",
    });
  });

  it("does NOT emit when the token is invalid", async () => {
    verify.mockReturnValue({ valid: false, reason: "expired" } as never);

    const res = await POST(makeRequest(validBody) as never, {
      params: Promise.resolve({ token: "t" }),
    });

    expect(res.status).toBe(401);
    expect(emit).not.toHaveBeenCalled();
    expect(fb.create).not.toHaveBeenCalled();
  });

  it("does NOT emit when a feedback has already been submitted", async () => {
    verify.mockReturnValue({ valid: true, enrollmentId: "en-1" } as never);
    en.findUnique.mockResolvedValue({
      id: "en-1",
      organisationId: "org-1",
      status: "presente",
      feedback: { id: "fb-1" },
      user: { firstName: "Lisa", lastName: "Martin" },
      event: { id: "ev-1", name: "Workshop 7" },
    } as never);

    const res = await POST(makeRequest(validBody) as never, {
      params: Promise.resolve({ token: "t" }),
    });

    expect(res.status).toBe(409);
    expect(emit).not.toHaveBeenCalled();
  });
});
