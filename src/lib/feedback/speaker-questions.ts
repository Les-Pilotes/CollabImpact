import type { FeedbackQuestion } from "./questions";

export type SpeakerSection = {
  number: string;
  title: string;
  questions: FeedbackQuestion[];
};

export const SPEAKER_SECTIONS: SpeakerSection[] = [
  {
    number: "01",
    title: "Votre engagement",
    questions: [
      {
        key: "motivations",
        label: "Quelles étaient vos motivations principales à participer à l'évènement ?",
        type: "multi",
        options: [
          "Inspirer des jeunes filles",
          "Développer mon réseau professionnel",
          "Faire de nouvelles rencontres",
          "Découvrir une nouvelle association",
          "Autre",
        ],
      },
      {
        key: "motivationsDetail",
        label: "Détaillez vos motivations",
        type: "long",
      },
    ],
  },
  {
    number: "02",
    title: "L'expérience",
    questions: [
      {
        key: "momentPrefere",
        label: "Quel a été votre moment préféré ?",
        type: "multi",
        options: [
          "Ice breaker / jeu de cohésion",
          "Jeu des intervenantes mystères",
          "Travail en groupe",
          "Présentation des parcours à l'oral",
          "Networking de fin",
        ],
      },
      {
        key: "momentPreferePourquoi",
        label: "Pourquoi c'était votre moment préféré ?",
        type: "long",
      },
    ],
  },
  {
    number: "03",
    title: "Les participantes & l'ambiance",
    questions: [
      {
        key: "energieJeunesFilles",
        label: "Qu'avez-vous pensé de l'énergie et de l'implication des jeunes filles ?",
        type: "long",
      },
      {
        key: "ambiance",
        label: "L'ambiance générale correspondait-elle à vos attentes ?",
        type: "select",
        options: [
          "Oui encore mieux que mes attentes",
          "Oui cela correspondait tout à fait",
          "Pas tout à fait",
          "Non pas du tout",
        ],
      },
      {
        key: "ambianceDetail",
        label: "Développez vos attentes à l'égard de l'évènement",
        type: "long",
      },
    ],
  },
  {
    number: "04",
    title: "Organisation & suggestions",
    questions: [
      {
        key: "animation",
        label: "Qu'avez-vous pensé de l'animation ?",
        type: "long",
      },
      {
        key: "organisation",
        label: "Qu'avez-vous pensé de l'organisation de l'évènement ?",
        description: "Lieu ? Déroulé ? L'accueil ? Préparation avant le jour J ?",
        type: "long",
      },
      {
        key: "ameliorations",
        label: "Qu'est-ce qu'on aurait pu améliorer ou ajouter de manière générale ?",
        type: "long",
      },
      {
        key: "formatsSouhaites",
        label: "Quels formats ou quels sujets aimeriez-vous voir davantage développés ?",
        type: "long",
      },
    ],
  },
  {
    number: "05",
    title: "Pour la suite",
    questions: [
      {
        key: "reintervenir",
        label: "Seriez-vous partante pour intervenir à nouveau dans un de nos évènements ?",
        type: "select",
        options: ["Oui avec plaisir !", "Selon mes disponibilités.", "Non."],
      },
      {
        key: "recommander",
        label: "Recommanderiez-vous cet évènement à d'autres intervenantes ?",
        type: "select",
        options: ["Oui sans hésiter !", "Probablement...", "Non."],
      },
    ],
  },
];

export const ALL_SPEAKER_FEEDBACK_KEYS = SPEAKER_SECTIONS.flatMap((s) =>
  s.questions.map((q) => q.key),
);
