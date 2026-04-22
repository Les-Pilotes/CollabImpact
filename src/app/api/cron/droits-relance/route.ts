import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Runs daily. Sends image rights reminder to enrolled users who haven't signed,
// whose immersion is in 2 days, and who haven't been reminded yet.
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const twoDaysFrom = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const windowStart = new Date(twoDaysFrom);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(twoDaysFrom);
  windowEnd.setHours(23, 59, 59, 999);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      deletedAt: null,
      imageRightsSignedAt: null,
      imageRightsReminderAt: null,
      status: { notIn: ["desistement", "absent"] },
      immersion: {
        date: { gte: windowStart, lte: windowEnd },
      },
    },
    include: { user: true, immersion: true },
  });

  let sent = 0;
  for (const e of enrollments) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.les-pilotes.fr";
      const droitsUrl = `${appUrl}/me/droits/${e.id}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: e.user.email,
        replyTo: process.env.EMAIL_REPLY_TO,
        subject: `Action requise — Signe tes droits à l'image avant l'immersion`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${e.user.firstName ?? ""} 👋</h2>
            <p>
              Ton immersion chez <strong>${e.immersion.companyName}</strong> est dans 2 jours.
            </p>
            <p>
              Il te reste une action à faire : <strong>signer les droits à l'image</strong>.
              C'est rapide (30 secondes) et ça nous permet de partager les photos et vidéos
              de la journée.
            </p>
            <a href="${droitsUrl}" style="display:inline-block;background:linear-gradient(135deg,#ffe959,#ff914d);color:#111;font-weight:bold;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:8px;">
              Signer mes droits à l'image
            </a>
            <p style="margin-top:24px;color:#888;font-size:12px;">
              À très bientôt,<br/>L'équipe Les Pilotes
            </p>
          </div>
        `,
      });

      await prisma.enrollment.update({
        where: { id: e.id },
        data: { imageRightsReminderAt: now },
      });
      sent++;
    } catch (err) {
      console.error(`[cron/droits-relance] Failed for enrollment ${e.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, job: "droits-relance", handled: enrollments.length, sent });
}
