import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — factories must be self-contained (no external vars)
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { upsert: vi.fn() },
    enrollment: { upsert: vi.fn() },
  },
  currentOrgId: () => "seed-org-lespilotes",
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: false, reason: "no-api-key" }),
}));

vi.mock("@/lib/email/templates/InscriptionConfirmation", () => ({
  default: () => null,
}));

// Import AFTER mocks
import { POST } from "@/app/api/inscriptions/route";
import { prisma } from "@/lib/db";

const userUpsert = vi.mocked(prisma.user.upsert);
const enrollmentUpsert = vi.mocked(prisma.enrollment.upsert);

const validBody = {
  firstName: "Yasmine",
  lastName: "Benali",
  email: "yasmine@test.fr",
  phone: "0612345678",
  city: "Paris",
  birthDate: "2000-03-15",
  source: "instagram",
};

beforeEach(() => {
  vi.clearAllMocks();
  userUpsert.mockResolvedValue({
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
  });
  enrollmentUpsert.mockResolvedValue({
    id: "enroll-1",
    userId: "user-1",
    immersionId: "seed-event-cite-audacieuse",
    organisationId: "seed-org-lespilotes",
    status: "inscrit" as const,
    mode: "individuel" as const,
    referentName: null,
    source: null,
    attendedAt: null,
    noShow: false,
    j7SentAt: null,
    j2SentAt: null,
    feedbackToken: null,
    feedbackSentAt: null,
    deletedAt: null,
    enrolledAt: new Date(),
    updatedAt: new Date(),
  });
});

describe("POST /api/inscriptions", () => {
  it("returns 200 with ok: true for a valid body", async () => {
    const request = new Request("http://localhost:3000/api/inscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.userId).toBe("user-1");
    expect(json.enrollmentId).toBe("enroll-1");
    expect(userUpsert).toHaveBeenCalledOnce();
    expect(enrollmentUpsert).toHaveBeenCalledOnce();
  });

  it("returns 400 with field errors for an invalid email", async () => {
    const request = new Request("http://localhost:3000/api/inscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, email: "not-an-email" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(json.fields?.email).toBeDefined();
    expect(userUpsert).not.toHaveBeenCalled();
  });

  it("returns 400 when firstName is missing", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { firstName: _firstName, ...bodyWithoutFirstName } = validBody;

    const request = new Request("http://localhost:3000/api/inscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyWithoutFirstName),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(json.fields?.firstName).toBeDefined();
    expect(userUpsert).not.toHaveBeenCalled();
  });
});
