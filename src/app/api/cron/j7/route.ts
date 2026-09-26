import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { createActionToken } from "@/lib/tokens";
import { getAppUrl } from "@/lib/app-url";
import { resolveEmail } from "@/lib/email/resolve";
import { parallelLimit } from "@/lib/concurrency";
import { isInReminderWindow } from "@/lib/enrollment/eligibility";
import J7Reminder from "@/lib/email/templates/J7Reminder";

const CONCURRENCY = 8;

// "J-7" means 3 to 7 calendar days before the event in Europe/Paris — a
// 5-day-wide net so the daily cron always catches it exactly once
// (idempotency comes from j7SentAt, not from this window). A raw millisecond
// range here would drift to J-8/J-9 depending on the event's time-of-day and
// the season — see src/lib/datetime.ts:parisCalendarDaysUntil.
const MIN_DAYS = 3;
const MAX_DAYS = 7;

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  // Coarse DB-level net (in real elapsed time) just wide enough to contain
  // the calendar-day window above under any DST offset; the exact filter
  // below is what actually decides eligibility.
  const minDate = new Date(now.getTime() + (MIN_DAYS - 1) * 86400000);
  const maxDate = new Date(now.getTime() + (MAX_DAYS + 1) * 86400000);

  const candidates = await prisma.enrollment.findMany({
    where: {
      event: {
        date: { gte: minDate, lte: maxDate },
        deletedAt: null,
        status: { in: ["publie", "complet", "en_cours"] },
      },
      status: { in: ["inscrit", "contactee"] },
      j7SentAt: null,
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

    const resolved = resolveEmail("j7", enrollment.event.emailConfig, {
      prenom: enrollment.user.firstName,
      event: enrollment.event.name,
      date: dateLabel,
      horaire: timeLabel,
      lieu: enrollment.event.address,
    });

    const result = await sendEmail({
      to: enrollment.user.email,
      subject: resolved.subject,
      replyTo: enrollment.event.replyToEmail ?? undefined,
      react: React.createElement(J7Reminder, {
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
      data: { j7SentAt: new Date() },
    });
  });

  let sent = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") sent++;
    else console.error(`[cron/j7] failed for enrollment ${enrollments[i].id}:`, r.reason);
  });

  return NextResponse.json({ ok: true, sent });
}
