'use server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * Toggle task done/undone.
 * If currently done → set doneAt=null, doneByEmail=null
 * If not done → set doneAt=new Date(), doneByEmail
 */
export async function toggleTask(
  taskId: string,
  doneByEmail: string
): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { doneAt: true },
    });

    if (!task) return { ok: false };

    if (task.doneAt) {
      // Currently done → undo
      await prisma.task.update({
        where: { id: taskId },
        data: { doneAt: null, doneByEmail: null },
      });
    } else {
      // Currently undone → mark done
      await prisma.task.update({
        where: { id: taskId },
        data: { doneAt: new Date(), doneByEmail },
      });
    }

    return { ok: true };
  } catch (err) {
    console.error('[toggleTask]', err);
    return { ok: false };
  }
}

/**
 * Create a new task
 */
export async function createTask(data: {
  eventId: string;
  phase: 'PREPARATION' | 'WORKSHOP' | 'POST_EVENT';
  title: string;
  description?: string;
  dueAt?: string; // ISO string
}): Promise<{ ok: boolean; task?: { id: string } }> {
  await requireAdmin();

  try {
    const task = await prisma.task.create({
      data: {
        eventId: data.eventId,
        phase: data.phase,
        title: data.title,
        description: data.description,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      },
    });

    return { ok: true, task: { id: task.id } };
  } catch (err) {
    console.error('[createTask]', err);
    return { ok: false };
  }
}

/**
 * Update task fields
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    dueAt?: string | null;
  }
): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.dueAt !== undefined && {
          dueAt: data.dueAt ? new Date(data.dueAt) : null,
        }),
      },
    });

    return { ok: true };
  } catch (err) {
    console.error('[updateTask]', err);
    return { ok: false };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<{ ok: boolean }> {
  await requireAdmin();

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    return { ok: true };
  } catch (err) {
    console.error('[deleteTask]', err);
    return { ok: false };
  }
}
