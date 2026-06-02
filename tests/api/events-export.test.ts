import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    enrollment: { findMany: vi.fn() },
  },
}));

import { GET } from "@/app/api/events/[eventId]/export/route";
import { prisma } from "@/lib/db";
import { makeEnrollment, makeUser, makeEvent } from "../factories";

const mockEvent = vi.mocked(prisma.event.findUnique);
const mockEnrollments = vi.mocked(prisma.enrollment.findMany);

function context(eventId: string) {
  return { params: Promise.resolve({ eventId }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({
    admin: { id: "a1", organisationId: "org-1", role: "SUPER_ADMIN" },
    user: { email: "amadou@les-pilotes.fr" },
  });
});

describe("GET /api/events/[eventId]/export", () => {
  it("returns 404 when the event does not exist", async () => {
    mockEvent.mockResolvedValue(null as never);

    const response = await GET(new Request("http://test"), context("missing"));

    expect(response.status).toBe(404);
    expect(mockEnrollments).not.toHaveBeenCalled();
  });

  it("returns a CSV with the expected header row and attachment headers", async () => {
    mockEvent.mockResolvedValue(
      makeEvent({ name: "Atelier Tech & Sciences", date: new Date("2026-06-15") }) as never,
    );
    mockEnrollments.mockResolvedValue([] as never);

    const response = await GET(new Request("http://test"), context("e-1"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const disposition = response.headers.get("Content-Disposition") ?? "";
    expect(disposition).toContain("attachment");
    expect(disposition).toContain("atelier-tech-sciences");

    const body = await response.text();
    const [header] = body.split("\n");
    expect(header).toContain("Prénom");
    expect(header).toContain("Email");
    expect(header).toContain("Statut inscription");
    expect(header).toContain("Score fiabilité");
  });

  it("escapes embedded quotes/separators in user fields", async () => {
    mockEvent.mockResolvedValue(makeEvent() as never);
    const user = makeUser({
      firstName: 'Eve "the great"',
      lastName: "O'Doe",
      city: "Paris, 75001",
      motivation: ["a", "b"],
    });
    mockEnrollments.mockResolvedValue([
      makeEnrollment({ user, status: "presente", attendedAt: new Date() }),
    ] as never);

    const response = await GET(new Request("http://test"), context("e-1"));
    const body = await response.text();

    // CSV double-quote escape : `"` → `""`, wrapped if contains special char
    expect(body).toContain('"Eve ""the great"""');
    expect(body).toContain('"Paris, 75001"');
    expect(body).toContain("a | b");
  });

  it("propagates the requireAdmin gate (no admin → redirect throws)", async () => {
    requireAdminMock.mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT;replace;/admin/login;307;");
    });

    await expect(
      GET(new Request("http://test"), context("e-1")),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(mockEvent).not.toHaveBeenCalled();
    expect(mockEnrollments).not.toHaveBeenCalled();
  });
});
