import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EnrollmentStatus } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InlineActions } from './InlineActions';

export const metadata = { title: 'Participantes — Admin' };

const IMMERSION_ID = 'seed-event-cite-audacieuse';

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

const STATUS_BADGE_CLASSES: Record<EnrollmentStatus, string> = {
  inscrit: 'bg-zinc-100 text-zinc-700',
  contactee: 'bg-blue-100 text-blue-700',
  confirmee_j7: 'bg-indigo-100 text-indigo-700',
  confirmee_j2: 'bg-violet-100 text-violet-700',
  presente: 'bg-green-100 text-green-700',
  absente: 'bg-red-100 text-red-700',
  desistement: 'bg-orange-100 text-orange-700',
  feedback_recu: 'bg-emerald-100 text-emerald-700',
};

const ALL_STATUSES = Object.values(EnrollmentStatus);

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = params.status as EnrollmentStatus | undefined;

  // Get all enrollments for counts (no filter)
  const allEnrollments = await prisma.enrollment.findMany({
    where: { immersionId: IMMERSION_ID, deletedAt: null },
    select: { status: true },
  });

  const countByStatus = allEnrollments.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  const immersion = await prisma.immersion.findUnique({
    where: { id: IMMERSION_ID },
    select: { date: true },
  });

  const eventDate = immersion ? new Date(immersion.date) : new Date(0);
  const now = new Date();
  const diffDays = Math.abs(now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
  const isEventDay = diffDays <= 1.5;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: IMMERSION_ID,
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter as EnrollmentStatus } : {}),
    },
    include: { user: true, feedback: { select: { submittedAt: true } } },
    orderBy: { enrolledAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Participantes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {allEnrollments.length} inscription{allEnrollments.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/participants/emargement">Mode émargement</Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/participants"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !statusFilter
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Toutes
          <span className="text-xs bg-white/20 rounded-full px-1.5 py-0.5">
            {allEnrollments.length}
          </span>
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/participants?status=${s}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {STATUS_LABELS[s]}
            {countByStatus[s] !== undefined && (
              <span className="text-xs bg-white/20 rounded-full px-1.5 py-0.5">
                {countByStatus[s]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        {enrollments.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <p className="text-sm">Aucune participante{statusFilter ? ` avec ce statut` : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Nom complet</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Téléphone</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Source</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Inscrite le</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600 min-w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {enrollment.user.firstName} {enrollment.user.lastName}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{enrollment.user.email}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {enrollment.user.phone ?? <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[enrollment.status]}`}
                      >
                        {STATUS_LABELS[enrollment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {enrollment.source ?? enrollment.user.source ?? (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {enrollment.enrolledAt.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <InlineActions
                          enrollmentId={enrollment.id}
                          status={enrollment.status}
                          j7SentAt={enrollment.j7SentAt}
                          j2SentAt={enrollment.j2SentAt}
                          isEventDay={isEventDay}
                          feedbackSentAt={enrollment.feedbackSentAt}
                        />
                        <Link
                          href={`/admin/participants/${enrollment.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                        >
                          Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
