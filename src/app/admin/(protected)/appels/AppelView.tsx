'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  markContactee,
  markConfirmeeJ7,
  sendJ2Reminder,
  markConfirmeeJ2,
  markDesistement,
  sendManualReminder,
} from '../participants/actions';

const STATUS_LABELS: Record<string, string> = {
  inscrit: 'Inscrite',
  contactee: 'Contactée',
  confirmee_j7: 'Confirmée J-7',
  confirmee_j2: 'Confirmée J-2',
  presente: 'Présente',
  absente: 'Absente',
  desistement: 'Désistement',
  feedback_recu: 'Feedback reçu',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  inscrit: 'bg-zinc-100 text-zinc-700',
  contactee: 'bg-blue-100 text-blue-700',
  confirmee_j7: 'bg-indigo-100 text-indigo-700',
  confirmee_j2: 'bg-violet-100 text-violet-700',
  presente: 'bg-green-100 text-green-700',
  absente: 'bg-red-100 text-red-700',
  desistement: 'bg-orange-100 text-orange-700',
  feedback_recu: 'bg-emerald-100 text-emerald-700',
};

type Props = {
  enrollmentId: string;
  status: string;
  j7SentAt: string | null;
  j2SentAt: string | null;
  feedbackSentAt: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  enrolledAt: string;
  totalInQueue: number;
  immersionName: string;
};

export function AppelView({
  enrollmentId,
  status,
  j7SentAt,
  j2SentAt,
  firstName,
  lastName,
  email,
  phone,
  city,
  enrolledAt,
  totalInQueue,
  immersionName: _immersionName,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? 'Une erreur est survenue.');
      }
    });
  }

  const enrolledDate = new Date(enrolledAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const badgeClass = STATUS_BADGE_CLASSES[status] ?? 'bg-zinc-100 text-zinc-700';
  const badgeLabel = STATUS_LABELS[status] ?? status;

  const isTerminal =
    status === 'presente' ||
    status === 'absente' ||
    status === 'desistement' ||
    status === 'feedback_recu';

  const isConfirmeeJ2 = status === 'confirmee_j2';

  const showDesiste = !isConfirmeeJ2 && !isTerminal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-zinc-900">Mode Appel</h1>
        <span className="inline-flex items-center rounded-full bg-zinc-900 text-white text-sm font-semibold px-3 py-1">
          {totalInQueue} à appeler
        </span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
        {/* Status badge */}
        <div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Name */}
        <p className="text-2xl font-bold text-zinc-900">
          {firstName} {lastName}
        </p>

        {/* Phone — tap to call */}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="block text-3xl font-bold text-zinc-900 hover:text-blue-700 transition-colors"
          >
            {phone}
          </a>
        ) : (
          <p className="text-3xl font-bold text-zinc-400">—</p>
        )}

        {/* Email */}
        <p className="text-sm text-zinc-600">{email}</p>

        {/* City + enrolled date */}
        <p className="text-xs text-zinc-400">
          {city ? `${city} · ` : ''}Inscrite le {enrolledDate}
        </p>

        <hr className="border-zinc-100" />

        {/* Action buttons */}
        <div className="space-y-3">
          {status === 'inscrit' && (
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => run(() => markContactee(enrollmentId))}
            >
              {isPending ? <Loader2 className="animate-spin" /> : 'Marquer contactée'}
            </Button>
          )}

          {status === 'contactee' && j7SentAt === null && (
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => run(() => sendManualReminder(enrollmentId))}
            >
              {isPending ? <Loader2 className="animate-spin" /> : 'Envoyer message J-7'}
            </Button>
          )}

          {status === 'contactee' && j7SentAt !== null && (
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={isPending}
                onClick={() => run(() => markConfirmeeJ7(enrollmentId))}
              >
                {isPending ? <Loader2 className="animate-spin" /> : 'Confirmée J-7'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={isPending}
                onClick={() => router.refresh()}
              >
                Pas de réponse — Passer
              </Button>
            </div>
          )}

          {status === 'confirmee_j7' && j2SentAt === null && (
            <Button
              className="w-full"
              disabled={isPending}
              onClick={() => run(() => sendJ2Reminder(enrollmentId))}
            >
              {isPending ? <Loader2 className="animate-spin" /> : 'Envoyer message J-2'}
            </Button>
          )}

          {status === 'confirmee_j7' && j2SentAt !== null && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isPending}
              onClick={() => run(() => markConfirmeeJ2(enrollmentId))}
            >
              {isPending ? <Loader2 className="animate-spin" /> : 'Confirmée J-2'}
            </Button>
          )}

          {isConfirmeeJ2 && (
            <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm text-violet-700 font-medium">
              Confirmée — sera présente le jour J
            </div>
          )}

          {isTerminal && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">Aucune action requise</p>
              <Link
                href="/admin/participants"
                className="block text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Voir toutes les participantes
              </Link>
            </div>
          )}

          {showDesiste && (
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isPending}
              onClick={() => run(() => markDesistement(enrollmentId))}
            >
              {isPending ? <Loader2 className="animate-spin" /> : 'Désiste'}
            </Button>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      {/* Footer */}
      <div>
        <Link
          href="/admin/participants"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Voir toutes les participantes
        </Link>
      </div>
    </div>
  );
}
