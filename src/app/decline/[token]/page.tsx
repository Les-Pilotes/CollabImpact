import { readDeclineState, declineEnrollmentForm, undoDeclineForm } from "./actions";
import { ActionResultLayout } from "./ActionResultLayout";

export const dynamic = "force-dynamic";

export default async function DeclinePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await readDeclineState(token);

  switch (state.outcome) {
    case "ask":
      return (
        <ActionResultLayout
          emoji="🤔"
          title={`${state.firstName}, tu confirmes ne pas pouvoir venir ?`}
          description={
            <>
              Ça concerne ta place sur <strong>{state.eventName}</strong>. Si tu te désistes, on
              pourra proposer ta place à quelqu&apos;un d&apos;autre.
            </>
          }
          variant="warning"
          action={
            <form action={declineEnrollmentForm.bind(null, token)}>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition-colors"
              >
                Oui, je me désiste
              </button>
            </form>
          }
        />
      );
    case "declined":
      return (
        <ActionResultLayout
          emoji="🙏"
          title={`On note ton désistement, ${state.firstName}.`}
          description={
            <>
              Merci de nous avoir prévenu.es — ça permet à quelqu&apos;un d&apos;autre de
              prendre ta place sur <strong>{state.eventName}</strong>.
              <br />
              <br />À très vite sur un prochain événement ✨
            </>
          }
          variant="info"
        />
      );
    case "already_declined":
      return (
        <ActionResultLayout
          emoji="🙏"
          title={`On avait déjà noté ton désistement, ${state.firstName}.`}
          description="Si tu changes d'avis et que tu peux finalement venir, tu peux annuler ton désistement ci-dessous."
          variant="info"
          action={
            state.canUndo ? (
              <form action={undoDeclineForm.bind(null, token)}>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-900 font-semibold transition-colors"
                >
                  Annuler mon désistement, je viens finalement
                </button>
              </form>
            ) : undefined
          }
        />
      );
    case "undone":
      return (
        <ActionResultLayout
          emoji="✅"
          title={`Parfait ${state.firstName}, on t'attend !`}
          description={
            <>
              Ton désistement est annulé pour <strong>{state.eventName}</strong>.
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
