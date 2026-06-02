"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart2, Sparkles } from "lucide-react";
import { useLocalStorageValue } from "@/lib/hooks/use-local-storage-flag";

const DISMISS_KEY = "lp.onboarding.welcomeDismissed";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type Props = {
  firstName: string | null;
  adminCreatedAt: string; // ISO so it serializes from server cleanly
};

export default function WelcomeDialog({ firstName, adminCreatedAt }: Props) {
  const dismiss = useLocalStorageValue(DISMISS_KEY);
  const [closed, setClosed] = useState(false);
  const [step, setStep] = useState(0);
  // Snapshot "is this a new admin" once at first render (lazy init) so the
  // computation is pure across re-renders.
  const [isNewAdmin] = useState(
    () => Date.now() - new Date(adminCreatedAt).getTime() < SEVEN_DAYS_MS,
  );
  const shouldShow =
    dismiss.hydrated && dismiss.value === null && isNewAdmin && !closed;

  function close() {
    dismiss.set(new Date().toISOString());
    setClosed(true);
    setStep(0);
  }

  const slides = [
    {
      icon: <Sparkles className="w-10 h-10 text-orange-500" />,
      title: firstName ? `Bienvenue ${firstName} !` : "Bienvenue !",
      body: "Tu pilotes ici tous les événements de Les Pilotes : inscriptions, participantes, mesure d'impact. Une rapide visite pour t'orienter.",
    },
    {
      icon: <Calendar className="w-10 h-10 text-orange-500" />,
      title: "1 — Les événements",
      body: "Chaque workshop / immersion vit dans Événements. Tu y crées, publies, partages le lien d'inscription, suis les présences le jour J.",
    },
    {
      icon: <Users className="w-10 h-10 text-orange-500" />,
      title: "2 — Les participantes",
      body: "À l'intérieur d'un événement, l'onglet Participantes te donne un kanban pour suivre chaque inscrite, ses confirmations et son émargement.",
    },
    {
      icon: <BarChart2 className="w-10 h-10 text-orange-500" />,
      title: "3 — L'impact",
      body: "Après chaque événement, les feedbacks remontent dans la page Impact. Une checklist t'attend en bas du dashboard pour démarrer.",
    },
  ];

  const isLast = step === slides.length - 1;
  const current = slides[step];

  return (
    <Dialog open={shouldShow} onOpenChange={(v) => (v ? null : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 rounded-full bg-orange-50 p-3">
            {current.icon}
          </div>
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-stone-600 leading-relaxed">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5 py-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === step ? "bg-orange-500" : "bg-stone-200"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" onClick={close}>
            Passer
          </Button>
          {isLast ? (
            <Button onClick={close}>Compris, démarrer</Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>Suivant</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
