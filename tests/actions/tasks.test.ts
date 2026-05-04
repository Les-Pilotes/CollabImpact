import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted to top — must not reference variables declared outside factory
vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    admin: { id: 'admin-1', email: 'admin@test.com' },
    user: { id: 'user-1' },
  }),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    task: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn(),
      delete: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Import after vi.mock declarations
import { prisma } from '@/lib/db';
import {
  toggleTask,
  createTask,
  deleteTask,
} from '@/app/admin/(protected)/taches/actions';

describe('tasks server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.task.update).mockResolvedValue({} as never);
    vi.mocked(prisma.task.delete).mockResolvedValue({} as never);
  });

  it('toggleTask on undone task calls prisma.task.update with doneAt = expect.any(Date)', async () => {
    // Mock task with doneAt = null (not done)
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      id: 'task-1',
      doneAt: null,
    } as never);

    const result = await toggleTask('task-1', 'admin@test.com');

    expect(result).toEqual({ ok: true });
    expect(prisma.task.update).toHaveBeenCalledOnce();
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        doneAt: expect.any(Date),
        doneByEmail: 'admin@test.com',
      },
    });
  });

  it('toggleTask on done task calls prisma.task.update with doneAt = null', async () => {
    // Mock task with doneAt set (already done)
    vi.mocked(prisma.task.findUnique).mockResolvedValue({
      id: 'task-1',
      doneAt: new Date('2024-01-01'),
    } as never);

    const result = await toggleTask('task-1', 'admin@test.com');

    expect(result).toEqual({ ok: true });
    expect(prisma.task.update).toHaveBeenCalledOnce();
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        doneAt: null,
        doneByEmail: null,
      },
    });
  });

  it('createTask calls prisma.task.create with correct fields', async () => {
    const mockTask = { id: 'new-task-1' };
    vi.mocked(prisma.task.create).mockResolvedValue(mockTask as never);

    const result = await createTask({
      eventId: 'seed-event-cite-audacieuse',
      phase: 'PREPARATION',
      title: 'Préparer les badges',
      description: 'Imprimer et plastifier',
      dueAt: '2024-06-01T00:00:00.000Z',
    });

    expect(result).toEqual({ ok: true, task: { id: 'new-task-1' } });
    expect(prisma.task.create).toHaveBeenCalledOnce();
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: {
        eventId: 'seed-event-cite-audacieuse',
        phase: 'PREPARATION',
        title: 'Préparer les badges',
        description: 'Imprimer et plastifier',
        dueAt: expect.any(Date),
      },
    });
  });

  it('deleteTask calls prisma.task.delete with correct id', async () => {
    const result = await deleteTask('task-to-delete');

    expect(result).toEqual({ ok: true });
    expect(prisma.task.delete).toHaveBeenCalledOnce();
    expect(prisma.task.delete).toHaveBeenCalledWith({
      where: { id: 'task-to-delete' },
    });
  });
});
