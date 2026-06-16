"use client";

import { useState, useTransition } from "react";
import { Camera, Check, X, RotateCcw } from "lucide-react";
import {
  setUserDroitsImageGlobal,
  type DroitsImageAdminAction,
} from "./actions";

type Props = {
  userId: string;
  status: "accepted" | "refused" | null;
  signedAt: Date | null;
  signature: string | null;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function DroitsImagePanel({
  userId,
  status,
  signedAt,
  signature,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const adminOverride = signature?.startsWith("[admin:");

  function act(action: DroitsImageAdminAction, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await setUserDroitsImageGlobal(userId, action);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-md bg-stone-100 text-stone-700 flex items-center justify-center">
          <Camera className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900">Droit à l&apos;image</p>
          <StatusLine status={status} signedAt={signedAt} adminOverride={adminOverride} />
          {signature && !adminOverride && (
            <p className="text-xs text-stone-400 mt-1">Signé : « {signature} »</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "accepted" && (
          <button
            type="button"
            onClick={() =>
              act(
                "accept",
                "Confirmer l'acceptation au nom de cette personne ? Cet override sera tracé.",
              )
            }
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Marquer accepté
          </button>
        )}
        {status !== "refused" && (
          <button
            type="button"
            onClick={() =>
              act(
                "refuse",
                "Confirmer le refus au nom de cette personne ? Les futurs events n'utiliseront plus son image.",
              )
            }
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Marquer refusé
          </button>
        )}
        {status !== null && (
          <button
            type="button"
            onClick={() =>
              act(
                "reset",
                "Réinitialiser ? La prochaine inscription redemandera le consentement.",
              )
            }
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-stone-400">
        Le statut global s&apos;applique à tous les futurs events. Les events
        passés gardent leur snapshot d&apos;origine.
      </p>
    </div>
  );
}

function StatusLine({
  status,
  signedAt,
  adminOverride,
}: {
  status: "accepted" | "refused" | null;
  signedAt: Date | null;
  adminOverride?: boolean;
}) {
  if (status === null) {
    return (
      <p className="text-sm text-stone-500 mt-0.5">
        Pas encore défini globalement — demandé à la prochaine inscription.
      </p>
    );
  }
  const label = status === "accepted" ? "Accepté" : "Refusé";
  const tone =
    status === "accepted" ? "text-emerald-700" : "text-stone-700 font-medium";
  return (
    <p className={`text-sm mt-0.5 ${tone}`}>
      {label}
      {signedAt && (
        <span className="text-stone-400 font-normal">
          {" "}
          · {formatDate(signedAt)}
        </span>
      )}
      {adminOverride && (
        <span className="text-stone-400 font-normal"> · override admin</span>
      )}
    </p>
  );
}
