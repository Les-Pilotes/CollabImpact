import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    emailLog: { create: vi.fn().mockResolvedValue({}) },
    enrollmentEvent: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { deliver } from "@/lib/messaging/deliver";

const mockCreateLog = vi.mocked(prisma.emailLog.create);
const mockCreateEvent = vi.mocked(prisma.enrollmentEvent.create);
const mockSendEmail = vi.mocked(sendEmail);

const baseInput = {
  kind: "j7_reminder" as const,
  organisationId: "org-1",
  eventId: "ev-1",
  enrollmentId: "enr-1",
  to: "test@example.com",
  subject: "Subject",
  react: null as never,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateLog.mockResolvedValue({} as never);
  mockCreateEvent.mockResolvedValue({} as never);
});

describe("deliver", () => {
  it("logs status=sent and returns the send result on success", async () => {
    mockSendEmail.mockResolvedValue({ sent: true, id: "resend-123" });

    const result = await deliver(baseInput);

    expect(result).toEqual({ sent: true, id: "resend-123" });
    expect(mockCreateLog).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organisationId: "org-1",
        kind: "j7_reminder",
        to: "test@example.com",
        status: "sent",
        providerId: "resend-123",
        error: null,
        eventId: "ev-1",
        enrollmentId: "enr-1",
      }),
    });
  });

  it("logs status=failed with the reason and never marks it sent", async () => {
    mockSendEmail.mockResolvedValue({ sent: false, reason: "quota_exceeded" });

    const result = await deliver(baseInput);

    expect(result).toEqual({ sent: false, reason: "quota_exceeded" });
    expect(mockCreateLog).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "failed",
        providerId: null,
        error: "quota_exceeded",
      }),
    });
  });

  it("still returns the real result even if the EmailLog write itself fails", async () => {
    mockSendEmail.mockResolvedValue({ sent: true, id: "resend-1" });
    mockCreateLog.mockRejectedValue(new Error("db blip"));

    const result = await deliver(baseInput);

    expect(result).toEqual({ sent: true, id: "resend-1" });
  });

  it("appends an EnrollmentEvent when enrollmentId is given", async () => {
    mockSendEmail.mockResolvedValue({ sent: true, id: "resend-1" });

    await deliver(baseInput);

    expect(mockCreateEvent).toHaveBeenCalledOnce();
    expect(mockCreateEvent.mock.calls[0][0].data).toMatchObject({
      enrollmentId: "enr-1",
      type: "email_sent",
    });
  });

  it("logs email_failed as the EnrollmentEvent type on failure", async () => {
    mockSendEmail.mockResolvedValue({ sent: false, reason: "invalid_email" });

    await deliver(baseInput);

    expect(mockCreateEvent.mock.calls[0][0].data).toMatchObject({
      type: "email_failed",
    });
  });

  it("does not touch EnrollmentEvent when no enrollmentId is given", async () => {
    mockSendEmail.mockResolvedValue({ sent: true, id: "resend-1" });

    await deliver({ ...baseInput, enrollmentId: undefined });

    expect(mockCreateEvent).not.toHaveBeenCalled();
  });
});
