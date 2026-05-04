'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@prisma/client';
import { toggleTask, updateTask, deleteTask } from './actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  adminEmail: string;
}

export function TaskCard({ task, adminEmail }: TaskCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDueAt, setEditDueAt] = useState(
    task.dueAt ? task.dueAt.toISOString().split('T')[0] : ''
  );

  const isDone = !!task.doneAt;
  const isOverdue =
    task.dueAt && !isDone && new Date(task.dueAt) < new Date();

  function handleToggle() {
    startTransition(async () => {
      await toggleTask(task.id, adminEmail);
      router.refresh();
    });
  }

  function handleSaveEdit() {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateTask(task.id, {
        title: editTitle.trim(),
        dueAt: editDueAt ? new Date(editDueAt).toISOString() : null,
      });
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm('Supprimer cette tâche ?')) return;
    startTransition(async () => {
      await deleteTask(task.id);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-3 bg-white rounded-lg border border-zinc-100 shadow-sm group',
        isPending && 'opacity-60'
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="mt-0.5 shrink-0"
        aria-label={isDone ? 'Marquer comme non fait' : 'Marquer comme fait'}
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <Input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              disabled={isPending}
              className="h-7 text-sm"
            />
            <Input
              type="date"
              value={editDueAt}
              onChange={(e) => setEditDueAt(e.target.value)}
              disabled={isPending}
              className="h-7 text-sm"
            />
            <div className="flex gap-1 mt-1">
              <Button
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleSaveEdit}
                disabled={isPending || !editTitle.trim()}
              >
                <Check className="h-3 w-3 mr-1" />
                Enregistrer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(task.title);
                  setEditDueAt(task.dueAt ? task.dueAt.toISOString().split('T')[0] : '');
                }}
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p
              className={cn(
                'text-sm leading-snug break-words',
                isDone && 'line-through text-zinc-400'
              )}
            >
              {task.title}
            </p>
            {task.dueAt && (
              <p
                className={cn(
                  'text-xs mt-0.5',
                  isOverdue ? 'text-red-500 font-medium' : 'text-zinc-400'
                )}
              >
                {isOverdue ? '⚠ ' : ''}
                {new Date(task.dueAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </p>
            )}
          </>
        )}
      </div>

      {!isEditing && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsEditing(true)}
            disabled={isPending}
            aria-label="Modifier"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-red-500"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
