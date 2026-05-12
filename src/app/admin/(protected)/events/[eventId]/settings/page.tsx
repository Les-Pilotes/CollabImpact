"use client";

import { useState } from "react";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "inscription" | "feedback";

type FieldConfig = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  required?: boolean;
};

const INSCRIPTION_FIELDS: FieldConfig[] = [
  { key: "phone", label: "Telephone", description: "Numero de telephone portable", enabled: true, required: false },
  { key: "birthDate", label: "Date de naissance", description: "Utilisee pour la verification des retours", enabled: true, required: false },
  { key: "city", label: "Ville", description: "Ville de residence", enabled: true, required: false },
  { key: "source", label: "Comment tu nous as connues ?", description: "Source de recrutement (Instagram, WhatsApp...)", enabled: true, required: false },
];

const FEEDBACK_FIELDS: FieldConfig[] = [
  { key: "satisfaction", label: "Note de satisfaction", description: "Evaluation globale de l'experience (1-5)", enabled: true },
  { key: "highlights", label: "Points forts", description: "Ce que la participante a le plus apprecie", enabled: true },
  { key: "favoriteSpeaker", label: "Intervenante preferee", description: "Quelle intervenante a le plus marque ?", enabled: true },
  { key: "recommend", label: "Recommandation", description: "Recommanderait-elle l'evenement ?", enabled: true },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="text-stone-400 hover:text-stone-600 transition-colors">
      {enabled ? (
        <ToggleRight className="w-6 h-6 text-orange-500" />
      ) : (
        <ToggleLeft className="w-6 h-6" />
      )}
    </button>
  );
}

export default function EventSettingsPage() {
  const [tab, setTab] = useState<Tab>("inscription");
  const [inscriptionFields, setInscriptionFields] = useState(INSCRIPTION_FIELDS);
  const [feedbackFields, setFeedbackFields] = useState(FEEDBACK_FIELDS);

  function toggleField(fields: FieldConfig[], setFields: typeof setInscriptionFields, key: string) {
    setFields(fields.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Parametres des formulaires</h1>
        <p className="text-sm text-stone-500 mt-1">Configure les champs visibles sur chaque formulaire.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {(["inscription", "feedback"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${tab === t ? "border-b-2 border-orange-500 text-orange-600" : "text-stone-500 hover:text-stone-900"}`}
          >
            {t === "inscription" ? "Formulaire d'inscription" : "Formulaire de feedback"}
          </button>
        ))}
      </div>

      {tab === "inscription" && (
        <div className="space-y-6">
          {/* Fixed fields */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Champs fixes (toujours presents)</h2>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
              {["Prenom", "Nom", "Email"].map((label) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 bg-stone-50">
                  <div>
                    <p className="text-sm font-medium text-stone-700">{label}</p>
                    <p className="text-xs text-stone-400">Obligatoire</p>
                  </div>
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">Fixe</span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Champs optionnels</h2>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
              {inscriptionFields.map((field) => (
                <div key={field.key} className="flex items-center justify-between px-4 py-3 bg-white">
                  <div>
                    <p className={`text-sm font-medium ${field.enabled ? "text-stone-900" : "text-stone-400"}`}>{field.label}</p>
                    <p className="text-xs text-stone-400">{field.description}</p>
                  </div>
                  <Toggle enabled={field.enabled} onToggle={() => toggleField(inscriptionFields, setInscriptionFields, field.key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Custom questions */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Questions personnalisees</h2>
            <div className="border border-dashed border-stone-200 rounded-lg p-6 text-center">
              <p className="text-sm text-stone-400 mb-3">Aucune question custom pour l&apos;instant.</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => alert("V3 — a venir")}>
                <Plus className="w-4 h-4" />
                Ajouter une question
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={() => alert("V3 — sauvegarde non branchee en V2")}>Sauvegarder</Button>
            <p className="text-xs text-stone-400 mt-2">La sauvegarde sera branchee en V3.</p>
          </div>
        </div>
      )}

      {tab === "feedback" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Questions du formulaire de feedback</h2>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
              {feedbackFields.map((field) => (
                <div key={field.key} className="flex items-center justify-between px-4 py-3 bg-white">
                  <div>
                    <p className={`text-sm font-medium ${field.enabled ? "text-stone-900" : "text-stone-400"}`}>{field.label}</p>
                    <p className="text-xs text-stone-400">{field.description}</p>
                  </div>
                  <Toggle enabled={field.enabled} onToggle={() => toggleField(feedbackFields, setFeedbackFields, field.key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Questions personnalisees</h2>
            <div className="border border-dashed border-stone-200 rounded-lg p-6 text-center">
              <p className="text-sm text-stone-400 mb-3">Aucune question custom pour l&apos;instant.</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => alert("V3 — a venir")}>
                <Plus className="w-4 h-4" />
                Ajouter une question
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={() => alert("V3 — sauvegarde non branchee en V2")}>Sauvegarder</Button>
            <p className="text-xs text-stone-400 mt-2">La sauvegarde sera branchee en V3.</p>
          </div>
        </div>
      )}
    </div>
  );
}
