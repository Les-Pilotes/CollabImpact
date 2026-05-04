import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EnrollmentStatus } from '@prisma/client';
import Link from 'next/link';
import { EmargementList } from './EmargementList';

export const metadata = { title: 'Émargement — Admin' };

const IMMERSION_ID = 'seed-event-cite-audacieuse';

const TERMINAL_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.absente,
  EnrollmentStatus.desistement,
];

export default async function EmargementPage() {
  await requireAdmin();

  const immersion = await prisma.immersion.findUnique({
    where: { id: IMMERSION_ID },
    select: { name: true, date: true },
  });

  // Prefer confirmee_j2 enrollments; fallback to all non-terminal
  let enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: IMMERSION_ID,
      deletedAt: null,
      status: EnrollmentStatus.confirmee_j2,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
  });

  // Fallback: if no confirmee_j2, show all non-terminal enrollments
  if (enrollments.length === 0) {
    enrollments = await prisma.enrollment.findMany({
      where: {
        immersionId: IMMERSION_ID,
        deletedAt: null,
        status: { notIn: TERMINAL_STATUSES },
      },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
    });
  }

  const eventDateLabel = immersion
    ? new Date(immersion.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-50 pt-2 pb-3 z-10">
        <div className="flex items-center justify-between mb-1">
          <Link
            href="/admin/participants"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Retour
          </Link>
        </div>
        <h1 className="text-xl font-extrabold text-zinc-900 leading-tight">
          Émargement
        </h1>
        {immersion && (
          <p className="text-sm text-zinc-500 mt-0.5">
            {immersion.name} — {eventDateLabel}
          </p>
        )}
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-sm">Aucune participante à émarger pour le moment.</p>
        </div>
      ) : (
        <EmargementList
          enrollments={enrollments.map((e) => ({
            id: e.id,
            status: e.status,
            user: {
              firstName: e.user.firstName,
              lastName: e.user.lastName,
            },
          }))}
        />
      )}
    </div>
  );
}
