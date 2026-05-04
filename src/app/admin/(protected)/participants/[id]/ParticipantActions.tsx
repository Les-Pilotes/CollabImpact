'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnrollmentStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  updateEnrollmentStatus,
  markAttendance,
  sendManualReminder,
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

const ALL_STATUSES = Object.values(EnrollmentStatus);

type Props = {
  enrollmentId: string;
  currentStatus: EnrollmentStatus;
  j7SentAt: Date | null;
  feedbackToken: string | null;
  feedbackSentAt: Date | null;
  isEventDay: boolean;
};

export function ParticipantActions({
  enrollmentId,
  currentStatus,
  j7SentAt,
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

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as EnrollmentStatus;
    startTransition(async () => {
      const res = await updateEnrollmentStatus(enrollmentId, newStatus);
      if (res.ok) {
        showMessage('success', 'Statut mis à jour.');
        router.refresh();
      } else {
        showMessage('error', res.error ?? 'Erreur lors de la mise à jour.');
      }
    });
  }

  function handleMarkPresente() {
    startTransition(async () => {
      const res = await markAttendance(enrollmentId, true);
      if (res.ok) {
        showMessage('success', 'Marquée présente.');
        router.refresh();
      } else {
        showMessage('error', 'Erreur lors de la mise à jour.');
      }
    });
  }

  function handleMarkAbsente() {
    startTransition(async () => {
      const res = await markAttendance(enrollmentId, false);
      if (res.ok) {
        showMessage('success', 'Marquée absente.');
        router.refresh();
      } else {
        showMessage('error', 'Erreur lors de la mise à jour.');
      }
    });
  }

  function handleSendReminder() {
    startTransition(async () => {
      const res = await sendManualReminder(enrollmentId);
      if (res.ok) {
        showMessage('success', 'Relance J-7 envoyée.');
        router.refresh();
      } else {
        showMessage('error', res.error ?? "Erreur lors de l'envoi.");
      }
    });
  }

  function handleSendFeedback() {
    startTransition(async () => {
      const res = await sendFeedbackInvite(enrollmentId);
      if (res.ok) {
        showMessage('success', 'Invitation feedback envoyée.');
        router.refresh();
      } else {
        showMessage('error', res.error ?? "Erreur lors de l'envoi.");
      }
    });
  }

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

      {/* Status selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Changer le statut</label>
        <select
          defaultValue={currentStatus}
          onChange={handleStatusChange}
          disabled={isPending}
          className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance buttons — only on event day ± 1 */}
      {isEventDay && (
        <div className="flex gap-2">
          <Button
            onClick={handleMarkPresente}
            disabled={isPending || currentStatus === 'presente'}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isPending ? '...' : 'Marquer Présente'}
          </Button>
          <Button
            onClick={handleMarkAbsente}
            disabled={isPending || currentStatus === 'absente'}
            variant="destructive"
            className="flex-1"
          >
            {isPending ? '...' : 'Marquer Absente'}
          </Button>
        </div>
      )}

      {/* Send J7 reminder */}
      {!j7SentAt && (
        <Button
          onClick={handleSendReminder}
          disabled={isPending}
          variant="outline"
          className="w-full"
        >
          {isPending ? 'Envoi...' : 'Envoyer relance J-7'}
        </Button>
      )}

      {/* Send feedback invite */}
      {currentStatus === 'presente' && !feedbackToken && (
        <Button
          onClick={handleSendFeedback}
          disabled={isPending}
          variant="outline"
          className="w-full"
        >
          {isPending ? 'Envoi...' : 'Envoyer invitation feedback'}
        </Button>
      )}

      {/* Resend feedback */}
      {feedbackSentAt && (
        <Button
          onClick={handleSendFeedback}
          disabled={isPending}
          variant="ghost"
          className="w-full text-zinc-600"
        >
          {isPending ? 'Envoi...' : 'Renvoyer le feedback'}
        </Button>
      )}
    </div>
  );
}
