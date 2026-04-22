import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { createFeedbackToken } from "@/lib/tokens";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Runs daily (J+1). For each enrollment where immersion was yesterday + status=present,
// generate a feedback token and send the invitation email.
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const windowStart = new Date(yesterday);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(yesterday);
  windowEnd.setHours(23, 59, 59, 999);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      deletedAt: null,
      status: "present",
      feedbackSentAt: null,
      immersion: {
        date: { gte: windowStart, lte: windowEnd },
      },
      feedback: null,
    },
    include: { user: true, immersion: true },
  });

  let sent = 0;
  for (const e of enrollments) {
    try {
      const token = createFeedbackToken(e.id);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.les-pilotes.fr";
      const feedbackUrl = `${appUrl}/feedback/${token}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: e.user.email,
        replyTo: process.env.EMAIL_REPLY_TO,
        subject: `Comment s'est passée ton immersion ${e.immersion.companyName} ? 🌟`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${e.user.firstName ?? ""} 🌟</h2>
            <p>
              Ton immersion chez <strong>${e.immersion.companyName}</strong> vient
              de se terminer. Merci d'avoir participé !
            </p>
            <p>
              Tes retours nous aident à améliorer les prochaines immersions pour
              tous les jeunes. Ça ne prend que 2 minutes ⏱️
            </p>
            <a href="${feedbackUrl}" style="display:inline-block;background:linear-gradient(135deg,#ffe959,#ff914d);color:#111;font-weight:bold;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:8px;">
              Donner mon feedback
            </a>
            <p style="margin-top:16px;color:#888;font-size:12px;">
              Ce lien est valable 30 jours.
            </p>
            <p style="color:#888;font-size:12px;">
              À bientôt,<br/>L'équipe Les Pilotes
            </p>
          </div>
        `,
      });

      await prisma.enrollment.update({
        where: { id: e.id },
        data: {
          feedbackToken: token,
          feedbackSentAt: now,
        },
      });
      sent++;
    } catch (err) {
      console.error(`[cron/feedback] Failed for enrollment ${e.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, job: "feedback", handled: enrollments.length, sent });
}
