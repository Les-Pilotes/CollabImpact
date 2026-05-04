import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyFeedbackToken } from "@/lib/tokens";
import { feedbackSchema } from "@/lib/validation/feedback";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const verification = verifyFeedbackToken(token);
  if (!verification.valid) {
    return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
  }

  const { enrollmentId } = verification;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { feedback: true },
  });

  if (!enrollment || enrollment.status !== "presente") {
    return NextResponse.json({ error: "Inscription introuvable ou non éligible" }, { status: 404 });
  }

  if (enrollment.feedback) {
    return NextResponse.json({ error: "Feedback déjà soumis" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await prisma.feedback.create({
    data: {
      enrollmentId,
      ...parsed.data,
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "feedback_recu" },
  });

  return NextResponse.json({ ok: true });
}
