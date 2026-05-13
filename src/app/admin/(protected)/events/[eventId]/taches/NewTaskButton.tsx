'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TaskPhase } from '@prisma/client';
import { createTask } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewTaskButtonProps {
  phase: TaskPhase;
  eventId: string;
}

export function NewTaskButton({ phase, eventId }: NewTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createTask({
        eventId,
        phase,
        title: title.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      setTitle('');
      setDueAt('');
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-zinc-500 hover:text-zinc-700 border border-dashed border-zinc-200 hover:border-zinc-400 mt-2"
        onClick={() => setOpen(true)}
      >
        ＋ Nouvelle tâche
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 p-2 bg-white rounded-lg border border-zinc-200">
      <Input
        autoFocus
        placeholder="Titre de la tâche"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={isPending}
      />
      <Input
        type="date"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
          {isPending ? 'Ajout…' : 'Ajouter'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setTitle('');
            setDueAt('');
          }}
          disabled={isPending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
