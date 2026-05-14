"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { upsertFormConfig } from "./actions";

type Props = {
  eventId: string;
  initial: {
    phoneEnabled: boolean;
    birthDateEnabled: boolean;
    cityEnabled: boolean;
    sourceEnabled: boolean;
  };
};

const FIELDS = [
  { key: "phoneEnabled" as const, label: "Téléphone", desc: "Numéro de téléphone (étape 1)" },
  { key: "birthDateEnabled" as const, label: "Date de naissance", desc: "Requis pour les mineures — désactive avec précaution" },
  { key: "cityEnabled" as const, label: "Ville de résidence", desc: "Ville actuelle (étape 1)" },
  { key: "sourceEnabled" as const, label: "Comment tu nous as connu", desc: "Source de découverte (étape 2)" },
];

export default function FormConfigSection({ eventId, initial }: Props) {
  const [cfg, setCfg] = useState(initial);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(key: keyof typeof cfg) {
    setCfg((p) => ({ ...p, [key]: !p[key] }));
    setIsDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertFormConfig(eventId, cfg);
      if (result.ok) {
        toast.success("Formulaire mis à jour");
        setIsDirty(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {FIELDS.map(({ key, label, desc }) => (
          <label
            key={key}
            className="flex items-start gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors"
          >
            <div className="pt-0.5">
              <input
                type="checkbox"
                checked={cfg[key]}
                onChange={() => toggle(key)}
                className="w-4 h-4 accent-orange-500"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">{label}</p>
              <p className="text-xs text-stone-500">{desc}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
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
