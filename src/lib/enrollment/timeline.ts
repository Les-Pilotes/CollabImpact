import { prisma } from "@/lib/db";
import type { EnrollmentEventType, Prisma } from "@prisma/client";

/**
 * Appends a row to an enrollment's real history. Never throws — a failed
 * write here must never break the flow that triggered it (inscription,
 * status change, email send...); it only means the timeline is momentarily
 * incomplete.
 */
export async function logEnrollmentEvent(input: {
  enrollmentId: string;
  type: EnrollmentEventType;
  label: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.enrollmentEvent.create({
      data: {
        enrollmentId: input.enrollmentId,
        type: input.type,
        label: input.label,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error("[logEnrollmentEvent] failed:", err);
  }
}
