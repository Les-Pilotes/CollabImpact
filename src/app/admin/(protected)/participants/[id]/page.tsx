import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticipantActions } from './ParticipantActions';

export const metadata = { title: 'Participante — Admin' };

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

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id: enrollmentId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: true,
      immersion: true,
      feedback: true,
    },
  });

  if (!enrollment) {
    notFound();
  }

  const { user, immersion, feedback } = enrollment;

  // Check if event is today ± 1 day
  const eventDate = new Date(immersion.date);
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - eventDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const isEventDay = diffDays <= 1;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back link */}
      <Link
        href="/admin/participants"
        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        ← Retour aux participantes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold text-zinc-900">
          {user.firstName} {user.lastName}
        </h1>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[enrollment.status]}`}
        >
          {STATUS_LABELS[enrollment.status]}
        </span>
      </div>

      {/* Participant info card */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-zinc-500">Email</dt>
              <dd className="text-zinc-900 mt-0.5">{user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Téléphone</dt>
              <dd className="text-zinc-900 mt-0.5">{user.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Ville</dt>
              <dd className="text-zinc-900 mt-0.5">{user.city ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Date de naissance</dt>
              <dd className="text-zinc-900 mt-0.5">
                {user.birthDate
                  ? new Date(user.birthDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Source</dt>
              <dd className="text-zinc-900 mt-0.5">
                {enrollment.source ?? user.source ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Inscrite le</dt>
              <dd className="text-zinc-900 mt-0.5">
                {enrollment.enrolledAt.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
            {enrollment.referentName && (
              <div>
                <dt className="font-medium text-zinc-500">Référent</dt>
                <dd className="text-zinc-900 mt-0.5">{enrollment.referentName}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-zinc-500">Mode d&apos;inscription</dt>
              <dd className="text-zinc-900 mt-0.5">
                {enrollment.mode === 'via_referent' ? 'Via référent' : 'Individuel'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Actions card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantActions
            enrollmentId={enrollment.id}
            currentStatus={enrollment.status}
            j7SentAt={enrollment.j7SentAt}
            j2SentAt={enrollment.j2SentAt}
            feedbackToken={enrollment.feedbackToken}
            feedbackSentAt={enrollment.feedbackSentAt}
            isEventDay={isEventDay}
          />
        </CardContent>
      </Card>

      {/* Feedback card */}
      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback reçu</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex gap-8">
                <div>
                  <dt className="font-medium text-zinc-500">Note globale</dt>
                  <dd className="text-2xl font-bold text-zinc-900 mt-0.5">
                    {feedback.overallRating}/5
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Organisation</dt>
                  <dd className="text-2xl font-bold text-zinc-900 mt-0.5">
                    {feedback.orgRating}/5
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Vision changée</dt>
                  <dd className="text-zinc-900 mt-0.5">
                    {feedback.changedVision ? 'Oui' : 'Non'}
                  </dd>
                </div>
              </div>
              {feedback.verbatim && (
                <div>
                  <dt className="font-medium text-zinc-500 mb-1">Verbatim</dt>
                  <dd className="bg-zinc-50 rounded-xl p-4 text-zinc-700 leading-relaxed italic">
                    &ldquo;{feedback.verbatim}&rdquo;
                  </dd>
                </div>
              )}
              {feedback.favoriteMoment && (
                <div>
                  <dt className="font-medium text-zinc-500">Moment préféré</dt>
                  <dd className="text-zinc-900 mt-0.5">{feedback.favoriteMoment}</dd>
                </div>
              )}
              {feedback.improvements && (
                <div>
                  <dt className="font-medium text-zinc-500">Améliorations suggérées</dt>
                  <dd className="text-zinc-900 mt-0.5">{feedback.improvements}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-zinc-500">Soumis le</dt>
                <dd className="text-zinc-900 mt-0.5">
                  {feedback.submittedAt.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
