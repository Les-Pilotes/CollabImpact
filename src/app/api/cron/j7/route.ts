import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Runs daily. Sends J-7 reminder to enrolled users whose immersion is in ~7 days.
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const sevenDaysFrom = new Date(now);
  sevenDaysFrom.setDate(sevenDaysFrom.getDate() + 7);

  // Window: immersion between 6.5 and 7.5 days from now
  const windowStart = new Date(sevenDaysFrom.getTime() - 12 * 60 * 60 * 1000);
  const windowEnd = new Date(sevenDaysFrom.getTime() + 12 * 60 * 60 * 1000);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      deletedAt: null,
      status: { in: ["inscrit", "contacte"] },
      immersion: {
        date: { gte: windowStart, lte: windowEnd },
        status: { in: ["publie", "complet", "en_cours"] },
      },
    },
    include: {
      user: true,
      immersion: true,
    },
  });

  let sent = 0;
  for (const e of enrollments) {
    try {
      const immDate = new Date(e.immersion.date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const immTime = new Date(e.immersion.date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.les-pilotes.fr";

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: e.user.email,
        replyTo: process.env.EMAIL_REPLY_TO,
        subject: `Rappel — Immersion ${e.immersion.companyName} dans 7 jours`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${e.user.firstName ?? ""} 👋</h2>
            <p>
              Ton immersion chez <strong>${e.immersion.companyName}</strong> approche !
              Elle a lieu dans <strong>7 jours</strong>.
            </p>
            <p>
              📅 <strong>${immDate}</strong> à <strong>${immTime}</strong><br/>
              📍 <strong>${e.immersion.companyAddress}, ${e.immersion.companyCity}</strong>
            </p>
            <p>
              Pense à confirmer ta présence sur ton espace Les Pilotes.
            </p>
            <a href="${appUrl}/me" style="display:inline-block;background:linear-gradient(135deg,#ffe959,#ff914d);color:#111;font-weight:bold;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:8px;">
              Confirmer ma présence
            </a>
            <p style="margin-top:24px;color:#888;font-size:12px;">
              À très bientôt,<br/>L'équipe Les Pilotes
            </p>
          </div>
        `,
      });

      await prisma.enrollment.update({
        where: { id: e.id },
        data: { status: "confirme_j7" },
      });
      sent++;
    } catch (err) {
      console.error(`[cron/j7] Failed for enrollment ${e.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, job: "j7", handled: enrollments.length, sent });
}
