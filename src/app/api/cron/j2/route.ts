import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { deliver } from "@/lib/messaging/deliver";
import { createActionToken } from "@/lib/tokens";
import { getAppUrl } from "@/lib/app-url";
import { resolveEmail } from "@/lib/email/resolve";
import { parallelLimit } from "@/lib/concurrency";
import { isInReminderWindow } from "@/lib/enrollment/eligibility";
import J2Reminder from "@/lib/email/templates/J2Reminder";

const CONCURRENCY = 8;

// "J-2" means 1 to 2 calendar days before the event in Europe/Paris. See
// src/lib/datetime.ts:parisCalendarDaysUntil and the J-7 cron for why a raw
// millisecond range drifts (J-3 instead of J-2 depending on event time/DST).
const MIN_DAYS = 1;
const MAX_DAYS = 2;

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const minDate = new Date(now.getTime() + (MIN_DAYS - 1) * 86400000);
  const maxDate = new Date(now.getTime() + (MAX_DAYS + 1) * 86400000);

  const candidates = await prisma.enrollment.findMany({
    where: {
      event: {
        date: { gte: minDate, lte: maxDate },
        deletedAt: null,
        status: { in: ["publie", "complet", "en_cours"] },
      },
      status: { in: ["inscrit", "contactee", "confirmee_j7"] },
      j2SentAt: null,
      deletedAt: null,
    },
    include: { user: true, event: { include: { emailConfig: true } } },
  });

  const enrollments = candidates.filter((e) => isInReminderWindow(e.event.date, MIN_DAYS, MAX_DAYS, now));

  const appUrl = getAppUrl();

  const results = await parallelLimit(enrollments, CONCURRENCY, async (enrollment) => {
    const dateLabel = enrollment.event.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
    const timeLabel = enrollment.event.date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
    const confirmToken = createActionToken(enrollment.id, "confirm");
    const declineToken = createActionToken(enrollment.id, "decline");
    const isMinor = enrollment.user.birthDate
      ? (enrollment.event.date.getTime() - enrollment.user.birthDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365.25) <
        18
      : false;

    const resolved = resolveEmail("j2", enrollment.event.emailConfig, {
      prenom: enrollment.user.firstName,
      event: enrollment.event.name,
      date: dateLabel,
      horaire: timeLabel,
      lieu: enrollment.event.address,
    });

    const result = await deliver({
      kind: "j2_reminder",
      organisationId: enrollment.organisationId,
      eventId: enrollment.eventId,
      enrollmentId: enrollment.id,
      to: enrollment.user.email,
      subject: resolved.subject,
      replyTo: enrollment.event.replyToEmail ?? undefined,
      react: React.createElement(J2Reminder, {
        heading: resolved.heading,
        body: resolved.body,
        immersionName: enrollment.event.name,
        confirmUrl: `${appUrl}/confirm/${confirmToken}`,
        declineUrl: `${appUrl}/decline/${declineToken}`,
        isMinor,
        customNote: resolved.note ?? undefined,
        signature: enrollment.event.emailSignature ?? undefined,
      }),
    });
    if (!result.sent) {
      throw new Error(`email failed: ${result.reason}`);
    }
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { j2SentAt: new Date() },
    });
  });

  let sent = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") sent++;
    else console.error(`[cron/j2] failed for enrollment ${enrollments[i].id}:`, r.reason);
  });

  return NextResponse.json({ ok: true, sent });
}
