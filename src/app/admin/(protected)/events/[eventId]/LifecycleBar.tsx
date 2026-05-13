"use client";

import { useState, useTransition } from "react";
import { ImmersionStatus } from "@prisma/client";
import { toast } from "sonner";
import { AlertTriangle, Archive, CheckCircle2, Circle, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { transitionEventStatus } from "../actions";
import { ALLOWED_TRANSITIONS } from "@/lib/validation/event";

type Step = {
  id: ImmersionStatus;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Four user-facing lifecycle steps. complet & en_cours are derived badges.
const STEPS: Step[] = [
  {
    id: ImmersionStatus.brouillon,
    label: "Brouillon",
    shortLabel: "Brouillon",
    description: "Inscriptions fermées, l'événement n'est pas visible publiquement.",
    icon: Circle,
  },
  {
    id: ImmersionStatus.publie,
    label: "En préparation",
    shortLabel: "Préparation",
    description: "Inscriptions ouvertes — le lien public est actif.",
    icon: Send,
  },
  {
    id: ImmersionStatus.termine,
    label: "Finalisé",
    shortLabel: "Finalisé",
    description: "L'événement a eu lieu. Les feedbacks peuvent être collectés.",
    icon: CheckCircle2,
  },
  {
    id: ImmersionStatus.archive,
    label: "Archivé",
    shortLabel: "Archivé",
    description: "Sorti des listes actives. Reste consultable dans l'onglet Archivés.",
    icon: Archive,
  },
];

function statusIndex(status: ImmersionStatus): number {
  // Map intermediate technical states to the closest user-facing step
  if (status === ImmersionStatus.complet || status === ImmersionStatus.en_cours) {
    return 1; // shown as "En préparation" but with derived badge
  }
  return STEPS.findIndex((s) => s.id === status);
}

type Props = {
  eventId: string;
  status: ImmersionStatus;
  isComplet: boolean;
  isEnCours: boolean;
};

export default function LifecycleBar({ eventId, status, isComplet, isEnCours }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<ImmersionStatus | null>(null);

  const currentIdx = statusIndex(status);
  const allowedTargets = ALLOWED_TRANSITIONS[status];

  function attemptTransition(target: ImmersionStatus) {
    if (target === status) return;
    if (!allowedTargets.includes(target)) {
      toast.error("Transition non autorisée depuis ce statut.");
      return;
    }
    // Confirm only the truly destructive transition (archive).
    // Finalisé is reversible (we allow termine → publie), so a toast with
    // undo is enough — keeps the flow lighter.
    if (target === ImmersionStatus.archive) {
      setConfirmTarget(target);
      return;
    }
    doTransition(target, status);
  }

  function doTransition(target: ImmersionStatus, previous: ImmersionStatus) {
    startTransition(async () => {
      const result = await transitionEventStatus(eventId, target);
      if (result.ok) {
        const step = STEPS.find((s) => s.id === target);
        // Offer an inline undo for Finalisé (the only non-archive
        // transition with real consequences — closes inscriptions).
        const undoable =
          target === ImmersionStatus.termine && previous === ImmersionStatus.publie;
        if (undoable) {
          toast.success(`Statut → ${step?.label ?? target}`, {
            action: {
              label: "Annuler",
              onClick: () => {
                transitionEventStatus(eventId, previous).then((r) => {
                  if (r.ok) toast.success("Annulé");
                });
              },
            },
          });
        } else {
          toast.success(`Statut → ${step?.label ?? target}`);
        }
        setConfirmTarget(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Stepper */}
      <div className="flex items-stretch gap-1 rounded-xl bg-stone-100 p-1">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCurrent = currentIdx === idx;
          const isPast = currentIdx > idx;
          const isAllowed = step.id === status || allowedTargets.includes(step.id);
          const disabled = isPending || !isAllowed;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => attemptTransition(step.id)}
              disabled={disabled}
              aria-disabled={disabled}
              aria-current={isCurrent ? "step" : undefined}
              title={step.description}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold
                transition-all duration-200 min-w-0
                ${
                  isCurrent
                    ? "bg-white text-[var(--brand-orange)] shadow-sm ring-1 ring-orange-200"
                    : isPast
                      ? "text-stone-700 hover:bg-white/60"
                      : isAllowed
                        ? "text-stone-500 hover:bg-white/60 hover:text-stone-900"
                        : "text-stone-300 cursor-not-allowed"
                }
              `}
            >
              <StepIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate hidden sm:inline">{step.label}</span>
              <span className="truncate sm:hidden">{step.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Derived badges */}
      {(isComplet || isEnCours) && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {isComplet && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              🎯 Complet
            </span>
          )}
          {isEnCours && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              🟢 En cours aujourd&apos;hui
            </span>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Archiver cet événement ?
            </DialogTitle>
            <DialogDescription>
              Il disparaîtra de la liste principale et sera visible uniquement dans
              l&apos;onglet Archivés. Les inscriptions et données restent intactes, tu peux
              toujours restaurer plus tard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => confirmTarget && doTransition(confirmTarget, status)}
              disabled={isPending}
            >
              {isPending ? "…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
