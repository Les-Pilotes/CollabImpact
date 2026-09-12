import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ALL_SPEAKER_FEEDBACK_KEYS } from "@/lib/feedback/speaker-questions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const speaker = await prisma.speaker.findUnique({
    where: { feedbackToken: token, deletedAt: null },
    select: {
      id: true,
      feedbackSubmittedAt: true,
      organisationId: true,
      firstName: true,
      lastName: true,
      event: { select: { id: true, name: true } },
    },
  });

  if (!speaker) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  if (speaker.feedbackSubmittedAt) {
    return NextResponse.json({ error: "Feedback déjà soumis" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const raw = (body as { answers?: unknown })?.answers;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  // Keep only known question keys
  const answers: Record<string, string | string[]> = {};
  for (const key of ALL_SPEAKER_FEEDBACK_KEYS) {
    const val = (raw as Record<string, unknown>)[key];
    if (typeof val === "string" || Array.isArray(val)) answers[key] = val as string | string[];
  }

  await prisma.speaker.update({
    where: { id: speaker.id },
    data: {
      feedbackAnswers: answers,
      feedbackSubmittedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
