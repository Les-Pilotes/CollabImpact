import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EnrollmentStatus } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InlineActions } from './InlineActions';

export const metadata = { title: 'Participantes, admin' };

const IMMERSION_ID = 'seed-event-cite-audacieuse';

type Group = {
  key: string;
  label: string;
  statuses: EnrollmentStatus[];
};

const GROUPS: Group[] = [
  { key: 'a_contacter', label: 'À contacter', statuses: ['inscrit'] },
  { key: 'en_suivi', label: 'En suivi', statuses: ['contactee', 'confirmee_j7'] },
  { key: 'confirmees', label: 'Confirmées', statuses: ['confirmee_j2'] },
  { key: 'presentes', label: 'Présentes', statuses: ['presente'] },
  { key: 'cloturees', label: 'Clôturées', statuses: ['absente', 'desistement', 'feedback_recu'] },
];

type Enrollment = {
  id: string;
  status: EnrollmentStatus;
  j7SentAt: Date | null;
  j2SentAt: Date | null;
  feedbackSentAt: Date | null;
  enrolledAt: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
};

function EnrollmentRow({ enrollment, isEventDay }: { enrollment: Enrollment; isEventDay: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 text-sm truncate">
          {enrollment.user.firstName} {enrollment.user.lastName}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {enrollment.user.phone ?? enrollment.user.email}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
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
          className="text-xs font-medium text-zinc-400 hover:text-zinc-700 hover:underline whitespace-nowrap"
        >
          Voir
        </Link>
      </div>
    </div>
  );
}

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const groupFilter = params.group as string | undefined;
  const activeGroup = GROUPS.find((g) => g.key === groupFilter);

  const allEnrollments = await prisma.enrollment.findMany({
    where: { immersionId: IMMERSION_ID, deletedAt: null },
    select: { status: true },
  });

  const countByStatus = allEnrollments.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  function countGroup(g: Group) {
    return g.statuses.reduce((sum, s) => sum + (countByStatus[s] ?? 0), 0);
  }

  const immersion = await prisma.immersion.findUnique({
    where: { id: IMMERSION_ID },
    select: { date: true },
  });
  const eventDate = immersion ? new Date(immersion.date) : new Date(0);
  const diffDays = Math.abs(Date.now() - eventDate.getTime()) / 86_400_000;
  const isEventDay = diffDays <= 1.5;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: IMMERSION_ID,
      deletedAt: null,
      ...(activeGroup ? { status: { in: activeGroup.statuses } } : {}),
    },
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
    orderBy: { enrolledAt: 'asc' },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Participantes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {allEnrollments.length} inscription{allEnrollments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/participants/emargement">Émargement</Link>
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/participants"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !groupFilter ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Toutes
          <span className="text-xs opacity-70">{allEnrollments.length}</span>
        </Link>
        {GROUPS.map((group) => {
          const count = countGroup(group);
          if (count === 0) return null;
          return (
            <Link
              key={group.key}
              href={`/admin/participants?group=${group.key}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                groupFilter === group.key
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {group.label}
              <span className="text-xs opacity-70">{count}</span>
            </Link>
          );
        })}
      </div>

      {/* Grouped view (Toutes) */}
      {!groupFilter ? (
        <div className="space-y-4">
          {GROUPS.map((group) => {
            const rows = enrollments.filter((e) => group.statuses.includes(e.status));
            if (rows.length === 0) return null;
            return (
              <div key={group.key} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-700">{group.label}</span>
                  <span className="text-xs text-zinc-400 font-medium tabular-nums">{rows.length}</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {rows.map((enrollment) => (
                    <EnrollmentRow key={enrollment.id} enrollment={enrollment} isEventDay={isEventDay} />
                  ))}
                </div>
              </div>
            );
          })}
          {enrollments.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
              <p className="text-sm text-zinc-400">Aucune participante pour l&apos;instant.</p>
            </div>
          )}
        </div>
      ) : (
        /* Filtered flat list */
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-zinc-400">Aucune participante dans ce groupe.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {enrollments.map((enrollment) => (
                <EnrollmentRow key={enrollment.id} enrollment={enrollment} isEventDay={isEventDay} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
