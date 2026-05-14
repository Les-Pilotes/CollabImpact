"use client";

import { useState, useTransition } from "react";
import { ImmersionStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  Circle,
  Send,
} from "lucide-react";
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
  description: string;
  consequence: string;
  icon: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
};

const STEPS: Record<ImmersionStatus, Step> = {
  [ImmersionStatus.brouillon]: {
    id: ImmersionStatus.brouillon,
    label: "Brouillon",
    description: "Inscriptions fermées, l'événement n'est pas visible publiquement.",
    consequence: "Personne ne peut s'inscrire. Le lien public renvoie une erreur.",
    icon: Circle,
  },
  [ImmersionStatus.publie]: {
    id: ImmersionStatus.publie,
    label: "En préparation",
    description: "Inscriptions ouvertes — le lien public est actif.",
    consequence:
      "Le lien d'inscription devient accessible publiquement. Les participantes peuvent s'inscrire.",
    icon: Send,
  },
  [ImmersionStatus.complet]: {
    id: ImmersionStatus.complet,
    label: "Complet",
    description: "Capacité atteinte (badge auto, pas une cible de transition).",
    consequence: "",
    icon: Circle,
  },
  [ImmersionStatus.en_cours]: {
    id: ImmersionStatus.en_cours,
    label: "En cours",
    description: "L'événement a lieu aujourd'hui (badge auto).",
    consequence: "",
    icon: Circle,
  },
  [ImmersionStatus.termine]: {
    id: ImmersionStatus.termine,
    label: "Finalisé",
    description: "L'événement a eu lieu. Les feedbacks peuvent être collectés.",
    consequence:
      "Les inscriptions sont fermées. L'émargement et la collecte de feedback restent actifs.",
    icon: CheckCircle2,
  },
  [ImmersionStatus.archive]: {
    id: ImmersionStatus.archive,
    label: "Archivé",
    description: "Sorti des listes actives. Reste consultable dans l'onglet Archivés.",
    consequence:
      "L'événement disparaît de la liste principale. Les données restent intactes et tu peux toujours restaurer plus tard.",
    icon: Archive,
    destructive: true,
  },
};

type Props = {
  eventId: string;
  status: ImmersionStatus;
  isComplet: boolean;
  isEnCours: boolean;
};

export default function LifecycleBar({ eventId, status, isComplet, isEnCours }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ImmersionStatus | null>(null);

  const current = STEPS[status];
  const CurrentIcon = current.icon;
  const allowedTargets = ALLOWED_TRANSITIONS[status].filter(
    (t) => t !== ImmersionStatus.complet && t !== ImmersionStatus.en_cours,
  );

  function pick(target: ImmersionStatus) {
    setPickerOpen(false);
    setConfirmTarget(target);
  }

  function doTransition(target: ImmersionStatus) {
    const previous = status;
    startTransition(async () => {
      const result = await transitionEventStatus(eventId, target);
      if (result.ok) {
        const step = STEPS[target];
        const undoable =
          (target === ImmersionStatus.termine && previous === ImmersionStatus.publie) ||
          (target === ImmersionStatus.publie && previous === ImmersionStatus.brouillon);
        if (undoable) {
          toast.success(`Statut → ${step.label}`, {
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
          toast.success(`Statut → ${step.label}`);
        }
        setConfirmTarget(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Current status — read-only badge + change button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white shadow-sm">
          <CurrentIcon className="w-4 h-4 text-[var(--brand-orange)]" />
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Statut
          </span>
          <span className="text-sm font-bold text-stone-900">{current.label}</span>
        </div>

        {allowedTargets.length > 0 && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            Changer
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Derived badges */}
        {(isComplet || isEnCours) && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {isComplet && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                🎯 Complet
              </span>
            )}
            {isEnCours && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                🟢 En cours aujourd&apos;hui
              </span>
            )}
          </div>
        )}
      </div>

      {/* Picker dialog — explicit list of allowed transitions */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription>
              Statut actuel : <strong>{current.label}</strong>. Sélectionne le nouveau
              statut.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {allowedTargets.map((target) => {
              const step = STEPS[target];
              const StepIcon = step.icon;
              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => pick(target)}
                  className={`
                    w-full text-left p-3 rounded-xl border transition-colors
                    ${
                      step.destructive
                        ? "border-amber-200 bg-amber-50/50 hover:bg-amber-100/50"
                        : "border-stone-200 hover:border-orange-200 hover:bg-orange-50/40"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                      w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                      ${
                        step.destructive
                          ? "bg-amber-100 text-amber-700"
                          : "bg-orange-50 text-[var(--brand-orange)]"
                      }
                    `}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900 text-sm">{step.label}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog — preview the consequence before applying */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent>
          {confirmTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {STEPS[confirmTarget].destructive && (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  Passer en &laquo; {STEPS[confirmTarget].label} &raquo; ?
                </DialogTitle>
                <DialogDescription className="pt-1">
                  {STEPS[confirmTarget].consequence}
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
                  variant={STEPS[confirmTarget].destructive ? "destructive" : "default"}
                  onClick={() => doTransition(confirmTarget)}
                  disabled={isPending}
                >
                  {isPending ? "…" : "Confirmer"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
