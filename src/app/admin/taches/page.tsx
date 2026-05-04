import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TaskPhase } from '@prisma/client';
import { TaskColumn } from './TaskColumn';

const EVENT_ID = 'seed-event-cite-audacieuse';

const PHASES: TaskPhase[] = ['PREPARATION', 'WORKSHOP', 'POST_EVENT'];


export default async function TachesPage() {
  const { admin } = await requireAdmin();

  const tasks = await prisma.task.findMany({
    where: { eventId: EVENT_ID },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  const grouped = {
    PREPARATION: tasks.filter((t) => t.phase === 'PREPARATION'),
    WORKSHOP: tasks.filter((t) => t.phase === 'WORKSHOP'),
    POST_EVENT: tasks.filter((t) => t.phase === 'POST_EVENT'),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">
        Suivi des tâches
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PHASES.map((phase) => (
          <div
            key={phase}
            className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100"
          >
            <TaskColumn
              tasks={grouped[phase]}
              phase={phase}
              adminEmail={admin.email}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
