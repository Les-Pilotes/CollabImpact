"use client";

import Link from "next/link";
import { Check, X, ChevronRight } from "lucide-react";
import type { OnboardingProgress } from "@/lib/onboarding/progress";
import { useLocalStorageValue } from "@/lib/hooks/use-local-storage-flag";

const HIDE_KEY = "lp.onboarding.checklistHidden";

type Props = {
  progress: OnboardingProgress;
};

export default function OnboardingChecklistClient({ progress }: Props) {
  const hide = useLocalStorageValue(HIDE_KEY);
  const { items, completed, total } = progress;
  const isComplete = completed === total;

  if (!hide.hydrated) return null; // SSR placeholder — avoids hydration mismatch
  if (hide.value === "true") return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-700 font-medium">
            Prise en main
          </p>
          <h2 className="text-lg font-semibold text-stone-900">
            {isComplete ? "Tu es paré·e ! ✨" : `${completed} / ${total} étapes`}
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">
            {isComplete
              ? "Tu as fait le tour. Tu peux masquer ce panneau."
              : "Quelques pas pour bien démarrer avec l'app."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => hide.set("true")}
          aria-label="Masquer la checklist"
          className="text-stone-400 hover:text-stone-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-3 rounded-md bg-white border ${
              item.done
                ? "border-emerald-200"
                : "border-stone-200 hover:border-orange-200"
            } p-3 transition-colors`}
          >
            <div
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                item.done
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-stone-100 text-stone-400"
              }`}
              aria-hidden
            >
              {item.done ? <Check className="w-4 h-4" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  item.done ? "text-stone-500 line-through" : "text-stone-900"
                }`}
              >
                {item.label}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">{item.description}</p>
            </div>
            {!item.done && (
              <Link
                href={item.ctaHref}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900 shrink-0"
              >
                {item.ctaLabel}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
