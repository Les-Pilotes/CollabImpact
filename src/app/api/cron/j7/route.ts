import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { createActionToken } from "@/lib/tokens";
import J7Reminder from "@/lib/email/templates/J7Reminder";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  // J-7 window: events occurring in [+5d, +9d] from now
  const now = new Date();
  const minDate = new Date(now.getTime() + 5 * 86400000);
  const maxDate = new Date(now.getTime() + 9 * 86400000);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      event: {
        date: { gte: minDate, lte: maxDate },
        deletedAt: null,
      },
      status: { in: ["inscrit", "contactee"] },
      j7SentAt: null,
      deletedAt: null,
    },
    include: { user: true, event: true },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  let sent = 0;

  for (const enrollment of enrollments) {
    const dateLabel = enrollment.event.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const confirmToken = createActionToken(enrollment.id, "confirm");
    const declineToken = createActionToken(enrollment.id, "decline");
    const isMinor = enrollment.user.birthDate
      ? (enrollment.event.date.getTime() - enrollment.user.birthDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365.25) <
        18
      : false;

    try {
      await sendEmail({
        to: enrollment.user.email,
        subject: `Confirme ta venue — ${enrollment.event.name}`,
        react: React.createElement(J7Reminder, {
          firstName: enrollment.user.firstName,
          immersionName: enrollment.event.name,
          companyName: enrollment.event.address,
          dateLabel,
          confirmUrl: `${appUrl}/confirm/${confirmToken}`,
          declineUrl: `${appUrl}/decline/${declineToken}`,
          isMinor,
        }),
      });
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { j7SentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`[cron/j7] failed for enrollment ${enrollment.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
