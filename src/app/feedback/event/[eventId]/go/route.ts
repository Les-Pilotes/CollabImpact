import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createFeedbackToken } from "@/lib/tokens";
import { getAppUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const base = `${getAppUrl()}/feedback/event/${eventId}`;

  if (!email) {
    return NextResponse.redirect(`${base}?error=not_found`);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      eventId,
      deletedAt: null,
      user: { email: { equals: email, mode: "insensitive" } },
    },
    select: { id: true, feedbackToken: true, feedback: { select: { id: true } } },
  });

  if (!enrollment) {
    return NextResponse.redirect(`${base}?error=not_found`);
  }

  if (enrollment.feedback) {
    return NextResponse.redirect(`${base}?error=already_done`);
  }

  // Mint (or refresh) the token and persist it
  const token = createFeedbackToken(enrollment.id);
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { feedbackToken: token },
  });

  return NextResponse.redirect(`${getAppUrl()}/feedback/${token}`);
}
