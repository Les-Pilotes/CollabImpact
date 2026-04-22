import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Runs daily. Relance feedback for enrollments where feedback was sent 7 days ago,
// still no response, and no relance sent yet.
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const windowStart = new Date(sevenDaysAgo);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(sevenDaysAgo);
  windowEnd.setHours(23, 59, 59, 999);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      deletedAt: null,
      feedbackSentAt: { gte: windowStart, lte: windowEnd },
      feedbackReminderAt: null,
      feedback: null,
      feedbackToken: { not: null },
    },
    include: { user: true, immersion: true },
  });

  let sent = 0;
  for (const e of enrollments) {
    if (!e.feedbackToken) continue;
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.les-pilotes.fr";
      const feedbackUrl = `${appUrl}/feedback/${e.feedbackToken}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: e.user.email,
        replyTo: process.env.EMAIL_REPLY_TO,
        subject: `Tu n'as pas encore donné ton avis — Immersion ${e.immersion.companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${e.user.firstName ?? ""} 👋</h2>
            <p>
              On t'avait envoyé un lien pour donner ton avis sur ton immersion chez
              <strong>${e.immersion.companyName}</strong>.
            </p>
            <p>
              On sait que tu es occupé(e) — mais ça ne prend vraiment que 2 minutes.
              Tes retours font une vraie différence ! 🙏
            </p>
            <a href="${feedbackUrl}" style="display:inline-block;background:linear-gradient(135deg,#ffe959,#ff914d);color:#111;font-weight:bold;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:8px;">
              Donner mon feedback maintenant
            </a>
            <p style="margin-top:24px;color:#888;font-size:12px;">
              C'est la seule relance, promis 😊<br/>
              L'équipe Les Pilotes
            </p>
          </div>
        `,
      });

      await prisma.enrollment.update({
        where: { id: e.id },
        data: { feedbackReminderAt: now },
      });
      sent++;
    } catch (err) {
      console.error(`[cron/feedback-relance] Failed for enrollment ${e.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, job: "feedback-relance", handled: enrollments.length, sent });
}
