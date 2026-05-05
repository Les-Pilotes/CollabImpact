'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createFeedbackToken } from '@/lib/tokens'
import { faker } from '@faker-js/faker/locale/fr'

const ORG_ID = 'seed-org-lespilotes'
const EVENT_ID = 'seed-event-cite-audacieuse'

const SOURCES = ['whatsapp', 'instagram', 'classe', 'conseiller', 'bouche_a_oreille', 'autre']

export async function seedParticipants(count: number = 20): Promise<{ ok: boolean; created: number }> {
  await requireAdmin()

  const statuses = buildStatusDistribution(count)

  let created = 0
  for (let i = 0; i < count; i++) {
    const email = faker.internet.email({ firstName: faker.person.firstName('female'), lastName: faker.person.lastName() }).toLowerCase()
    const status = statuses[i]

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        organisationId: ORG_ID,
        firstName: faker.person.firstName('female'),
        lastName: faker.person.lastName(),
        email,
        phone: faker.phone.number({ style: 'national' }),
        city: faker.location.city(),
        source: faker.helpers.arrayElement(SOURCES),
      },
      update: {},
    })

    const enrollmentData: {
      organisationId: string
      immersionId: string
      userId: string
      status: typeof status
      attendedAt?: Date
      noShow?: boolean
      feedbackToken?: string
      feedbackSentAt?: Date
    } = {
      organisationId: ORG_ID,
      immersionId: EVENT_ID,
      userId: user.id,
      status,
    }

    if (status === 'presente') {
      enrollmentData.attendedAt = new Date()
    } else if (status === 'absente') {
      enrollmentData.noShow = true
    } else if (status === 'feedback_recu') {
      // token will be set after we have the enrollment id — we create first, then update
    }

    const enrollment = await prisma.enrollment.upsert({
      where: { immersionId_userId: { immersionId: EVENT_ID, userId: user.id } },
      create: enrollmentData,
      update: {},
    })

    // For feedback_recu: set token + sentAt if not already set
    if (status === 'feedback_recu' && !enrollment.feedbackToken) {
      const token = createFeedbackToken(enrollment.id)
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          feedbackToken: token,
          feedbackSentAt: new Date(),
        },
      })
    }

    created++
  }

  return { ok: true, created }
}

function buildStatusDistribution(count: number) {
  // 30% inscrit, 20% contactee, 15% confirmee_j7, 15% confirmee_j2,
  // 10% presente, 5% absente, 5% feedback_recu
  const distribution: Array<'inscrit' | 'contactee' | 'confirmee_j7' | 'confirmee_j2' | 'presente' | 'absente' | 'feedback_recu'> = []

  const ratios = [
    { status: 'inscrit' as const, pct: 0.30 },
    { status: 'contactee' as const, pct: 0.20 },
    { status: 'confirmee_j7' as const, pct: 0.15 },
    { status: 'confirmee_j2' as const, pct: 0.15 },
    { status: 'presente' as const, pct: 0.10 },
    { status: 'absente' as const, pct: 0.05 },
    { status: 'feedback_recu' as const, pct: 0.05 },
  ]

  for (const { status, pct } of ratios) {
    const n = Math.round(count * pct)
    for (let i = 0; i < n; i++) distribution.push(status)
  }

  // Fill remaining slots with 'inscrit' if rounding left gaps
  while (distribution.length < count) distribution.push('inscrit')
  // Trim if over
  return distribution.slice(0, count)
}

export async function timeTravel(target: 'j7' | 'j2' | 'jour_j' | 'j_plus_1'): Promise<{ ok: boolean; newDate: string }> {
  await requireAdmin()

  const now = new Date()
  let newDate: Date

  switch (target) {
    case 'j7':
      newDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case 'j2':
      newDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      break
    case 'jour_j':
      newDate = new Date(now)
      break
    case 'j_plus_1':
      newDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      break
  }

  await prisma.immersion.update({
    where: { id: EVENT_ID },
    data: { date: newDate },
  })

  return { ok: true, newDate: newDate.toISOString() }
}

export async function markRandomAttendance(
  presentCount: number = 12,
  absentCount: number = 3,
): Promise<{ ok: boolean; presente: number; absente: number }> {
  await requireAdmin()

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: EVENT_ID,
      status: 'confirmee_j2',
    },
    take: presentCount + absentCount,
  })

  const toPresent = enrollments.slice(0, presentCount)
  const toAbsent = enrollments.slice(presentCount, presentCount + absentCount)

  await Promise.all([
    ...toPresent.map((e) =>
      prisma.enrollment.update({
        where: { id: e.id },
        data: { status: 'presente', attendedAt: new Date() },
      }),
    ),
    ...toAbsent.map((e) =>
      prisma.enrollment.update({
        where: { id: e.id },
        data: { status: 'absente', noShow: true },
      }),
    ),
  ])

  return { ok: true, presente: toPresent.length, absente: toAbsent.length }
}

export async function triggerCron(cron: 'j7' | 'j2' | 'feedback'): Promise<{ ok: boolean; [key: string]: unknown }> {
  await requireAdmin()

  const res = await fetch(`${process.env.APP_URL}/api/cron/${cron}`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  const data = await res.json()
  return { ok: res.ok, ...data }
}

export async function submitFakesFeedbacks(count: number = 8): Promise<{ ok: boolean; submitted: number }> {
  await requireAdmin()

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: EVENT_ID,
      status: 'presente',
    },
    take: count,
    include: { feedback: true },
  })

  let submitted = 0

  for (const enrollment of enrollments) {
    if (enrollment.feedback) continue

    let token = enrollment.feedbackToken
    if (!token) {
      token = createFeedbackToken(enrollment.id)
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { feedbackToken: token, feedbackSentAt: new Date() },
      })
    }

    await prisma.feedback.upsert({
      where: { enrollmentId: enrollment.id },
      create: {
        enrollmentId: enrollment.id,
        overallRating: faker.number.int({ min: 3, max: 5 }),
        orgRating: faker.number.int({ min: 3, max: 5 }),
        changedVision: faker.datatype.boolean(),
        verbatim: faker.lorem.sentence(),
      },
      update: {},
    })

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'feedback_recu' },
    })

    submitted++
  }

  return { ok: true, submitted }
}

export async function resetDevData(): Promise<{ ok: boolean }> {
  await requireAdmin()

  await prisma.$transaction([
    prisma.feedback.deleteMany({
      where: { enrollment: { immersionId: EVENT_ID } },
    }),
    prisma.enrollment.deleteMany({
      where: { immersionId: EVENT_ID },
    }),
    prisma.user.deleteMany({
      where: {
        organisationId: ORG_ID,
        email: { not: process.env.SEED_ADMIN_EMAIL ?? 'admin@lespilotes.fr' },
      },
    }),
    prisma.task.updateMany({
      where: { eventId: EVENT_ID },
      data: { doneAt: null, doneByEmail: null },
    }),
  ])

  return { ok: true }
}

// ─── Demo mode: Marie & single inscrite ─────────────────────────────────────

const MARIE_EMAIL = 'marie.dupont.pilotes@example.com'

export async function seedOneInscrite(): Promise<{ ok: boolean; name: string }> {
  await requireAdmin()

  const firstName = faker.person.firstName('female')
  const lastName = faker.person.lastName()
  const email = faker.internet
    .email({ firstName, lastName })
    .toLowerCase()

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      organisationId: ORG_ID,
      firstName,
      lastName,
      email,
      phone: faker.phone.number({ style: 'national' }),
      city: faker.location.city(),
      source: faker.helpers.arrayElement(SOURCES),
    },
    update: {},
  })

  await prisma.enrollment.upsert({
    where: { immersionId_userId: { immersionId: EVENT_ID, userId: user.id } },
    create: {
      organisationId: ORG_ID,
      immersionId: EVENT_ID,
      userId: user.id,
      status: 'inscrit',
    },
    update: {},
  })

  return { ok: true, name: `${firstName} ${lastName}` }
}

export async function seedOneMarie(): Promise<{ ok: boolean; status: string }> {
  await requireAdmin()

  const user = await prisma.user.upsert({
    where: { email: MARIE_EMAIL },
    create: {
      organisationId: ORG_ID,
      firstName: 'Marie',
      lastName: 'Dupont',
      email: MARIE_EMAIL,
      phone: '06 12 34 56 78',
      city: 'Paris',
      source: 'instagram',
    },
    update: {},
  })

  const existing = await prisma.enrollment.findUnique({
    where: { immersionId_userId: { immersionId: EVENT_ID, userId: user.id } },
  })

  if (existing) {
    return { ok: true, status: existing.status }
  }

  await prisma.enrollment.create({
    data: {
      organisationId: ORG_ID,
      immersionId: EVENT_ID,
      userId: user.id,
      status: 'inscrit',
    },
  })

  return { ok: true, status: 'inscrit' }
}

export async function advanceMarie(): Promise<{ ok: boolean; from: string; to: string; message?: string }> {
  await requireAdmin()

  const marie = await prisma.user.findUnique({ where: { email: MARIE_EMAIL } })
  if (!marie) {
    return { ok: false, from: 'non_trouvee', to: 'non_trouvee', message: "Marie introuvable. Lance \"Créer Marie\" d'abord." }
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { immersionId_userId: { immersionId: EVENT_ID, userId: marie.id } },
  })

  if (!enrollment) {
    return { ok: false, from: 'non_trouvee', to: 'non_trouvee', message: "Marie introuvable. Lance \"Créer Marie\" d'abord." }
  }

  const oldStatus = enrollment.status

  if (oldStatus === 'feedback_recu' || oldStatus === 'absente' || oldStatus === 'desistement') {
    return { ok: false, from: oldStatus, to: oldStatus, message: 'Statut terminal' }
  }

  let newStatus = oldStatus

  if (oldStatus === 'inscrit') {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'contactee' },
    })
    newStatus = 'contactee'
  } else if (oldStatus === 'contactee' && enrollment.j7SentAt === null) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { j7SentAt: new Date() },
    })
    newStatus = 'contactee'
  } else if (oldStatus === 'contactee' && enrollment.j7SentAt !== null) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'confirmee_j7' },
    })
    newStatus = 'confirmee_j7'
  } else if (oldStatus === 'confirmee_j7' && enrollment.j2SentAt === null) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { j2SentAt: new Date() },
    })
    newStatus = 'confirmee_j7'
  } else if (oldStatus === 'confirmee_j7' && enrollment.j2SentAt !== null) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'confirmee_j2' },
    })
    newStatus = 'confirmee_j2'
  } else if (oldStatus === 'confirmee_j2') {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'presente', attendedAt: new Date() },
    })
    newStatus = 'presente'
  } else if (oldStatus === 'presente') {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { feedbackSentAt: new Date() },
    })
    newStatus = 'presente'
  }

  return { ok: true, from: oldStatus, to: newStatus }
}

export async function resetMarie(): Promise<{ ok: boolean }> {
  await requireAdmin()

  const marie = await prisma.user.findUnique({ where: { email: MARIE_EMAIL } })
  if (!marie) return { ok: true }

  const enrollment = await prisma.enrollment.findUnique({
    where: { immersionId_userId: { immersionId: EVENT_ID, userId: marie.id } },
  })
  if (!enrollment) return { ok: true }

  await prisma.$transaction([
    prisma.feedback.deleteMany({ where: { enrollmentId: enrollment.id } }),
    prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'inscrit',
        j7SentAt: null,
        j2SentAt: null,
        attendedAt: null,
        noShow: false,
        feedbackToken: null,
        feedbackSentAt: null,
      },
    }),
  ])

  return { ok: true }
}
