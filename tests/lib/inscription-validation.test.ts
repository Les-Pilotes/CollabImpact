import { describe, it, expect } from "vitest";
import { inscriptionSchema } from "@/lib/validation/inscription";

/**
 * Tous les champs en dehors de email/firstName/lastName sont individuellement
 * désactivables par event via `FormConfig`. Quand un champ est désactivé,
 * il n'est pas dans le payload — le schema doit accepter le payload tel
 * quel (les champs concernés sont `.optional()` au niveau schema).
 */
describe("inscriptionSchema — fields toggleable per-event", () => {
  const minimal = {
    eventId: "ev-1",
    firstName: "Lisa",
    lastName: "Martin",
    email: "lisa@example.com",
  };

  it("accepts a payload with only the structurally required fields", () => {
    const result = inscriptionSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects when email is missing", () => {
    const result = inscriptionSchema.safeParse({ ...minimal, email: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects when firstName is missing", () => {
    const result = inscriptionSchema.safeParse({ ...minimal, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when lastName is missing", () => {
    const result = inscriptionSchema.safeParse({ ...minimal, lastName: "" });
    expect(result.success).toBe(false);
  });

  it.each([
    "phone",
    "birthDate",
    "city",
    "niveauScolaire",
    "region",
    "projetPro",
    "motivation",
    "commentConnu",
    "droitsImageAccepted",
    "regime",
    "accessibilite",
    "commentaire",
  ])("accepts a payload omitting %s", (field) => {
    const payload: Record<string, unknown> = {
      ...minimal,
      phone: "0612345678",
      birthDate: "2008-05-20",
      city: "Paris",
      niveauScolaire: "Terminale",
      region: "Île-De-France",
      projetPro: "Découvrir l'entrepreneuriat",
      motivation: ["Apprendre de nouvelles compétences"],
      commentConnu: "Instagram",
      droitsImageAccepted: true,
      regime: [],
      accessibilite: undefined,
      commentaire: undefined,
    };
    delete payload[field];
    const result = inscriptionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("still validates the format of fields that ARE provided", () => {
    const result = inscriptionSchema.safeParse({
      ...minimal,
      birthDate: "20-05-2008", // wrong format
    });
    expect(result.success).toBe(false);
  });

  it("still validates the enum of fields that ARE provided", () => {
    const result = inscriptionSchema.safeParse({
      ...minimal,
      region: "Wakanda",
    });
    expect(result.success).toBe(false);
  });
});
