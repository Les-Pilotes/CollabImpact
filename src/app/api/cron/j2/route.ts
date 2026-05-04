import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import J2Reminder from "@/lib/email/templates/J2Reminder";

const EVENT_ID = "seed-event-cite-audacieuse";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: EVENT_ID,
      status: { in: ["inscrit", "contactee", "confirmee_j7"] },
      j2SentAt: null,
      deletedAt: null,
    },
    include: {
      user: true,
      immersion: true,
    },
  });

  let sent = 0;
  for (const enrollment of enrollments) {
    const dateLabel = enrollment.immersion.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendEmail({
      to: enrollment.user.email,
      subject: `Dernière confirmation — J-2`,
      react: React.createElement(J2Reminder, {
        firstName: enrollment.user.firstName,
        immersionName: enrollment.immersion.name,
        dateLabel,
        address: enrollment.immersion.address,
        confirmUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/inscription/confirm`,
      }),
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { j2SentAt: new Date() },
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
