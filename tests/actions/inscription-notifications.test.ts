import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InscriptionInput } from "@/lib/validation/inscription";

vi.mock("@/lib/db", () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), upsert: vi.fn() },
    enrollment: { findUnique: vi.fn(), upsert: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/resolve", () => ({
  resolveEmail: vi.fn().mockReturnValue({
    subject: "Confirmation",
    heading: "Bienvenue",
    body: "Body",
    note: null,
  }),
}));

vi.mock("@/lib/notifications/emit", () => ({
  emitNotification: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { emitNotification } from "@/lib/notifications/emit";
import { submitInscription } from "@/app/inscription/[eventId]/actions";

const ev = vi.mocked(prisma.event);
const usr = vi.mocked(prisma.user);
const en = vi.mocked(prisma.enrollment);
const emit = vi.mocked(emitNotification);

function validInput(overrides: Partial<InscriptionInput> = {}): InscriptionInput {
  return {
    eventId: "ev-1",
    firstName: "Lisa",
    lastName: "Martin",
    email: "lisa@example.com",
    phone: "0612345678",
    birthDate: "2008-05-20",
    gender: "Fille",
    city: "Paris",
    niveauScolaire: "Terminale",
    niveauScolaireAutre: undefined,
    etablissement: "Lycée Voltaire",
    region: "Île-De-France",
    projetPro: "Découvrir l'entrepreneuriat",
    motivation: ["Apprendre de nouvelles compétences"],
    motivationDetail: undefined,
    commentConnu: "Instagram",
    droitsImageAccepted: true,
    droitsImageSignature: "Lisa M.",
    regime: [],
    accessibilite: undefined,
    accompagnateur: false,
    commentaire: undefined,
    ...overrides,
  };
}

function mockEvent(overrides: { capacity?: number } = {}) {
  ev.findUnique.mockResolvedValue({
    id: "ev-1",
    name: "Workshop édition 7",
    date: new Date("2026-09-12T09:30:00Z"),
    address: "Paris",
    capacity: overrides.capacity ?? 30,
    organisationId: "org-1",
    replyToEmail: null,
    emailSignature: null,
    emailConfig: null,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  // No prior global droit-image consent by default — submitInscription's new
  // pre-upsert read returns null and the inscription flows like a first-timer.
  usr.findUnique.mockResolvedValue(null as never);
  usr.upsert.mockResolvedValue({
    id: "user-1",
    firstName: "Lisa",
    lastName: "Martin",
    city: "Paris",
    email: "lisa@example.com",
  } as never);
  en.upsert.mockResolvedValue({ id: "en-1" } as never);
});

describe("submitInscription — notification triggers", () => {
  it("emits enrollment.created when this is a brand-new enrollment", async () => {
    mockEvent();
    en.findUnique.mockResolvedValue(null as never); // no existing enrollment
    en.count.mockResolvedValue(5 as never);

    const result = await submitInscription(validInput());

    expect(result.ok).toBe(true);
    const enrollmentNotif = emit.mock.calls.find(
      (c) => c[0].type === "enrollment.created",
    );
    expect(enrollmentNotif).toBeDefined();
    expect(enrollmentNotif?.[0]).toMatchObject({
      organisationId: "org-1",
      type: "enrollment.created",
      eventId: "ev-1",
      enrollmentId: "en-1",
    });
    expect(enrollmentNotif?.[0].title).toContain("Lisa Martin");
    expect(enrollmentNotif?.[0].title).toContain("Workshop édition 7");
  });

  it("does NOT emit enrollment.created when the enrollment already exists (idempotent re-submit)", async () => {
    mockEvent();
    en.findUnique.mockResolvedValue({ id: "en-existing" } as never);

    const result = await submitInscription(validInput());

    expect(result.ok).toBe(true);
    expect(emit).not.toHaveBeenCalled();
  });

  it("emits event.capacity_reached with dedupePerEvent when the new enrollment fills the event", async () => {
    mockEvent({ capacity: 30 });
    en.findUnique.mockResolvedValue(null as never);
    en.count.mockResolvedValue(30 as never); // capacity reached

    await submitInscription(validInput());

    const capacityNotif = emit.mock.calls.find(
      (c) => c[0].type === "event.capacity_reached",
    );
    expect(capacityNotif).toBeDefined();
    expect(capacityNotif?.[0]).toMatchObject({
      organisationId: "org-1",
      type: "event.capacity_reached",
      eventId: "ev-1",
      dedupePerEvent: true,
    });
    expect(capacityNotif?.[0].body).toContain("30");
  });

  it("does NOT emit event.capacity_reached when capacity is not yet reached", async () => {
    mockEvent({ capacity: 30 });
    en.findUnique.mockResolvedValue(null as never);
    en.count.mockResolvedValue(15 as never);

    await submitInscription(validInput());

    const capacityNotif = emit.mock.calls.find(
      (c) => c[0].type === "event.capacity_reached",
    );
    expect(capacityNotif).toBeUndefined();
  });

  it("skips the capacity check entirely when event capacity is 0 (unlimited)", async () => {
    mockEvent({ capacity: 0 });
    en.findUnique.mockResolvedValue(null as never);

    await submitInscription(validInput());

    expect(en.count).not.toHaveBeenCalled();
    const capacityNotif = emit.mock.calls.find(
      (c) => c[0].type === "event.capacity_reached",
    );
    expect(capacityNotif).toBeUndefined();
  });
});
