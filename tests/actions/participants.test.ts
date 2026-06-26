import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrollmentStatus } from '@prisma/client';

// vi.mock is hoisted to top — must not reference variables declared outside factory
vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    admin: { id: 'admin-1', email: 'admin@test.com' },
    user: { id: 'user-1' },
  }),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    enrollment: {
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findUnique: vi.fn(),
    },
  },
  currentOrgId: vi.fn().mockReturnValue('seed-org-lespilotes'),
}));

vi.mock('@/lib/email/client', () => ({
  sendEmail: vi.fn().mockResolvedValue({ sent: false, reason: 'no-api-key' }),
}));

vi.mock('@/lib/tokens', () => ({
  createFeedbackToken: vi.fn().mockReturnValue('mock-token-123'),
}));

// Import after vi.mock declarations
import { prisma } from '@/lib/db';
import {
  updateEnrollmentStatus,
  markAttendance,
  bulkUpdateStatus,
  sendFeedbackInvite,
} from '@/app/admin/(protected)/events/[eventId]/inscrites/actions';

describe('participants server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply default mock implementations after clearAllMocks
    vi.mocked(prisma.enrollment.update).mockResolvedValue({} as never);
    vi.mocked(prisma.enrollment.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.enrollment.findUnique).mockResolvedValue(null as never);
  });

  it('updateEnrollmentStatus calls prisma.enrollment.update with correct args', async () => {
    const result = await updateEnrollmentStatus('enrollment-1', EnrollmentStatus.presente);

    expect(prisma.enrollment.update).toHaveBeenCalledOnce();
    expect(prisma.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'enrollment-1' },
      data: { status: EnrollmentStatus.presente },
    });
    expect(result).toEqual({ ok: true });
  });

  it('markAttendance(id, true) sets status presente + attendedAt + noShow=false', async () => {
    const result = await markAttendance('enrollment-2', true);

    expect(prisma.enrollment.update).toHaveBeenCalledOnce();
    expect(prisma.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'enrollment-2' },
      data: {
        status: EnrollmentStatus.presente,
        attendedAt: expect.any(Date),
        noShow: false,
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it('markAttendance(id, false) sets status absente + noShow=true', async () => {
    const result = await markAttendance('enrollment-3', false);

    expect(prisma.enrollment.update).toHaveBeenCalledOnce();
    expect(prisma.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'enrollment-3' },
      data: {
        status: EnrollmentStatus.absente,
        noShow: true,
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it('bulkUpdateStatus(presente) updates many with attendedAt + noShow=false', async () => {
    vi.mocked(prisma.enrollment.updateMany).mockResolvedValueOnce({ count: 3 } as never);

    const result = await bulkUpdateStatus(['a', 'b', 'c'], EnrollmentStatus.presente);

    expect(prisma.enrollment.updateMany).toHaveBeenCalledOnce();
    expect(prisma.enrollment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b', 'c'] } },
      data: { status: EnrollmentStatus.presente, attendedAt: expect.any(Date), noShow: false },
    });
    expect(result).toEqual({ ok: true, count: 3 });
  });

  it('bulkUpdateStatus(absente) sets noShow=true (no attendedAt)', async () => {
    vi.mocked(prisma.enrollment.updateMany).mockResolvedValueOnce({ count: 2 } as never);

    const result = await bulkUpdateStatus(['a', 'b'], EnrollmentStatus.absente);

    expect(prisma.enrollment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] } },
      data: { status: EnrollmentStatus.absente, noShow: true },
    });
    expect(result).toEqual({ ok: true, count: 2 });
  });

  it('bulkUpdateStatus(confirmee_j2) sets only the status, no attendance side-effects', async () => {
    vi.mocked(prisma.enrollment.updateMany).mockResolvedValueOnce({ count: 1 } as never);

    await bulkUpdateStatus(['a'], EnrollmentStatus.confirmee_j2);

    expect(prisma.enrollment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a'] } },
      data: { status: EnrollmentStatus.confirmee_j2 },
    });
  });

  it('bulkUpdateStatus([]) short-circuits without touching the DB', async () => {
    const result = await bulkUpdateStatus([], EnrollmentStatus.presente);

    expect(prisma.enrollment.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, count: 0 });
  });

  it('sendFeedbackInvite calls prisma.enrollment.update with feedbackToken and feedbackSentAt', async () => {
    // Set up mock enrollment data for findUnique
    vi.mocked(prisma.enrollment.findUnique).mockResolvedValueOnce({
      id: 'enrollment-4',
      status: EnrollmentStatus.presente,
      feedbackToken: null,
      feedbackSentAt: null,
      user: {
        id: 'user-1',
        email: 'participante@test.com',
        firstName: 'Marie',
        lastName: 'Dupont',
      },
      event: {
        id: 'seed-event-cite-audacieuse',
        name: 'Cité Audacieuse',
        date: new Date('2026-05-10'),
      },
    } as never);

    const result = await sendFeedbackInvite('enrollment-4');

    expect(prisma.enrollment.update).toHaveBeenCalledOnce();
    expect(prisma.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'enrollment-4' },
      data: {
        feedbackToken: 'mock-token-123',
        feedbackSentAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ ok: true });
  });
});
