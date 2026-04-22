import { NextRequest, NextResponse } from "next/server";
import { verifyFeedbackToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const result = verifyFeedbackToken(token);
  if (!result.valid) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: result.enrollmentId, feedbackToken: token },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already submitted
  const existing = await prisma.feedback.findUnique({
    where: { enrollmentId: enrollment.id },
  });
  if (existing) {
    return NextResponse.json({ message: "Already submitted" });
  }

  const body = await req.json();
  const {
    overallRating,
    organizationRating,
    favoriteMoment,
    changedVision,
    wouldContinue,
    improvements,
    verbatim,
  } = body;

  if (!overallRating || overallRating < 1 || overallRating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  await prisma.feedback.create({
    data: {
      enrollmentId: enrollment.id,
      overallRating,
      organizationRating: organizationRating ?? 0,
      favoriteMoment: favoriteMoment || undefined,
      changedVision: !!changedVision,
      wouldContinue: !!wouldContinue,
      improvements: improvements || undefined,
      verbatim: verbatim || undefined,
    },
  });

  return NextResponse.json({ success: true });
}
