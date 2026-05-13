'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnrollmentStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  markContactee,
  markConfirmeeJ7,
  markConfirmeeJ2,
  markDesistement,
  sendManualReminder,
  sendJ2Reminder,
  markAttendance,
  sendFeedbackInvite,
} from '../actions';

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  inscrit: 'Inscrite',
  contactee: 'Contactée',
  confirmee_j7: 'Confirmée J-7',
  confirmee_j2: 'Confirmée J-2',
  presente: 'Présente',
  absente: 'Absente',
  desistement: 'Désistement',
  feedback_recu: 'Feedback reçu',
};

type Props = {
  enrollmentId: string;
  currentStatus: EnrollmentStatus;
  j7SentAt: Date | null;
  j2SentAt: Date | null;
  feedbackToken: string | null;
  feedbackSentAt: Date | null;
  isEventDay: boolean;
};

export function ParticipantActions({
  enrollmentId,
  currentStatus,
  j7SentAt,
  j2SentAt,
  feedbackToken,
  feedbackSentAt,
  isEventDay,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successText: string) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        showMessage('success', successText);
        router.refresh();
      } else {
        showMessage('error', res.error ?? 'Une erreur est survenue.');
      }
    });
  }

  function getContextualButtons() {
    const s = currentStatus;

    if (s === 'inscrit') {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            onClick={() => run(() => markContactee(enrollmentId), 'Marquée contactée.')}
          >
            Marquer contactée
          </Button>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => run(() => markDesistement(enrollmentId), 'Désistement enregistré.')}
          >
            Désiste
          </Button>
        </div>
      );
    }

    if (s === 'contactee' && j7SentAt === null) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            onClick={() =>
              run(() => sendManualReminder(enrollmentId), 'Message J-7 envoyé.')
            }
          >
            Envoyer message J-7
          </Button>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => run(() => markDesistement(enrollmentId), 'Désistement enregistré.')}
          >
            Désiste
          </Button>
        </div>
      );
    }

    if (s === 'contactee' && j7SentAt !== null) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => run(() => markConfirmeeJ7(enrollmentId), 'Confirmée J-7.')}
          >
            Elle a confirmé
          </Button>
          <Button variant="outline" disabled>
            Pas de réponse
          </Button>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => run(() => markDesistement(enrollmentId), 'Désistement enregistré.')}
          >
            Désiste
          </Button>
        </div>
      );
    }

    if (s === 'confirmee_j7' && j2SentAt === null) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            onClick={() => run(() => sendJ2Reminder(enrollmentId), 'Message J-2 envoyé.')}
          >
            Envoyer message J-2
          </Button>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => run(() => markDesistement(enrollmentId), 'Désistement enregistré.')}
          >
            Désiste
          </Button>
        </div>
      );
    }

    if (s === 'confirmee_j7' && j2SentAt !== null) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => run(() => markConfirmeeJ2(enrollmentId), 'Confirmée J-2.')}
          >
            Elle a confirmé J-2
          </Button>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => run(() => markDesistement(enrollmentId), 'Désistement enregistré.')}
          >
            Désiste
          </Button>
        </div>
      );
    }

    if (s === 'confirmee_j2') {
      if (!isEventDay) {
        return (
          <p className="text-sm text-zinc-500">En attente du jour J</p>
        );
      }
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => run(() => markAttendance(enrollmentId, true), 'Marquée présente.')}
          >
            Présente
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => run(() => markAttendance(enrollmentId, false), 'Marquée absente.')}
          >
            Absente
          </Button>
        </div>
      );
    }

    if (s === 'presente') {
      if (feedbackSentAt === null) {
        return (
          <Button
            disabled={isPending}
            onClick={() =>
              run(() => sendFeedbackInvite(enrollmentId), 'Invitation feedback envoyée.')
            }
          >
            Envoyer invitation feedback
          </Button>
        );
      }
      return (
        <Button
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            run(() => sendFeedbackInvite(enrollmentId), 'Invitation feedback renvoyée.')
          }
        >
          Renvoyer le feedback
        </Button>
      );
    }

    // absente, desistement, feedback_recu — terminal states
    return (
      <p className="text-sm text-zinc-500">{STATUS_LABELS[s]}</p>
    );
  }

  // feedbackToken used only to suppress unused-var warning; the prop is kept for caller compat
  void feedbackToken;

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
      {getContextualButtons()}
    </div>
  );
}
