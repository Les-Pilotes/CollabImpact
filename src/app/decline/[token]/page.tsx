import { verifyActionToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { EnrollmentStatus } from "@prisma/client";
import { ActionResultLayout } from "./ActionResultLayout";

export const dynamic = "force-dynamic";

type Outcome =
  | "declined"
  | "already_declined"
  | "terminal"
  | "expired"
  | "invalid"
  | "not_found";

async function processDecline(token: string): Promise<{
  outcome: Outcome;
  enrollment?: {
    firstName: string;
    eventName: string;
  };
}> {
  const result = verifyActionToken(token);
  if (!result.valid) {
    return { outcome: result.reason === "expired" ? "expired" : "invalid" };
  }
  if (result.action !== "decline") {
    return { outcome: "invalid" };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: result.enrollmentId },
    include: {
      user: { select: { firstName: true } },
      event: { select: { name: true } },
    },
  });
  if (!enrollment || enrollment.deletedAt) {
    return { outcome: "not_found" };
  }

  const enrollmentMeta = {
    firstName: enrollment.user.firstName,
    eventName: enrollment.event.name,
  };

  if (enrollment.status === EnrollmentStatus.desistement) {
    return { outcome: "already_declined", enrollment: enrollmentMeta };
  }
  if (
    enrollment.status === EnrollmentStatus.absente ||
    enrollment.status === EnrollmentStatus.presente ||
    enrollment.status === EnrollmentStatus.feedback_recu
  ) {
    return { outcome: "terminal", enrollment: enrollmentMeta };
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: EnrollmentStatus.desistement },
  });

  return { outcome: "declined", enrollment: enrollmentMeta };
}

export default async function DeclinePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { outcome, enrollment } = await processDecline(token);

  switch (outcome) {
    case "declined":
    case "already_declined":
      return (
        <ActionResultLayout
          emoji="🙏"
          title={
            outcome === "already_declined"
              ? `On avait déjà noté ton désistement, ${enrollment!.firstName}.`
              : `On note ton désistement, ${enrollment!.firstName}.`
          }
          description={
            <>
              Merci de nous avoir prévenu.es — ça permet à quelqu&apos;un d&apos;autre de
              prendre ta place sur <strong>{enrollment!.eventName}</strong>.
              <br />
              <br />À très vite sur un prochain événement ✨
            </>
          }
          variant="info"
        />
      );
    case "terminal":
      return (
        <ActionResultLayout
          emoji="ℹ️"
          title="Cette inscription est déjà clôturée"
          description="L'événement est passé ou l'inscription a un statut final. Si tu penses qu'il y a une erreur, contacte-nous."
          variant="info"
        />
      );
    case "expired":
      return (
        <ActionResultLayout
          emoji="⏰"
          title="Ce lien a expiré"
          description="Il était valable 14 jours. Contacte-nous directement si tu veux te désister."
          variant="warning"
        />
      );
    case "not_found":
      return (
        <ActionResultLayout
          emoji="🤔"
          title="Inscription introuvable"
          description="Le lien n'est pas reconnu. Vérifie que tu cliques bien depuis le dernier email reçu."
          variant="warning"
        />
      );
    case "invalid":
    default:
      return (
        <ActionResultLayout
          emoji="🤔"
          title="Lien invalide"
          description="Ce lien ne semble pas valide. Réessaie depuis le dernier email reçu, ou contacte-nous."
          variant="warning"
        />
      );
  }
}
