"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { upsertFormConfig } from "./actions";

type FormCfg = {
  phoneEnabled: boolean;
  birthDateEnabled: boolean;
  cityEnabled: boolean;
  sourceEnabled: boolean;
};

type FeedbackCfg = {
  satisfactionEnabled: boolean;
  highlightsEnabled: boolean;
  favoriteSpeakerEnabled: boolean;
  recommendEnabled: boolean;
};

type Field =
  | { kind: "locked"; label: string; description: string }
  | { kind: "toggle"; label: string; description: string; configKey: keyof FormCfg };

type Layer = {
  title: string;
  number: string;
  intro: string;
  fields: Field[];
};

const INSCRIPTION_LAYERS: Layer[] = [
  {
    number: "01",
    title: "Couche Fondamentale",
    intro: "Ce qui définit la participante. Sera réutilisé sur ses prochains événements.",
    fields: [
      {
        kind: "locked",
        label: "Email",
        description: "Identifiant unique de la participante.",
      },
      {
        kind: "locked",
        label: "Prénom, nom",
        description: "Toujours requis pour la salutation des emails.",
      },
      {
        kind: "toggle",
        label: "Téléphone",
        description: "Numéro mobile pour les relances rapides le jour J.",
        configKey: "phoneEnabled",
      },
      {
        kind: "toggle",
        label: "Date de naissance",
        description:
          "Sert à détecter les mineures (et donc l'autorisation parentale). Désactiver casse la reconnaissance des participantes qui reviennent.",
        configKey: "birthDateEnabled",
      },
      {
        kind: "toggle",
        label: "Ville de résidence",
        description: "Pour cartographier d'où viennent les participantes.",
        configKey: "cityEnabled",
      },
    ],
  },
  {
    number: "02",
    title: "Couche Orientation",
    intro:
      "Parcours scolaire et projection professionnelle. Évolue au fil des années — on redemande après 6 mois.",
    fields: [
      {
        kind: "locked",
        label: "Niveau scolaire",
        description: "Classe / diplôme en cours.",
      },
      {
        kind: "locked",
        label: "Région",
        description: "Région française de résidence.",
      },
      {
        kind: "locked",
        label: "Projet professionnel",
        description: "Texte libre — ce qu'elle envisage de faire.",
      },
      {
        kind: "locked",
        label: "Motivation",
        description: "Pourquoi elle rejoint Les Pilotes (choix multiples).",
      },
      {
        kind: "toggle",
        label: "Comment as-tu connu Les Pilotes ?",
        description: "Source de découverte — utile pour mesurer les canaux.",
        configKey: "sourceEnabled",
      },
    ],
  },
  {
    number: "03",
    title: "Couche Événement",
    intro: "Spécifique à cet événement précis — toujours redemandé à chaque inscription.",
    fields: [
      {
        kind: "locked",
        label: "Droit à l'image",
        description: "Accord pour utiliser photos / vidéos. Adapté automatiquement pour les mineures.",
      },
      {
        kind: "locked",
        label: "Régime alimentaire",
        description: "Pour le déjeuner (végétarien, sans gluten, etc.).",
      },
      {
        kind: "locked",
        label: "Accessibilité",
        description: "Besoins spécifiques (mobilité, sensoriel…). Champ libre.",
      },
      {
        kind: "locked",
        label: "Commentaire libre",
        description: "Tout ce qui n'entre pas ailleurs.",
      },
    ],
  },
];

const FEEDBACK_FIELDS: { label: string; description: string; key: keyof FeedbackCfg }[] = [
  {
    key: "satisfactionEnabled",
    label: "Note de satisfaction globale",
    description: "1 à 5 étoiles sur l'expérience globale.",
  },
  {
    key: "highlightsEnabled",
    label: "Moments préférés",
    description: "Champ libre — qu'est-ce qui l'a marquée ?",
  },
  {
    key: "favoriteSpeakerEnabled",
    label: "Intervenante préférée",
    description: "Avec qui a-t-elle le plus échangé ? À activer pour les workshops avec plusieurs intervenantes.",
  },
  {
    key: "recommendEnabled",
    label: "Recommanderais-tu Les Pilotes ?",
    description: "Net Promoter Score équivalent — utile pour les rapports impact.",
  },
];

export default function FormulairesTab({
  eventId,
  formCfg,
  feedbackCfg,
}: {
  eventId: string;
  formCfg: FormCfg;
  feedbackCfg: FeedbackCfg;
}) {
  return (
    <div className="space-y-14">
      <FormSubsection
        title="Inscription"
        hint="Le formulaire que les participantes remplissent pour s'inscrire."
        eventId={eventId}
        initial={formCfg}
      />
      <FeedbackSubsection
        title="Feedback"
        hint="Le formulaire envoyé après l'événement pour mesurer l'impact."
        cfg={feedbackCfg}
      />
    </div>
  );
}

function FormSubsection({
  title,
  hint,
  eventId,
  initial,
}: {
  title: string;
  hint: string;
  eventId: string;
  initial: FormCfg;
}) {
  const [cfg, setCfg] = useState(initial);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(key: keyof FormCfg) {
    setCfg((p) => ({ ...p, [key]: !p[key] }));
    setIsDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertFormConfig(eventId, cfg);
      if (result.ok) {
        toast.success("Formulaire d'inscription mis à jour");
        setIsDirty(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-prose">{hint}</p>
      </div>

      <div className="space-y-10">
        {INSCRIPTION_LAYERS.map((layer) => (
          <LayerCard key={layer.number} layer={layer} cfg={cfg} onToggle={toggle} />
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
        {isDirty ? (
          <p className="text-xs text-stone-500">Modifications non enregistrées</p>
        ) : (
          <p className="text-xs text-emerald-600">À jour</p>
        )}
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave} disabled={isPending || !isDirty}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </section>
  );
}

function LayerCard({
  layer,
  cfg,
  onToggle,
}: {
  layer: Layer;
  cfg: FormCfg;
  onToggle: (key: keyof FormCfg) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-xs font-mono text-stone-400 tabular-nums">{layer.number}</span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
          {layer.title}
        </h3>
      </div>
      <p className="text-xs text-stone-500 max-w-prose mb-4 pl-9">{layer.intro}</p>

      <ul className="space-y-px pl-9 border-l border-stone-100">
        {layer.fields.map((field) => (
          <FieldRow
            key={field.label}
            field={field}
            cfg={cfg}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </div>
  );
}

function FieldRow({
  field,
  cfg,
  onToggle,
}: {
  field: Field;
  cfg: FormCfg;
  onToggle: (key: keyof FormCfg) => void;
}) {
  if (field.kind === "locked") {
    return (
      <li className="flex items-start gap-3 py-3 pl-4 -ml-px border-l border-transparent">
        <Lock className="w-3.5 h-3.5 mt-0.5 text-stone-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-800">{field.label}</p>
          <p className="text-xs text-stone-500">{field.description}</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-stone-400 mt-0.5">
          Obligatoire
        </span>
      </li>
    );
  }

  const checked = cfg[field.configKey];
  return (
    <li
      className={`flex items-start gap-3 py-3 pl-4 -ml-px border-l border-transparent hover:bg-stone-50/50 -mx-2 px-2 rounded transition-colors`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onToggle(field.configKey)}
        className={`relative w-9 h-5 rounded-full transition-colors mt-0.5 shrink-0 ${
          checked ? "bg-stone-900" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-800">{field.label}</p>
        <p className="text-xs text-stone-500 max-w-prose">{field.description}</p>
      </div>
    </li>
  );
}

function FeedbackSubsection({
  title,
  hint,
  cfg,
}: {
  title: string;
  hint: string;
  cfg: FeedbackCfg;
}) {
  // Future: wire to upsertFeedbackConfig when feedback form respects this config.
  // For now, read-only display reflecting the current default (all on).
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-prose">{hint}</p>
      </div>

      <ul className="space-y-px pl-9 border-l border-stone-100">
        {FEEDBACK_FIELDS.map((f) => (
          <li key={f.key} className="flex items-start gap-3 py-3 pl-4">
            <div
              className={`relative w-9 h-5 rounded-full mt-0.5 shrink-0 ${
                cfg[f.key] ? "bg-stone-900" : "bg-stone-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full ${
                  cfg[f.key] ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-800">{f.label}</p>
              <p className="text-xs text-stone-500 max-w-prose">{f.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-stone-400 italic max-w-prose">
        L&apos;activation des champs feedback arrive dans une prochaine itération. Pour
        l&apos;instant tous les champs sont collectés par défaut.
      </p>
    </section>
  );
}
