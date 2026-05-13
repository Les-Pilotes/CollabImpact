'use client';

import React, { useTransition } from 'react';
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
} from './actions';

type Props = {
  enrollmentId: string;
  status: EnrollmentStatus;
  j7SentAt: Date | null;
  j2SentAt: Date | null;
  isEventDay: boolean;
  feedbackSentAt: Date | null;
};

const TERMINAL_STATUSES: EnrollmentStatus[] = ['absente', 'desistement', 'feedback_recu'];
const NO_DESIST_STATUSES: EnrollmentStatus[] = ['confirmee_j2', 'presente', 'absente', 'desistement', 'feedback_recu'];

export function InlineActions({ enrollmentId, status, j7SentAt, j2SentAt, isEventDay, feedbackSentAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function getPrimaryButton(): React.ReactNode {
    if (status === 'inscrit') {
      return (
        <Button size="sm" disabled={isPending} onClick={() => run(() => markContactee(enrollmentId))}>
          Contacter
        </Button>
      );
    }

    if (status === 'contactee' && j7SentAt === null) {
      return (
        <Button size="sm" disabled={isPending} onClick={() => run(() => sendManualReminder(enrollmentId))}>
          Envoyer J-7
        </Button>
      );
    }

    if (status === 'contactee' && j7SentAt !== null) {
      return (
        <Button
          size="sm"
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => run(() => markConfirmeeJ7(enrollmentId))}
        >
          Confirmée J-7
        </Button>
      );
    }

    if (status === 'confirmee_j7' && j2SentAt === null) {
      return (
        <Button size="sm" disabled={isPending} onClick={() => run(() => sendJ2Reminder(enrollmentId))}>
          Envoyer J-2
        </Button>
      );
    }

    if (status === 'confirmee_j7' && j2SentAt !== null) {
      return (
        <Button
          size="sm"
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => run(() => markConfirmeeJ2(enrollmentId))}
        >
          Confirmée J-2
        </Button>
      );
    }

    if (status === 'confirmee_j2' && isEventDay) {
      return (
        <Button
          size="sm"
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => run(() => markAttendance(enrollmentId, true))}
        >
          Présente
        </Button>
      );
    }

    if (status === 'presente') {
      return (
        <Button
          size="sm"
          variant={feedbackSentAt === null ? 'default' : 'ghost'}
          disabled={isPending}
          onClick={() => run(() => sendFeedbackInvite(enrollmentId))}
        >
          Feedback
        </Button>
      );
    }

    return null;
  }

  const primary = getPrimaryButton();

  if (primary === null && TERMINAL_STATUSES.includes(status)) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {primary}
      {!NO_DESIST_STATUSES.includes(status) && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => run(() => markDesistement(enrollmentId))}
        >
          Désiste
        </Button>
      )}
    </div>
  );
}
