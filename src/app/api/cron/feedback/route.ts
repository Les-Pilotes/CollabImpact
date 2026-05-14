import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { createFeedbackToken } from "@/lib/tokens";
import { getAppUrl } from "@/lib/app-url";
import { resolveEmail } from "@/lib/email/resolve";
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

    const dateLabel = enrollment.event.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeLabel = enrollment.event.date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const resolved = resolveEmail("feedback", enrollment.event.emailConfig, {
      prenom: enrollment.user.firstName,
      event: enrollment.event.name,
      date: dateLabel,
      horaire: timeLabel,
      lieu: enrollment.event.address,
    });

    await sendEmail({
      to: enrollment.user.email,
      subject: resolved.subject,
      replyTo: enrollment.event.replyToEmail ?? undefined,
      react: React.createElement(FeedbackInvite, {
        heading: resolved.heading,
        body: resolved.body,
        immersionName: enrollment.event.name,
        feedbackUrl,
        customNote: resolved.note ?? undefined,
        signature: enrollment.event.emailSignature ?? undefined,
      }),
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
