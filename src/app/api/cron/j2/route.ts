import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { createActionToken } from "@/lib/tokens";
import { getAppUrl } from "@/lib/app-url";
import J2Reminder from "@/lib/email/templates/J2Reminder";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  // J-2 window: events occurring in [+1d, +3d] from now
  const now = new Date();
  const minDate = new Date(now.getTime() + 1 * 86400000);
  const maxDate = new Date(now.getTime() + 3 * 86400000);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      event: {
        date: { gte: minDate, lte: maxDate },
        deletedAt: null,
      },
      status: { in: ["inscrit", "contactee", "confirmee_j7"] },
      j2SentAt: null,
      deletedAt: null,
    },
    include: { user: true, event: true },
  });

  const appUrl = getAppUrl();
  let sent = 0;

  for (const enrollment of enrollments) {
    const dateLabel = enrollment.event.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        subject: `Dernière confirmation — ${enrollment.event.name}`,
        replyTo: enrollment.event.replyToEmail ?? undefined,
        react: React.createElement(J2Reminder, {
          firstName: enrollment.user.firstName,
          immersionName: enrollment.event.name,
          dateLabel,
          address: enrollment.event.address,
          confirmUrl: `${appUrl}/confirm/${confirmToken}`,
          declineUrl: `${appUrl}/decline/${declineToken}`,
          isMinor,
        }),
      });
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { j2SentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`[cron/j2] failed for enrollment ${enrollment.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
