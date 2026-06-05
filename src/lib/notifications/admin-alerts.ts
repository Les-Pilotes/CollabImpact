import React from "react";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { getAppUrl } from "@/lib/app-url";
import AdminEnrollmentAlert from "@/lib/email/templates/AdminEnrollmentAlert";
import { parseNotificationConfig } from "./config";

type EnrollmentAlertInput = {
  eventId: string;
  enrollmentId: string;
  organisationId: string;
};

/**
 * Sends an "Nouvelle inscription" email to every admin selected in the event's
 * notificationConfig — provided they have validated their access
 * (lastLoginAt !== null). Best-effort: any failure is logged, never thrown,
 * so the inscription flow that called us never breaks because of an alert.
 *
 * Should be invoked AFTER the enrollment row has been committed, so the count
 * we display in the email is accurate.
 */
export async function dispatchEnrollmentAlerts(
  input: EnrollmentAlertInput,
): Promise<void> {
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: input.eventId,
        organisationId: input.organisationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        notificationConfig: true,
      },
    });
    if (!event) return;

    const cfg = parseNotificationConfig(event.notificationConfig);
    if (!cfg.newEnrollmentEnabled) return;
    if (cfg.recipientAdminIds.length === 0) return;

    const recipients = await prisma.admin.findMany({
      where: {
        id: { in: cfg.recipientAdminIds },
        organisationId: input.organisationId,
        lastLoginAt: { not: null },
      },
      select: { email: true },
    });
    if (recipients.length === 0) return;

    const [enrollment, enrolledCount] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { id: input.enrollmentId },
        select: {
          id: true,
          userId: true,
          user: {
            select: { firstName: true, lastName: true, email: true, city: true },
          },
        },
      }),
      prisma.enrollment.count({
        where: { eventId: input.eventId, deletedAt: null },
      }),
    ]);
    if (!enrollment) return;

    const appUrl = getAppUrl();
    const participantUrl = `${appUrl}/admin/personnes/${enrollment.userId}`;

    const subject = `Nouvelle inscription · ${enrollment.user.firstName} ${enrollment.user.lastName} → ${event.name}`;

    await sendEmail({
      to: recipients.map((r) => r.email),
      subject,
      react: React.createElement(AdminEnrollmentAlert, {
        eventName: event.name,
        participantFirstName: enrollment.user.firstName,
        participantLastName: enrollment.user.lastName,
        participantCity: enrollment.user.city,
        participantEmail: enrollment.user.email,
        enrolledCount,
        capacity: event.capacity,
        participantUrl,
      }),
    });
  } catch (err) {
    console.error("[admin-alerts] dispatch failed:", err);
  }
}
