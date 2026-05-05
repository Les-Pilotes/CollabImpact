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
  inscrit: 'text-stone-500',
  contactee: 'text-stone-700',
  confirmee_j7: 'text-stone-700',
  confirmee_j2: 'text-emerald-700',
  presente: 'text-emerald-700',
  absente: 'text-red-700',
  desistement: 'text-red-700',
  feedback_recu: 'text-stone-700',
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
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Mode appel</h1>
        <span className="text-xs uppercase tracking-[0.18em] text-stone-500 tabular-nums">
          {totalInQueue} à appeler
        </span>
      </header>

      {/* Contact, no surrounding card */}
      <div className="space-y-3">
        <p className={`text-xs uppercase tracking-[0.18em] font-medium ${badgeClass}`}>
          {badgeLabel}
        </p>

        <p className="text-3xl font-semibold tracking-tight text-stone-900">
          {firstName} {lastName}
        </p>

        {phone ? (
          <a
            href={`tel:${phone}`}
            className="block text-2xl font-medium tabular-nums text-[var(--brand-orange)] hover:underline"
          >
            {phone}
          </a>
        ) : (
          <p className="text-base text-stone-500">Pas de téléphone</p>
        )}

        <p className="text-sm text-stone-600">{email}</p>

        <p className="text-xs text-stone-500">
          {city ? `${city} · ` : ''}Inscrite le {enrolledDate}
        </p>
      </div>

      <div className="h-px bg-stone-200" />

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
                className="flex-1"
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
                Pas de réponse, passer
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
              className="w-full"
              disabled={isPending}
              onClick={() => run(() => markConfirmeeJ2(enrollmentId))}
            >
              {isPending ? <Loader2 className="animate-spin" /> : 'Confirmée J-2'}
            </Button>
          )}

          {isConfirmeeJ2 && (
            <p className="text-sm text-emerald-700 font-medium">
              Confirmée, sera présente le jour J.
            </p>
          )}

          {isTerminal && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">Aucune action requise.</p>
              <Link
                href="/admin/participants"
                className="block text-sm font-medium text-[var(--brand-orange)] hover:underline"
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

      {/* Footer */}
      <div>
        <Link
          href="/admin/participants"
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          {"<- Voir toutes les participantes"}
        </Link>
      </div>
    </div>
  );
}
