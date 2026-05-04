import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { createFeedbackToken } from "@/lib/tokens";
import FeedbackInvite from "@/lib/email/templates/FeedbackInvite";

const EVENT_ID = "seed-event-cite-audacieuse";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: EVENT_ID,
      status: "presente",
      OR: [{ feedbackToken: null }, { feedbackSentAt: null }],
      deletedAt: null,
    },
    include: {
      user: true,
      immersion: true,
    },
  });

  let sent = 0;
  for (const enrollment of enrollments) {
    const token = createFeedbackToken(enrollment.id);
    const feedbackUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/feedback/${token}`;

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { feedbackToken: token, feedbackSentAt: new Date() },
    });

    await sendEmail({
      to: enrollment.user.email,
      subject: `Ton avis sur ${enrollment.immersion.name}`,
      react: React.createElement(FeedbackInvite, {
        firstName: enrollment.user.firstName,
        immersionName: enrollment.immersion.name,
        feedbackUrl,
      }),
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
