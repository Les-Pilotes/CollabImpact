"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { upsertEmailConfig } from "./actions";

type Props = {
  eventId: string;
  initial: {
    confirmationNote: string;
    j7Note: string;
    j2Note: string;
    feedbackNote: string;
  };
};

const EMAIL_TYPES = [
  {
    key: "confirmationNote" as const,
    label: "Email de confirmation d'inscription",
    hint: "Affiché après la confirmation d'inscription. Ex : adresse de rendez-vous, tenue conseillée…",
  },
  {
    key: "j7Note" as const,
    label: "Rappel J-7",
    hint: "Note ajoutée au rappel envoyé 7 jours avant. Ex : documents à apporter, point de rencontre…",
  },
  {
    key: "j2Note" as const,
    label: "Rappel J-2",
    hint: "Note ajoutée au rappel envoyé 2 jours avant. Ex : dernières infos pratiques…",
  },
  {
    key: "feedbackNote" as const,
    label: "Invitation feedback",
    hint: "Note ajoutée à l'email de feedback post-événement.",
  },
];

export default function EmailConfigSection({ eventId, initial }: Props) {
  const [cfg, setCfg] = useState(initial);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(key: keyof typeof cfg, value: string) {
    setCfg((p) => ({ ...p, [key]: value }));
    setIsDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertEmailConfig(eventId, cfg);
      if (result.ok) {
        toast.success("Templates mis à jour");
        setIsDirty(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {EMAIL_TYPES.map(({ key, label, hint }) => (
        <div key={key} className="space-y-1.5">
          <label className="text-sm font-medium text-stone-800">{label}</label>
          <textarea
            value={cfg[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            rows={3}
            placeholder="Laisse vide pour utiliser le texte par défaut."
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <p className="text-xs text-stone-400">{hint}</p>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        {isDirty ? (
          <p className="text-xs text-stone-500">Modifications non enregistrées</p>
        ) : (
          <p className="text-xs text-emerald-600">✓ À jour</p>
        )}
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave} disabled={isPending || !isDirty}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
