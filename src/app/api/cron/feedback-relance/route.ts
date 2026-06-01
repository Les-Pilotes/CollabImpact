import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { getAppUrl } from "@/lib/app-url";
import FeedbackInvite from "@/lib/email/templates/FeedbackInvite";

// Relance les participantes qui n'ont pas répondu au questionnaire 3 jours après
// l'envoi initial. La fenêtre 3-4 jours garantit qu'on n'envoie qu'une seule
// relance par participante (cron quotidien × fenêtre 24 h).
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const windowStart = new Date(now.getTime() - 4 * 86400000);
  const windowEnd = new Date(now.getTime() - 3 * 86400000);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      feedbackSentAt: { gte: windowStart, lte: windowEnd },
      feedback: null,
      deletedAt: null,
    },
    include: {
      user: true,
      event: true,
    },
  });

  let sent = 0;
  for (const enrollment of enrollments) {
    if (!enrollment.feedbackToken) continue;

    const feedbackUrl = `${getAppUrl()}/feedback/${enrollment.feedbackToken}`;
    const eventDateLabel = enrollment.event.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    try {
      await sendEmail({
        to: enrollment.user.email,
        subject: `Rappel : ton avis sur ${enrollment.event.name}`,
        replyTo: enrollment.event.replyToEmail ?? undefined,
        react: React.createElement(FeedbackInvite, {
          heading: `Tu n'as pas encore répondu, ${enrollment.user.firstName} !`,
          body: `C'est le dernier rappel pour donner ton avis sur l'immersion "${enrollment.event.name}" du ${eventDateLabel}.\n\n3 minutes suffisent et c'est très utile pour améliorer les prochaines éditions.`,
          immersionName: enrollment.event.name,
          feedbackUrl,
          signature: enrollment.event.emailSignature ?? undefined,
        }),
      });
      sent++;
    } catch (err) {
      console.error(`[cron/feedback-relance] failed for enrollment ${enrollment.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
