import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyFeedbackToken } from "@/lib/tokens";
import { feedbackSchema } from "@/lib/validation/feedback";
import { emitNotification } from "@/lib/notifications/emit";
import { ALL_FEEDBACK_KEYS } from "@/lib/feedback/questions";

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
    include: {
      feedback: true,
      user: { select: { firstName: true, lastName: true } },
      event: { select: { id: true, name: true } },
    },
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

  // Keep only known question keys (defends against arbitrary keys).
  const answers: Record<string, string | string[]> = {};
  for (const key of ALL_FEEDBACK_KEYS) {
    if (key in parsed.data.answers) answers[key] = parsed.data.answers[key];
  }

  // Derive the legacy v1 columns from the v2 answers, where there's a natural
  // mapping, so the existing Impact dashboard / FeedbackCard keep working. The
  // full questionnaire lives in `answers`.
  const str = (k: string): string | null =>
    typeof answers[k] === "string" && (answers[k] as string).trim() ? (answers[k] as string) : null;
  const noteAnimation = str("noteAnimation");
  const overallRating =
    noteAnimation && /^[1-5]$/.test(noteAnimation) ? Number(noteAnimation) : null;
  const rencontresAide = str("rencontresAide");
  const changedVision =
    rencontresAide === "Oui" ? true : rencontresAide === "Non" ? false : null;

  await prisma.feedback.create({
    data: {
      enrollmentId,
      answers,
      overallRating,
      orgRating: null,
      changedVision,
      favoriteMoment: str("momentPrefere"),
      improvements: str("ameliorations"),
      verbatim: str("motDeLaFin"),
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "feedback_recu" },
  });

  void emitNotification({
    organisationId: enrollment.organisationId,
    type: "feedback.received",
    title: `${enrollment.user.firstName} ${enrollment.user.lastName} a laissé un feedback sur ${enrollment.event.name}`,
    body:
      overallRating != null
        ? `Note animation : ${overallRating}/5 · ${Object.keys(answers).length} réponses`
        : `${Object.keys(answers).length} réponses`,
    eventId: enrollment.event.id,
    enrollmentId,
    metadata: { overallRating, answerCount: Object.keys(answers).length },
  });

  return NextResponse.json({ ok: true });
}
