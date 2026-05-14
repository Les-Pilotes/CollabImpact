import { verifyActionToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { EnrollmentStatus } from "@prisma/client";
import { ActionResultLayout } from "../../decline/[token]/ActionResultLayout";

export const dynamic = "force-dynamic";

type Outcome =
  | "confirmed"
  | "already_confirmed"
  | "terminal"
  | "expired"
  | "invalid"
  | "not_found";

async function processConfirm(token: string): Promise<{
  outcome: Outcome;
  enrollment?: {
    firstName: string;
    eventName: string;
    eventDate: Date;
    eventAddress: string;
  };
}> {
  const result = verifyActionToken(token);
  if (!result.valid) {
    return {
      outcome: result.reason === "expired" ? "expired" : "invalid",
    };
  }
  if (result.action !== "confirm") {
    return { outcome: "invalid" };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: result.enrollmentId },
    include: {
      user: { select: { firstName: true } },
      event: { select: { name: true, date: true, address: true } },
    },
  });
  if (!enrollment || enrollment.deletedAt) {
    return { outcome: "not_found" };
  }

  const enrollmentMeta = {
    firstName: enrollment.user.firstName,
    eventName: enrollment.event.name,
    eventDate: enrollment.event.date,
    eventAddress: enrollment.event.address,
  };

  // Already confirmed (idempotent)
  if (
    enrollment.status === EnrollmentStatus.confirmee_j7 ||
    enrollment.status === EnrollmentStatus.confirmee_j2 ||
    enrollment.status === EnrollmentStatus.presente
  ) {
    return { outcome: "already_confirmed", enrollment: enrollmentMeta };
  }
  // Terminal states block the action
  if (
    enrollment.status === EnrollmentStatus.absente ||
    enrollment.status === EnrollmentStatus.desistement ||
    enrollment.status === EnrollmentStatus.feedback_recu
  ) {
    return { outcome: "terminal", enrollment: enrollmentMeta };
  }

  // Decide which confirmation stage: J-7 vs J-2 based on event proximity
  const daysToEvent =
    (enrollment.event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const newStatus =
    daysToEvent <= 4 ? EnrollmentStatus.confirmee_j2 : EnrollmentStatus.confirmee_j7;

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: newStatus },
  });

  return { outcome: "confirmed", enrollment: enrollmentMeta };
}

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { outcome, enrollment } = await processConfirm(token);

  const formatted = enrollment
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(enrollment.eventDate)
    : "";

  switch (outcome) {
    case "confirmed":
    case "already_confirmed":
      return (
        <ActionResultLayout
          emoji="✅"
          title={
            outcome === "already_confirmed"
              ? `Tu étais déjà confirmée, ${enrollment!.firstName}.`
              : `Merci ${enrollment!.firstName}, ta présence est confirmée !`
          }
          description={
            <>
              On t&apos;attend pour <strong>{enrollment!.eventName}</strong>
              <br />
              le <strong>{formatted}</strong>
              <br />
              à <strong>{enrollment!.eventAddress}</strong>
            </>
          }
          variant="success"
        />
      );
    case "terminal":
      return (
        <ActionResultLayout
          emoji="ℹ️"
          title="Cette inscription est déjà clôturée"
          description="L'événement est passé ou l'inscription a été annulée. Si tu penses qu'il y a une erreur, contacte-nous."
          variant="info"
        />
      );
    case "expired":
      return (
        <ActionResultLayout
          emoji="⏰"
          title="Ce lien a expiré"
          description="Il était valable 14 jours. Contacte-nous directement pour confirmer ta présence."
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
