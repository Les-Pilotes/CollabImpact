"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { updateInternalNote } from "./actions";

type Props = {
  enrollmentId: string;
  initialNote: string | null;
};

const MAX_LEN = 5000;

/**
 * Admin-only free-form note attached to an Enrollment. Saved via server
 * action; displays a unsaved-changes indicator and disables the save
 * button while pending. Empty input clears the note in DB.
 */
export function InternalNote({ enrollmentId, initialNote }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialNote ?? "");
  const [isPending, startTransition] = useTransition();

  const persisted = initialNote ?? "";
  const dirty = value.trim() !== persisted.trim();
  const tooLong = value.length > MAX_LEN;

  function handleSave() {
    if (!dirty || tooLong) return;
    startTransition(async () => {
      const res = await updateInternalNote(enrollmentId, value);
      if (res.ok) {
        toast.success(
          value.trim().length === 0 ? "Note supprimée." : "Note enregistrée.",
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      }
    });
  }

  function handleReset() {
    setValue(persisted);
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="p-5 border-b border-stone-100 flex items-center justify-between gap-3">
        <div>
          <SectionLabel tone="brand">Interne</SectionLabel>
          <h2 className="mt-1 text-lg font-semibold text-stone-900">
            Note admin
          </h2>
        </div>
        <span className="text-xs text-stone-400">
          Invisible pour la participante
        </span>
      </div>
      <div className="p-5 space-y-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ex. : à rappeler la veille — préfère le SMS au mail."
          rows={4}
          maxLength={MAX_LEN + 100}
          aria-label="Note interne admin"
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:border-[var(--brand-orange)] resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <p
            className={`text-xs tabular-nums ${
              tooLong ? "text-red-600 font-medium" : "text-stone-400"
            }`}
          >
            {value.length}/{MAX_LEN}
          </p>
          <div className="flex items-center gap-2">
            {dirty && !isPending && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                Annuler
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!dirty || isPending || tooLong}
            >
              {isPending ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
