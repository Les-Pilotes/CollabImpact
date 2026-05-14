'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
  revertJ7Send,
  revertJ2Send,
  revertStatus,
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

  /** Run a simple action with success/error toast, no undo. */
  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successText: string,
  ) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(successText);
        router.refresh();
      } else {
        toast.error(res.error ?? 'Une erreur est survenue.');
      }
    });
  }

  /** Run a reversible action. The undo function is called from the toast. */
  function runWithUndo(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successText: string,
    undoFn: () => Promise<{ ok: boolean }>,
    undoText = 'Annulé',
  ) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(successText, {
          action: {
            label: 'Annuler',
            onClick: () => {
              undoFn().then((u) => {
                if (u.ok) {
                  toast.success(undoText);
                  router.refresh();
                }
              });
            },
          },
        });
        router.refresh();
      } else {
        toast.error(res.error ?? 'Une erreur est survenue.');
      }
    });
  }

  /** Désistement returns the previous status — undo restores it. */
  function runDesistement() {
    startTransition(async () => {
      const res = await markDesistement(enrollmentId);
      if (res.ok) {
        const prev = res.previousStatus;
        toast.success('Désistement enregistré.', {
          action: {
            label: 'Annuler',
            onClick: () => {
              revertStatus(enrollmentId, prev).then((u) => {
                if (u.ok) {
                  toast.success('Désistement annulé');
                  router.refresh();
                }
              });
            },
          },
        });
        router.refresh();
      } else {
        toast.error(res.error);
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
          <Button variant="ghost" disabled={isPending} onClick={runDesistement}>
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
              runWithUndo(
                () => sendManualReminder(enrollmentId),
                'Email J-7 envoyé.',
                () => revertJ7Send(enrollmentId),
                'J-7 marqué comme non envoyé',
              )
            }
          >
            Envoyer message J-7
          </Button>
          <Button variant="ghost" disabled={isPending} onClick={runDesistement}>
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
          <Button variant="ghost" disabled={isPending} onClick={runDesistement}>
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
            onClick={() =>
              runWithUndo(
                () => sendJ2Reminder(enrollmentId),
                'Email J-2 envoyé.',
                () => revertJ2Send(enrollmentId),
                'J-2 marqué comme non envoyé',
              )
            }
          >
            Envoyer message J-2
          </Button>
          <Button variant="ghost" disabled={isPending} onClick={runDesistement}>
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
          <Button variant="ghost" disabled={isPending} onClick={runDesistement}>
            Désiste
          </Button>
        </div>
      );
    }

    if (s === 'confirmee_j2') {
      if (!isEventDay) {
        return <p className="text-sm text-zinc-500">En attente du jour J</p>;
      }
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() =>
              runWithUndo(
                () => markAttendance(enrollmentId, true),
                'Marquée présente.',
                () => revertStatus(enrollmentId, 'confirmee_j2'),
                'Présence annulée',
              )
            }
          >
            Présente
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              runWithUndo(
                () => markAttendance(enrollmentId, false),
                'Marquée absente.',
                () => revertStatus(enrollmentId, 'confirmee_j2'),
                'Absence annulée',
              )
            }
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
    return <p className="text-sm text-zinc-500">{STATUS_LABELS[s]}</p>;
  }

  void feedbackToken;

  return <div className="space-y-4">{getContextualButtons()}</div>;
}
