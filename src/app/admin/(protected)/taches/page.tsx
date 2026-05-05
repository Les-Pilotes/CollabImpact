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
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 mb-8">
        Suivi des tâches
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
        {PHASES.map((phase) => (
          <TaskColumn
            key={phase}
            tasks={grouped[phase]}
            phase={phase}
            adminEmail={admin.email}
          />
        ))}
      </div>
    </div>
  );
}
