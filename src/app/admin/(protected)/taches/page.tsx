import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TaskPhase } from '@prisma/client';
import { TaskColumn } from './TaskColumn';
import PageHeader from '../PageHeader';

const EVENT_ID = 'seed-event-cite-audacieuse';

const PHASES: TaskPhase[] = ['PREPARATION', 'WORKSHOP', 'POST_EVENT'];


export const metadata = { title: "Tâches" };

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

  const done = tasks.filter((t) => t.doneAt).length;

  return (
    <div className="flex flex-col h-full -m-4 md:-m-10 overflow-hidden">
      <PageHeader
        title="Tâches"
        subtitle={`${done} / ${tasks.length} complétées`}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8 max-w-6xl">
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
    </div>
  );
}
