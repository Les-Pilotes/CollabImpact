/**
 * Test factories. Each function returns a plain object shaped like the
 * Prisma model output, with monotonically increasing IDs so the same fixture
 * file can produce dozens of distinct rows in a row without collisions.
 *
 * Pass partial overrides to customize any field; the spread is shallow so
 * nested objects (`user`, `event`) can be replaced wholesale.
 *
 * These are NOT written to the DB — they're for `mockResolvedValue`.
 */
import type {
  Admin,
  AdminRole,
  DroitsImageStatus,
  Enrollment,
  EnrollmentMode,
  EnrollmentStatus,
  Event,
  EventType,
  Feedback,
  ImmersionStatus,
  Notification,
  User,
} from "@prisma/client";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString().padStart(4, "0")}`;
}

/** Re-seed the ID counter — useful for tests that snapshot IDs. */
export function resetFactoryCounter(value = 0): void {
  counter = value;
}

const ORG_ID = "org-test-1";

export function makeAdmin(overrides: Partial<Admin> = {}): Admin {
  const id = overrides.id ?? nextId("admin");
  return {
    id,
    organisationId: ORG_ID,
    supabaseAuthId: null,
    email: `${id}@les-pilotes.fr`,
    firstName: "Ada",
    lastName: "Lovelace",
    role: "ADMIN" as AdminRole,
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  } as Admin;
}

export function makeUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId("user");
  return {
    id,
    organisationId: ORG_ID,
    supabaseAuthId: null,
    firstName: "Yasmine",
    lastName: "Benali",
    email: `${id}@example.test`,
    phone: null,
    birthDate: null,
    gender: null,
    city: null,
    source: null,
    reliabilityScore: 0,
    emailVerified: false,
    niveauScolaire: null,
    niveauScolaireAutre: null,
    etablissement: null,
    region: null,
    projetPro: null,
    motivation: [],
    motivationDetail: null,
    commentConnu: null,
    orientationUpdatedAt: null,
    deletedAt: null,
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  } as User;
}

export function makeEvent(overrides: Partial<Event> = {}): Event {
  const id = overrides.id ?? nextId("event");
  return {
    id,
    organisationId: ORG_ID,
    type: "FEMININ" as EventType,
    name: "Atelier découverte tech",
    status: "publie" as ImmersionStatus,
    address: "10 rue de Paris, 75001 Paris",
    date: new Date("2026-06-15T14:00:00Z"),
    endTime: null,
    capacity: 20,
    description: null,
    replyToEmail: null,
    emailSignature: null,
    deletedAt: null,
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  } as Event;
}

export function makeEnrollment(
  overrides: Partial<Enrollment> & {
    user?: Partial<User>;
    event?: Partial<Event>;
  } = {},
): Enrollment & { user?: User; event?: Event } {
  const id = overrides.id ?? nextId("enrol");
  const { user: userOverride, event: eventOverride, ...rest } = overrides;
  const base: Enrollment = {
    id,
    organisationId: ORG_ID,
    eventId: eventOverride?.id ?? "event-test-1",
    userId: userOverride?.id ?? "user-test-1",
    status: "inscrit" as EnrollmentStatus,
    mode: "individuel" as EnrollmentMode,
    referentName: null,
    source: null,
    attendedAt: null,
    noShow: false,
    j7SentAt: null,
    j2SentAt: null,
    feedbackToken: null,
    feedbackSentAt: null,
    droitsImageStatus: "ok_or_majeure" as DroitsImageStatus,
    droitsImageSignedAt: null,
    droitsImageSignature: null,
    regime: [],
    accessibilite: null,
    accompagnateur: false,
    commentaire: null,
    internalNote: null,
    enrolledAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T10:00:00Z"),
    deletedAt: null,
    ...rest,
  } as Enrollment;

  const result: Enrollment & { user?: User; event?: Event } = base;
  if (userOverride) result.user = makeUser({ id: base.userId, ...userOverride });
  if (eventOverride) result.event = makeEvent({ id: base.eventId, ...eventOverride });
  return result;
}

export function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  const id = overrides.id ?? nextId("fb");
  return {
    id,
    enrollmentId: "enrol-test-1",
    overallRating: 5,
    orgRating: 4,
    favoriteMoment: null,
    changedVision: false,
    improvements: null,
    verbatim: null,
    submittedAt: new Date("2026-06-16T18:00:00Z"),
    ...overrides,
  } as Feedback;
}

export function makeNotification(
  overrides: Partial<Notification> = {},
): Notification {
  const id = overrides.id ?? nextId("notif");
  return {
    id,
    organisationId: ORG_ID,
    type: "enrollment.created",
    title: "Nouvelle inscription",
    body: null,
    eventId: null,
    enrollmentId: null,
    metadata: null,
    createdAt: new Date("2026-06-01T10:00:00Z"),
    ...overrides,
  } as Notification;
}
