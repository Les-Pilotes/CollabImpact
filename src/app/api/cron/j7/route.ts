import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import J7Reminder from "@/lib/email/templates/J7Reminder";

const EVENT_ID = "seed-event-cite-audacieuse";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: EVENT_ID,
      status: { in: ["inscrit", "contactee"] },
      j7SentAt: null,
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
      subject: `Confirme ta venue — J-7`,
      react: React.createElement(J7Reminder, {
        firstName: enrollment.user.firstName,
        immersionName: enrollment.immersion.name,
        companyName: enrollment.immersion.address,
        dateLabel,
        confirmUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/inscription/confirm`,
      }),
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { j7SentAt: new Date() },
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
