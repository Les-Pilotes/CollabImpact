import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron";

/**
 * Feedback invites are sent MANUALLY by an admin (server action
 * `sendFeedbackInvite` on the inscrites page), never automatically — decision
 * produit : on contrôle l'envoi des feedbacks à la main.
 *
 * This cron is intentionally a no-op so any existing Vercel schedule does
 * nothing. Re-enabling automatic sending should go through a per-event toggle
 * (cf. issue #42) rather than restoring this bulk send.
 */
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({ ok: true, sent: 0, disabled: true });
}
