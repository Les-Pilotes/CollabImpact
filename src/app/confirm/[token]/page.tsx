import { readConfirmState, confirmEnrollmentForm } from "./actions";
import { ActionResultLayout } from "../../decline/[token]/ActionResultLayout";

export const dynamic = "force-dynamic";

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(date);
}

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await readConfirmState(token);

  switch (state.outcome) {
    case "ask": {
      const formatted = formatEventDate(state.eventDate);
      return (
        <ActionResultLayout
          emoji="👋"
          title={`${state.firstName}, tu confirmes ta présence ?`}
          description={
            <>
              Pour <strong>{state.eventName}</strong>
              <br />
              le <strong>{formatted}</strong>
              <br />
              à <strong>{state.eventAddress}</strong>
            </>
          }
          variant="info"
          action={
            <form action={confirmEnrollmentForm.bind(null, token)}>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
              >
                Oui, je confirme ma présence
              </button>
            </form>
          }
        />
      );
    }
    case "confirmed":
    case "already_confirmed": {
      const formatted = formatEventDate(state.eventDate);
      return (
        <ActionResultLayout
          emoji="✅"
          title={
            state.outcome === "already_confirmed"
              ? `Tu étais déjà confirmée, ${state.firstName}.`
              : `Merci ${state.firstName}, ta présence est confirmée !`
          }
          description={
            <>
              On t&apos;attend pour <strong>{state.eventName}</strong>
              <br />
              le <strong>{formatted}</strong>
              <br />
              à <strong>{state.eventAddress}</strong>
            </>
          }
          variant="success"
        />
      );
    }
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
