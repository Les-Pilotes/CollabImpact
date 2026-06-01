import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { getAppUrl } from "@/lib/app-url";
import DroitsRelance from "@/lib/email/templates/DroitsRelance";

// Relance les mineurs dont le statut droits image est toujours pending 3 jours
// après l'inscription. La fenêtre 3-4 jours garantit qu'on n'envoie qu'une seule
// relance par participante (cron quotidien × fenêtre 24 h).
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const windowStart = new Date(now.getTime() - 4 * 86400000);
  const windowEnd = new Date(now.getTime() - 3 * 86400000);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      droitsImageStatus: "minor_parental_pending",
      enrolledAt: { gte: windowStart, lte: windowEnd },
      event: { date: { gt: now }, deletedAt: null },
      deletedAt: null,
    },
    include: {
      user: true,
      event: true,
    },
  });

  const pdfUrl = `${getAppUrl()}/legal/adhesion-mineur.pdf`;
  let sent = 0;

  for (const enrollment of enrollments) {
    const eventDateLabel = enrollment.event.date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    try {
      await sendEmail({
        to: enrollment.user.email,
        subject: `Rappel : autorisation parentale pour ${enrollment.event.name}`,
        replyTo: enrollment.event.replyToEmail ?? undefined,
        react: React.createElement(DroitsRelance, {
          prenom: enrollment.user.firstName,
          eventName: enrollment.event.name,
          eventDate: eventDateLabel,
          pdfUrl,
          signature: enrollment.event.emailSignature ?? undefined,
        }),
      });
      sent++;
    } catch (err) {
      console.error(`[cron/droits-relance] failed for enrollment ${enrollment.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
