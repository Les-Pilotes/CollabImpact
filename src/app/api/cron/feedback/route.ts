import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { createFeedbackToken } from "@/lib/tokens";
import { getAppUrl } from "@/lib/app-url";
import FeedbackInvite from "@/lib/email/templates/FeedbackInvite";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      event: { date: { lt: now }, deletedAt: null },
      status: "presente",
      feedbackSentAt: null,
      deletedAt: null,
    },
    include: {
      user: true,
      event: { include: { emailConfig: true } },
    },
  });

  let sent = 0;
  for (const enrollment of enrollments) {
    const token = createFeedbackToken(enrollment.id);
    const feedbackUrl = `${getAppUrl()}/feedback/${token}`;

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { feedbackToken: token, feedbackSentAt: new Date() },
    });

    await sendEmail({
      to: enrollment.user.email,
      subject: `Ton avis sur ${enrollment.event.name}`,
      replyTo: enrollment.event.replyToEmail ?? undefined,
      react: React.createElement(FeedbackInvite, {
        firstName: enrollment.user.firstName,
        immersionName: enrollment.event.name,
        feedbackUrl,
        customNote: enrollment.event.emailConfig?.feedbackNote ?? undefined,
      }),
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
