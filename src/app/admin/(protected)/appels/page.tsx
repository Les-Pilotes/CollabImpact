import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { AppelView } from './AppelView';

export const metadata = { title: 'Mode Appel — Admin' };

const IMMERSION_ID = 'seed-event-cite-audacieuse';

export default async function AppelsPage() {
  await requireAdmin();

  // Priority 1: inscrit, ordered by enrolledAt asc
  const p1 = await prisma.enrollment.findFirst({
    where: { immersionId: IMMERSION_ID, deletedAt: null, status: 'inscrit' },
    include: { user: true, immersion: true },
    orderBy: { enrolledAt: 'asc' },
  });

  // Priority 2: contactee + j7SentAt null
  const p2 = p1
    ? null
    : await prisma.enrollment.findFirst({
        where: {
          immersionId: IMMERSION_ID,
          deletedAt: null,
          status: 'contactee',
          j7SentAt: null,
        },
        include: { user: true, immersion: true },
        orderBy: { enrolledAt: 'asc' },
      });

  // Priority 3: contactee + j7SentAt set
  const p3 =
    p1 || p2
      ? null
      : await prisma.enrollment.findFirst({
          where: {
            immersionId: IMMERSION_ID,
            deletedAt: null,
            status: 'contactee',
            j7SentAt: { not: null },
          },
          include: { user: true, immersion: true },
          orderBy: { j7SentAt: 'asc' },
        });

  // Priority 4: confirmee_j7 + j2SentAt null
  const p4 =
    p1 || p2 || p3
      ? null
      : await prisma.enrollment.findFirst({
          where: {
            immersionId: IMMERSION_ID,
            deletedAt: null,
            status: 'confirmee_j7',
            j2SentAt: null,
          },
          include: { user: true, immersion: true },
          orderBy: { enrolledAt: 'asc' },
        });

  const next = p1 ?? p2 ?? p3 ?? p4;

  // Count totals across all 4 buckets
  const [c1, c2, c3, c4] = await Promise.all([
    prisma.enrollment.count({
      where: { immersionId: IMMERSION_ID, deletedAt: null, status: 'inscrit' },
    }),
    prisma.enrollment.count({
      where: {
        immersionId: IMMERSION_ID,
        deletedAt: null,
        status: 'contactee',
        j7SentAt: null,
      },
    }),
    prisma.enrollment.count({
      where: {
        immersionId: IMMERSION_ID,
        deletedAt: null,
        status: 'contactee',
        j7SentAt: { not: null },
      },
    }),
    prisma.enrollment.count({
      where: {
        immersionId: IMMERSION_ID,
        deletedAt: null,
        status: 'confirmee_j7',
        j2SentAt: null,
      },
    }),
  ]);

  const totalInQueue = c1 + c2 + c3 + c4;

  if (!next) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8 px-4">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <p className="text-2xl font-bold text-zinc-900 mb-2">Rien a faire</p>
          <p className="text-zinc-500 text-sm mb-6">
            Toutes les participantes ont été contactées ou confirmées.
          </p>
          <Link
            href="/admin/participants"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Voir toutes les participantes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8 px-4">
      <AppelView
        enrollmentId={next.id}
        status={next.status}
        j7SentAt={next.j7SentAt ? next.j7SentAt.toISOString() : null}
        j2SentAt={next.j2SentAt ? next.j2SentAt.toISOString() : null}
        feedbackSentAt={next.feedbackSentAt ? next.feedbackSentAt.toISOString() : null}
        firstName={next.user.firstName}
        lastName={next.user.lastName}
        email={next.user.email}
        phone={next.user.phone ?? null}
        city={next.user.city ?? null}
        enrolledAt={next.enrolledAt.toISOString()}
        totalInQueue={totalInQueue}
        immersionName={next.immersion.name}
      />
    </div>
  );
}
