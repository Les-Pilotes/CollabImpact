import { verifyFeedbackToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import FeedbackForm from "./FeedbackForm";

export const metadata = { title: "Ton avis — Les Pilotes" };

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
      immersion: true,
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

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Ton avis, {enrollment.user.firstName} !
        </h1>
        <FeedbackForm
          token={token}
          firstName={enrollment.user.firstName}
          immersionName={enrollment.immersion.name}
        />
      </div>
    </main>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#f4f4f5",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "32px 16px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 8,
  padding: "32px 24px",
  width: "100%",
  maxWidth: 560,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};
