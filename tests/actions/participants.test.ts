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
  sendFeedbackInvite,
} from '@/app/admin/(protected)/participants/actions';

describe('participants server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply default mock implementations after clearAllMocks
    vi.mocked(prisma.enrollment.update).mockResolvedValue({} as never);
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
      immersion: {
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
