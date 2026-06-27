/**
 * Canonical feedback questionnaire — single source of truth shared between the
 * admin configurator (Paramètres → Formulaires) and the public feedback form
 * (/feedback/[token]).
 *
 * Les questions sont fixes ; seules les options « intervenante préférée » et
 * les prénoms des animatrices changent d'un event à l'autre (résolus au rendu
 * du formulaire public depuis les intervenantes de l'event). L'activation de
 * chaque question est persistée dans FeedbackConfig.customFields (JSON) sous la
 * forme { fields: { [key]: boolean } } — voir upsertFeedbackConfig.
 *
 * Les réponses sont stockées dans Feedback.answers (JSON) indexées par `key`.
 */

export type FeedbackFieldType = "text" | "long" | "select" | "multi" | "scale" | "yesno";

export type FeedbackQuestion = {
  key: string;
  label: string;
  description?: string;
  type: FeedbackFieldType;
  options?: string[];
  /** Question structurelle, toujours collectée (non désactivable). */
  locked?: boolean;
  /**
   * Donnée déjà connue (reprise du profil participante) — jamais redemandée sur
   * le formulaire public, montrée pour info côté configurateur admin.
   */
  fromProfile?: boolean;
  /** Options résolues dynamiquement depuis les intervenantes de l'event. */
  dynamicOptions?: boolean;
  /**
   * Le libellé contient `{animatriceName}` — remplacé par le nom de l'animatrice
   * de l'event au moment du rendu (résolu depuis FeedbackConfig.customFields).
   */
  dynamicLabel?: boolean;
  /** Affichée conditionnellement quand la réponse à `key` vaut `equals`. */
  showIf?: { key: string; equals: string };
};

export type FeedbackSection = {
  number: string;
  title: string;
  intro: string;
  questions: FeedbackQuestion[];
};

export const FEEDBACK_SECTIONS: FeedbackSection[] = [
  {
    number: "01",
    title: "Identité",
    intro:
      "Déjà connu via le profil de la participante — repris automatiquement, jamais redemandé dans le formulaire.",
    questions: [
      { key: "prenom", label: "Prénom", type: "text", fromProfile: true },
      { key: "nom", label: "Nom", type: "text", fromProfile: true },
      { key: "ville", label: "Ville de résidence", type: "text", fromProfile: true },
      {
        key: "classe",
        label: "Classe / niveau scolaire",
        type: "select",
        fromProfile: true,
        options: ["3ème", "Seconde", "Première", "Terminale", "Études supérieures", "Autres"],
      },
      {
        key: "projetClair",
        label: "Projet professionnel",
        description: "Repris du profil — détaille ce qu'elle envisage de faire.",
        type: "long",
        fromProfile: true,
      },
    ],
  },
  {
    number: "02",
    title: "Déroulé",
    intro: "Ressenti sur l'expérience vécue pendant l'événement.",
    questions: [
      {
        key: "raisonsVenue",
        label: "Quelles étaient tes raisons de venir à cet événement ?",
        type: "multi",
        options: [
          "Networking professionnel",
          "Rencontrer des amis",
          "Apprendre de nouvelles choses",
          "Être inspirée",
          "Autres",
        ],
      },
      { key: "motivationDetail", label: "Détaille ta motivation", type: "long" },
      {
        key: "momentPrefere",
        label: "C'était quoi ton moment préféré ?",
        type: "select",
        options: [
          "Jeu de cohésion",
          "Jeu des intervenantes mystères",
          "Travail en groupe avec mon intervenante",
          "Présentations & Questions",
          "Réseautage de fin",
        ],
      },
      { key: "momentPreferePourquoi", label: "Pourquoi c'était ton moment préféré ?", type: "long" },
      {
        key: "intervenantePreferee",
        label: "Quelle était ton intervenante préférée ?",
        description: "Options générées depuis les intervenantes de l'event.",
        type: "select",
        dynamicOptions: true,
      },
      {
        key: "intervenantePrefereePourquoi",
        label: "Pourquoi c'était ton intervenante préférée ?",
        type: "long",
      },
      {
        key: "parleToutesIntervenantes",
        label: "Est-ce que t'as parlé avec toutes les intervenantes ?",
        type: "long",
      },
      {
        key: "rencontresAide",
        label:
          "Est-ce que ces rencontres t'ont aidée par rapport à ton orientation et ton projet professionnel ?",
        type: "yesno",
      },
      {
        key: "rencontresAideDetail",
        label: "En quoi est-ce que ces rencontres t'ont aidée ?",
        type: "long",
        showIf: { key: "rencontresAide", equals: "Oui" },
      },
      { key: "plusMarque", label: "Qu'est-ce qui t'a le plus marqué ?", type: "long" },
      { key: "domaineProchaineFois", label: "Quel domaine aimerais-tu voir la prochaine fois ?", type: "long" },
    ],
  },
  {
    number: "03",
    title: "Organisation",
    intro: "Qualité de l'animation et de la logistique de la demi-journée.",
    questions: [
      {
        key: "noteAnimation",
        label: "Sur une échelle de 1 à 5, comment évalues-tu la qualité de l'animation de l'atelier par {animatriceName} ?",
        description: "Le nom de l'animatrice est configuré dans Paramètres → Formulaires.",
        type: "scale",
        dynamicLabel: true,
      },
      { key: "commentaireAnimation", label: "Laisse un commentaire sur l'animation de la demi-journée", type: "long" },
      { key: "avisOrganisation", label: "T'as pensé quoi de l'organisation de la demi-journée ?", type: "long" },
      { key: "ameliorations", label: "Qu'est-ce qu'on aurait pu améliorer dans l'ensemble ?", type: "long" },
    ],
  },
  {
    number: "04",
    title: "La suite",
    intro: "Intention de revenir et mot de la fin.",
    questions: [
      {
        key: "interesseAutresEvents",
        label: "Es-tu intéressée par d'autres événements avec Les Pilotes ?",
        type: "select",
        options: [
          "Oui, par d'autres événements 100% Féminin",
          "Oui, 100% Féminin et plus avec Les Pilotes",
          "Non, je ne suis pas intéressée",
          "Je ne sais pas encore",
        ],
      },
      { key: "motDeLaFin", label: "Mot de la fin", type: "long" },
    ],
  },
];

export const ALL_FEEDBACK_QUESTIONS: FeedbackQuestion[] = FEEDBACK_SECTIONS.flatMap(
  (s) => s.questions,
);

export const ALL_FEEDBACK_KEYS: string[] = ALL_FEEDBACK_QUESTIONS.map((q) => q.key);

/**
 * Default enabled-state: every question on unless the saved config disables it.
 */
export function resolveFeedbackState(
  initial: Record<string, boolean> | null | undefined,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const key of ALL_FEEDBACK_KEYS) {
    state[key] = initial?.[key] ?? true;
  }
  return state;
}

/**
 * The questions that should appear on the public form, in order. Profile-known
 * questions (Identité) are never re-asked; the rest depend on the saved config.
 * Conditional (`showIf`) questions are kept here — the client decides whether to
 * render them based on the live answers.
 */
export function visibleFeedbackQuestions(
  enabled: Record<string, boolean>,
): FeedbackQuestion[] {
  return ALL_FEEDBACK_QUESTIONS.filter((q) => !q.fromProfile && (q.locked || enabled[q.key]));
}
