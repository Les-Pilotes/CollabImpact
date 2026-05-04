'use client';

import { Task, TaskPhase } from '@prisma/client';
import { TaskCard } from './TaskCard';
import { NewTaskButton } from './NewTaskButton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PHASE_LABELS: Record<TaskPhase, string> = {
  PREPARATION: 'Préparation',
  WORKSHOP: 'Workshop',
  POST_EVENT: 'Post-Event',
};

const EVENT_ID = 'seed-event-cite-audacieuse';

interface TaskColumnProps {
  tasks: Task[];
  phase: TaskPhase;
  adminEmail: string;
}

export function TaskColumn({ tasks, phase, adminEmail }: TaskColumnProps) {
  const doneCount = tasks.filter((t) => !!t.doneAt).length;
  const total = tasks.length;
  const allDone = total > 0 && doneCount === total;

  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-800 text-sm uppercase tracking-wide">
          {PHASE_LABELS[phase]}
        </h2>
        <Badge
          className={cn(
            'text-xs font-medium',
            allDone
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-amber-100 text-amber-700 border-amber-200'
          )}
          variant="outline"
        >
          {doneCount}/{total} faites
        </Badge>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">
            Aucune tâche pour l&apos;instant
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} adminEmail={adminEmail} />
          ))
        )}
      </div>

      {/* Add task */}
      <NewTaskButton phase={phase} eventId={EVENT_ID} />
    </div>
  );
}
