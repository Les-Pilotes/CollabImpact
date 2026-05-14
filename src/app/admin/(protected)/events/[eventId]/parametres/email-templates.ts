/**
 * Email defaults + variable substitution. Single source of truth shared between
 * the admin preview (browser) and the email sending pipeline (server).
 *
 * Variables follow the {token} syntax. At send time, the real values are
 * substituted in. In the preview, SAMPLE_VARS is used so the admin sees what
 * the participant will see.
 */

export type EmailKey = "confirmation" | "j7" | "j2" | "feedback";

export type EmailVars = {
  prenom: string;
  event: string;
  date: string;
  horaire: string;
  lieu: string;
};

export const SAMPLE_VARS: EmailVars = {
  prenom: "Marie",
  event: "Workshop découverte tech",
  date: "samedi 18 avril 2026",
  horaire: "9h30",
  lieu: "9 rue de Vaugirard, 75006 Paris",
};

type EmailDefault = {
  label: string;
  when: string;
  subject: string;
  heading: string;
  body: string;
  closing: string;
};

export const DEFAULTS: Record<EmailKey, EmailDefault> = {
  confirmation: {
    label: "Confirmation d'inscription",
    when: "Envoyé immédiatement après l'inscription.",
    subject: "Ton inscription à {event} est confirmée !",
    heading: "Bienvenue {prenom} !",
    body: "Ton inscription au {event} le {date} à {lieu} est bien enregistrée.\n\nOn a hâte de te retrouver, en cas de question, réponds à cet email ou contacte-nous sur WhatsApp.",
    closing: "À très bientôt.",
  },
  j7: {
    label: "Rappel J-7",
    when: "Envoyé 7 jours avant l'événement.",
    subject: "Confirme ta venue — {event}",
    heading: "Plus qu'une semaine, {prenom} !",
    body: "On a hâte de te voir à {event}, le {date}.\n\nConfirme ta présence en un clic :",
    closing: "Sans réponse sous 24h, on te rappellera au téléphone pour s'assurer que tout va bien.",
  },
  j2: {
    label: "Rappel J-2",
    when: "Envoyé 2 jours avant l'événement.",
    subject: "Dernière confirmation — {event}",
    heading: "C'est dans 2 jours, {prenom} !",
    body: "Rendez-vous {date} à {horaire} pour {event}.\n📍 {lieu}\n\nDernier check, un clic pour confirmer (ou te désister si imprévu) :",
    closing: "Si tu ne peux plus venir, préviens-nous tout de suite, ça libère une place pour quelqu'un d'autre.",
  },
  feedback: {
    label: "Invitation feedback",
    when: "Envoyé après l'événement, quand la participante est marquée présente.",
    subject: "Ton avis sur {event}",
    heading: "Merci d'être venue, {prenom} !",
    body: "On aimerait connaître ton ressenti sur {event}. 3 minutes maximum, c'est très utile pour améliorer les prochaines éditions.",
    closing: "Lien valable 30 jours.",
  },
};

const TOKEN_RE = /\{(prenom|event|date|horaire|lieu)\}/g;

export function substituteVariables(text: string, vars: EmailVars): string {
  if (!text) return "";
  return text.replace(TOKEN_RE, (_, key: keyof EmailVars) => vars[key] ?? "");
}

export const VARIABLES = [
  { token: "{prenom}", description: "Prénom de la participante" },
  { token: "{event}", description: "Nom de l'événement" },
  { token: "{date}", description: "Date formatée (ex: samedi 18 avril 2026)" },
  { token: "{horaire}", description: "Heure de début (ex: 9h30)" },
  { token: "{lieu}", description: "Adresse de l'événement" },
] as const;
