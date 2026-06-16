"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/Toggle";
import { upsertFormConfig, upsertFeedbackConfig } from "./actions";

type FormCfg = {
  // Couche Fondamentale
  phoneEnabled: boolean;
  birthDateEnabled: boolean;
  cityEnabled: boolean;
  // Couche Orientation
  niveauScolaireEnabled: boolean;
  regionEnabled: boolean;
  projetProEnabled: boolean;
  motivationEnabled: boolean;
  sourceEnabled: boolean;
  // Couche Événement
  droitsImageEnabled: boolean;
  regimeEnabled: boolean;
  accessibiliteEnabled: boolean;
  commentaireEnabled: boolean;
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
        kind: "toggle",
        label: "Niveau scolaire",
        description: "Classe / diplôme en cours.",
        configKey: "niveauScolaireEnabled",
      },
      {
        kind: "toggle",
        label: "Région",
        description: "Région française de résidence.",
        configKey: "regionEnabled",
      },
      {
        kind: "toggle",
        label: "Projet professionnel",
        description: "Texte libre — ce qu'elle envisage de faire.",
        configKey: "projetProEnabled",
      },
      {
        kind: "toggle",
        label: "Motivation",
        description: "Pourquoi elle rejoint Les Pilotes (choix multiples).",
        configKey: "motivationEnabled",
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
        kind: "toggle",
        label: "Droit à l'image",
        description: "Accord pour utiliser photos / vidéos. Adapté automatiquement pour les mineures. Consentement légal — garder activé en cas de doute.",
        configKey: "droitsImageEnabled",
      },
      {
        kind: "toggle",
        label: "Régime alimentaire",
        description: "Pour le déjeuner (végétarien, sans gluten, etc.).",
        configKey: "regimeEnabled",
      },
      {
        kind: "toggle",
        label: "Accessibilité",
        description: "Besoins spécifiques (mobilité, sensoriel…). Champ libre.",
        configKey: "accessibiliteEnabled",
      },
      {
        kind: "toggle",
        label: "Commentaire libre",
        description: "Tout ce qui n'entre pas ailleurs.",
        configKey: "commentaireEnabled",
      },
    ],
  },
];

// =====================================================================
// Feedback questionnaire — canonical question set (modèle Les Pilotes).
// Les questions sont fixes ; seules les options « intervenante » et les
// prénoms des animatrices changent d'un event à l'autre (résolus au
// rendu du formulaire public). Chaque question est activable/désactivable
// et l'état est persisté dans FeedbackConfig.customFields (JSON).
// =====================================================================

type PreviewType = "text" | "long" | "select" | "multi" | "scale" | "yesno";

type FeedbackQuestion = {
  key: string;
  label: string;
  description?: string;
  type: PreviewType;
  options?: string[];
  /** Question structurelle, toujours collectée (non désactivable). */
  locked?: boolean;
  /** Options résolues dynamiquement depuis les intervenantes de l'event. */
  dynamicOptions?: boolean;
};

type FeedbackSection = {
  number: string;
  title: string;
  intro: string;
  questions: FeedbackQuestion[];
};

const FEEDBACK_SECTIONS: FeedbackSection[] = [
  {
    number: "01",
    title: "Identité",
    intro: "Qui répond. Le prénom et le nom rattachent le feedback à la participante.",
    questions: [
      { key: "prenom", label: "Prénom", type: "text", locked: true },
      { key: "nom", label: "Nom", type: "text", locked: true },
      { key: "ville", label: "Ville de résidence", type: "text" },
      {
        key: "classe",
        label: "T'es en quelle classe ?",
        type: "select",
        options: ["3ème", "Seconde", "Première", "Terminale", "Études supérieures", "Autres"],
      },
      {
        key: "projetClair",
        label: "Est-ce que tu sais ce que tu veux faire plus tard ?",
        description: "Détaille ton projet professionnel ou le domaine qui t'intéresse.",
        type: "long",
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
      { key: "rencontresAideDetail", label: "En quoi est-ce que ces rencontres t'ont aidée ?", type: "long" },
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
        label: "Qualité de l'animation de l'atelier",
        description: "Note de 1 à 5. Le nom des animatrices est inséré automatiquement.",
        type: "scale",
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

const ALL_FEEDBACK_KEYS = FEEDBACK_SECTIONS.flatMap((s) => s.questions.map((q) => q.key));

/** Default enabled-state: every question on, unless the saved config says otherwise. */
function resolveFeedbackState(
  initial: Record<string, boolean> | null,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const key of ALL_FEEDBACK_KEYS) {
    state[key] = initial?.[key] ?? true;
  }
  return state;
}

export default function FormulairesTab({
  eventId,
  formCfg,
  feedbackFields,
}: {
  eventId: string;
  formCfg: FormCfg;
  feedbackFields: Record<string, boolean> | null;
}) {
  return (
    <div className="space-y-4">
      <CollapsibleSection
        title="Inscription"
        hint="Le formulaire que les participantes remplissent pour s'inscrire."
        defaultOpen
      >
        <InscriptionBody eventId={eventId} initial={formCfg} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Feedback"
        hint="Le formulaire envoyé après l'événement pour mesurer l'impact."
        defaultOpen
      >
        <FeedbackBody eventId={eventId} initial={feedbackFields} />
      </CollapsibleSection>
    </div>
  );
}

function CollapsibleSection({
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string;
  hint: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-stone-200 last:border-b-0 pb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 py-4 text-left hover:bg-stone-50 -mx-2 px-2 rounded transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 text-stone-400 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
          <p className="text-sm text-stone-500 mt-0.5 max-w-prose">{hint}</p>
        </div>
      </button>
      {open && <div className="pt-4">{children}</div>}
    </section>
  );
}

function InscriptionBody({ eventId, initial }: { eventId: string; initial: FormCfg }) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Left: field toggles */}
      <div className="space-y-10 min-w-0">
        {INSCRIPTION_LAYERS.map((layer) => (
          <LayerCard key={layer.number} layer={layer} cfg={cfg} onToggle={toggle} />
        ))}

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
      </div>

      {/* Right: live preview */}
      <div className="lg:sticky lg:top-4 self-start">
        <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400 mb-3">
          Aperçu en temps réel
        </p>
        <FormPreview cfg={cfg} />
      </div>
    </div>
  );
}

/**
 * Read-only mock of the public inscription form, mirroring what participants
 * see. Reflects the live FormConfig toggles so admins immediately see the
 * effect of enabling/disabling a field. Locked fields are always shown
 * (they're structurally required). Gender isn't shown — the program is
 * women-only, so it's always "Fille".
 */
function FormPreview({ cfg }: { cfg: FormCfg }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-stone-900 px-5 py-4">
        <p className="text-white font-semibold text-sm">Inscription</p>
        <p className="text-stone-400 text-xs mt-0.5">
          Workshop 100% Féminin · Les Pilotes
        </p>
      </div>

      <div className="p-5 space-y-5">
        <PreviewGroup label="Tes infos">
          <PreviewField label="Email" required />
          <PreviewField label="Prénom" required />
          <PreviewField label="Nom" required />
          {cfg.phoneEnabled && <PreviewField label="Téléphone" />}
          {cfg.birthDateEnabled && <PreviewField label="Date de naissance" />}
          {cfg.cityEnabled && <PreviewField label="Ville de résidence" />}
        </PreviewGroup>

        <PreviewGroup label="Ton orientation">
          {cfg.niveauScolaireEnabled && (
            <PreviewField label="Niveau scolaire" required type="select" />
          )}
          {cfg.regionEnabled && (
            <PreviewField label="Région" required type="select" />
          )}
          {cfg.projetProEnabled && (
            <PreviewField label="Projet professionnel" required />
          )}
          {cfg.motivationEnabled && (
            <PreviewField label="Motivation" required type="chips" />
          )}
          {cfg.sourceEnabled && (
            <PreviewField label="Comment as-tu connu Les Pilotes ?" />
          )}
        </PreviewGroup>

        <PreviewGroup label="Pour cet événement">
          {cfg.droitsImageEnabled && (
            <PreviewField label="Droit à l'image" type="check" />
          )}
          {cfg.regimeEnabled && (
            <PreviewField label="Régime alimentaire" type="chips" />
          )}
          {cfg.accessibiliteEnabled && <PreviewField label="Accessibilité" />}
          {cfg.commentaireEnabled && (
            <PreviewField label="Commentaire libre" type="area" />
          )}
        </PreviewGroup>
      </div>
    </div>
  );
}

function PreviewGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
        {label}
      </p>
      {children}
    </div>
  );
}

function PreviewField({
  label,
  required = false,
  type = "text",
}: {
  label: string;
  required?: boolean;
  type?: "text" | "select" | "area" | "chips" | "check";
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-stone-600">
        {label}
        {required && <span className="text-orange-500"> *</span>}
      </p>
      {type === "area" ? (
        <div className="h-12 rounded-lg border border-stone-200 bg-stone-50" />
      ) : type === "chips" ? (
        <div className="flex gap-1.5">
          <span className="h-6 w-16 rounded-full bg-stone-100" />
          <span className="h-6 w-20 rounded-full bg-stone-100" />
          <span className="h-6 w-14 rounded-full bg-stone-100" />
        </div>
      ) : type === "check" ? (
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border border-stone-300 bg-stone-50" />
          <span className="h-3 w-40 rounded bg-stone-100" />
        </div>
      ) : (
        <div className="h-9 rounded-lg border border-stone-200 bg-stone-50 flex items-center px-3">
          {type === "select" && (
            <span className="ml-auto text-stone-300 text-xs">▾</span>
          )}
        </div>
      )}
    </div>
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
      <Toggle
        checked={checked}
        onChange={() => onToggle(field.configKey)}
        label={field.label}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-800">{field.label}</p>
        <p className="text-xs text-stone-500 max-w-prose">{field.description}</p>
      </div>
    </li>
  );
}

// =====================================================================
// Feedback subsection — mirrors the inscription UX: editable toggles on
// the left, live preview of the public feedback form on the right.
// =====================================================================

function FeedbackBody({
  eventId,
  initial,
}: {
  eventId: string;
  initial: Record<string, boolean> | null;
}) {
  const [state, setState] = useState(() => resolveFeedbackState(initial));
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(key: string) {
    setState((p) => ({ ...p, [key]: !p[key] }));
    setIsDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertFeedbackConfig(eventId, state);
      if (result.ok) {
        toast.success("Formulaire de feedback mis à jour");
        setIsDirty(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Left: question toggles, grouped by section */}
      <div className="space-y-10 min-w-0">
        {FEEDBACK_SECTIONS.map((section) => (
          <FeedbackSectionCard
            key={section.number}
            section={section}
            state={state}
            onToggle={toggle}
          />
        ))}

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
      </div>

      {/* Right: live preview */}
      <div className="lg:sticky lg:top-4 self-start">
        <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400 mb-3">
          Aperçu en temps réel
        </p>
        <FeedbackPreview state={state} />
      </div>
    </div>
  );
}

function FeedbackSectionCard({
  section,
  state,
  onToggle,
}: {
  section: FeedbackSection;
  state: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-xs font-mono text-stone-400 tabular-nums">{section.number}</span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
          {section.title}
        </h3>
      </div>
      <p className="text-xs text-stone-500 max-w-prose mb-4 pl-9">{section.intro}</p>

      <ul className="space-y-px pl-9 border-l border-stone-100">
        {section.questions.map((q) => (
          <FeedbackQuestionRow
            key={q.key}
            question={q}
            checked={state[q.key]}
            onToggle={() => onToggle(q.key)}
          />
        ))}
      </ul>
    </div>
  );
}

function FeedbackQuestionRow({
  question,
  checked,
  onToggle,
}: {
  question: FeedbackQuestion;
  checked: boolean;
  onToggle: () => void;
}) {
  if (question.locked) {
    return (
      <li className="flex items-start gap-3 py-3 pl-4 -ml-px border-l border-transparent">
        <Lock className="w-3.5 h-3.5 mt-0.5 text-stone-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-800">{question.label}</p>
          {question.description && (
            <p className="text-xs text-stone-500">{question.description}</p>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-stone-400 mt-0.5">
          Obligatoire
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 py-3 pl-4 -ml-px border-l border-transparent hover:bg-stone-50/50 -mx-2 px-2 rounded transition-colors">
      <Toggle checked={checked} onChange={onToggle} label={question.label} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-800">{question.label}</p>
        {question.description && (
          <p className="text-xs text-stone-500 max-w-prose">{question.description}</p>
        )}
      </div>
    </li>
  );
}

/**
 * Read-only mock of the public feedback form. Renders every enabled question
 * grouped by section, so the admin sees exactly what the participante will get.
 * The "intervenante préférée" options are resolved from the event's speakers at
 * send time — here we show a placeholder.
 */
function FeedbackPreview({ state }: { state: Record<string, boolean> }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-4">
        <p className="text-white font-semibold text-sm">Formulaire de feedback</p>
        <p className="text-white/80 text-xs mt-0.5">100% Féminin · Les Pilotes</p>
      </div>

      <div className="p-5 space-y-5 max-h-[680px] overflow-y-auto">
        {FEEDBACK_SECTIONS.map((section) => {
          const visible = section.questions.filter((q) => q.locked || state[q.key]);
          if (visible.length === 0) return null;
          return (
            <PreviewGroup key={section.number} label={section.title}>
              {visible.map((q) => (
                <FeedbackPreviewField key={q.key} question={q} />
              ))}
            </PreviewGroup>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackPreviewField({ question }: { question: FeedbackQuestion }) {
  const options = question.dynamicOptions
    ? ["Intervenante A", "Intervenante B", "Intervenante C"]
    : question.options;

  return (
    <div className="space-y-1">
      <p className="text-xs text-stone-600">
        {question.label}
        {!question.dynamicOptions && <span className="text-orange-500"> *</span>}
      </p>

      {question.type === "long" ? (
        <div className="h-12 rounded-lg border border-stone-200 bg-stone-50" />
      ) : question.type === "text" ? (
        <div className="h-9 rounded-lg border border-stone-200 bg-stone-50" />
      ) : question.type === "scale" ? (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className="w-7 h-7 rounded-full border border-stone-200 bg-stone-50 flex items-center justify-center text-[10px] text-stone-400"
            >
              {n}
            </span>
          ))}
        </div>
      ) : question.type === "yesno" ? (
        <div className="flex gap-2">
          <span className="px-3 h-7 rounded-full border border-stone-200 bg-stone-50 flex items-center text-[11px] text-stone-500">
            Oui
          </span>
          <span className="px-3 h-7 rounded-full border border-stone-200 bg-stone-50 flex items-center text-[11px] text-stone-500">
            Non
          </span>
        </div>
      ) : question.type === "multi" ? (
        <div className="space-y-1">
          {(options ?? []).map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded border border-stone-300 bg-stone-50 shrink-0" />
              <span className="text-[11px] text-stone-500">{opt}</span>
            </div>
          ))}
        </div>
      ) : (
        // select
        <div className="space-y-1">
          {(options ?? []).map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border border-stone-300 bg-stone-50 shrink-0" />
              <span className="text-[11px] text-stone-500">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
