import type React from "react";
import { verifyFeedbackToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import FeedbackForm from "./FeedbackForm";
import {
  FEEDBACK_SECTIONS,
  resolveFeedbackState,
  type FeedbackQuestion,
} from "@/lib/feedback/questions";

export const metadata = { title: "Ton avis — Les Pilotes" };

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "linear-gradient(to bottom, #fafaf9, #fff)",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e4e4e7",
  borderRadius: 16,
  padding: "2rem",
  maxWidth: 420,
  width: "100%",
};

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const verification = verifyFeedbackToken(token);

  if (!verification.valid) {
    return (
      <main style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Lien invalide</h1>
          <p style={{ color: "#71717a" }}>Ce lien a expiré ou est invalide.</p>
        </div>
      </main>
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: verification.enrollmentId },
    include: {
      user: true,
      event: {
        include: {
          feedbackConfig: true,
          speakers: {
            where: { deletedAt: null },
            select: { firstName: true, domain: true },
            orderBy: { firstName: "asc" },
          },
        },
      },
      feedback: true,
    },
  });

  if (!enrollment) {
    return (
      <main style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Lien invalide</h1>
          <p style={{ color: "#71717a" }}>Ce lien a expiré ou est invalide.</p>
        </div>
      </main>
    );
  }

  if (enrollment.feedback) {
    return (
      <main style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Déjà soumis</h1>
          <p style={{ color: "#71717a" }}>Tu as déjà donné ton avis. Merci !</p>
        </div>
      </main>
    );
  }

  // Resolve which questions to show from the saved config, then inject
  // per-event dynamic values: speaker names and the animatrice name.
  const feedbackCustom = enrollment.event.feedbackConfig?.customFields as {
    fields?: Record<string, boolean>;
    animatriceName?: string;
  } | null;
  const enabled = resolveFeedbackState(feedbackCustom?.fields ?? null);
  const animatriceName = feedbackCustom?.animatriceName?.trim() || "l'animatrice";
  const speakerOptions = enrollment.event.speakers.map((s) =>
    s.domain ? `${s.firstName} (${s.domain})` : s.firstName,
  );

  function resolveQuestion(q: FeedbackQuestion): FeedbackQuestion {
    if (q.dynamicOptions) return { ...q, options: speakerOptions };
    if (q.dynamicLabel) return { ...q, label: q.label.replace("{animatriceName}", animatriceName) };
    return q;
  }

  // Build sections: exclude Identité (fromProfile), filter by enabled config.
  const sections = FEEDBACK_SECTIONS.map((s) => ({
    number: s.number,
    title: s.title,
    questions: s.questions
      .filter((q) => !q.fromProfile && (q.locked || enabled[q.key]))
      .map(resolveQuestion),
  })).filter((s) => s.questions.length > 0);

  return (
    <FeedbackForm
      token={token}
      firstName={enrollment.user.firstName}
      immersionName={enrollment.event.name}
      sections={sections}
    />
  );
}

