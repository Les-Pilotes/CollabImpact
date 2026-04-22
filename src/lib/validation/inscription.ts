import { z } from "zod";

/**
 * Schémas Zod pour le formulaire d'inscription jeune.
 * 3 étapes : Couche 1 (identité), Couche 2 (projet/études), Couche 3 (inscription).
 * Utilisés côté client (react-hook-form) et côté serveur (API route).
 */

const phoneFrRegex = /^(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}$/;

export const Layer1Schema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(80),
  lastName: z.string().min(1, "Nom requis").max(80),
  email: z.string().email("Email invalide").toLowerCase(),
  phone: z.string().regex(phoneFrRegex, "Numéro invalide"),
  birthDate: z.coerce.date().refine((d) => {
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 13 && age <= 30;
  }, "Âge doit être entre 13 et 30 ans"),
  gender: z.enum(["femme", "homme", "autre", "non_precise"]),
  city: z.string().min(1, "Ville requise").max(80),
  dietary: z.enum([
    "aucun",
    "vegetarien",
    "vegan",
    "halal",
    "casher",
    "sans_gluten",
    "sans_porc",
    "autre",
  ]),
  dietaryOther: z.string().max(120).optional(),
});

export const Layer2Schema = z.object({
  educationLevel: z.enum([
    "college",
    "lycee",
    "bac",
    "post_bac_1",
    "post_bac_2",
    "post_bac_3",
    "post_bac_4_5",
    "hors_cursus",
  ]),
  field: z.string().max(120).optional(),
  institution: z.string().max(120).optional(),
  projectStatus: z.enum(["aucun", "en_construction", "defini"]),
  projectDescription: z.string().max(1000).optional(),
  interestAreas: z.array(z.string().min(1).max(60)).max(10).default([]),
  preferredEnvironment: z.enum(["startup", "grand_groupe", "public", "associatif"]).optional(),
});

export const Layer3Schema = z.object({
  immersionId: z.string().min(1),
  mode: z.enum(["individuel", "via_referent"]),
  referentName: z.string().max(120).optional(),
  referentStructure: z.string().max(120).optional(),
  source: z.enum([
    "whatsapp",
    "instagram",
    "bouche_a_oreille",
    "classe",
    "conseiller",
    "autre",
  ]),
  comment: z.string().max(1000).optional(),
});

export const InscriptionSchema = Layer1Schema.merge(Layer2Schema).merge(Layer3Schema);

export type InscriptionInput = z.infer<typeof InscriptionSchema>;
export type Layer1Input = z.infer<typeof Layer1Schema>;
export type Layer2Input = z.infer<typeof Layer2Schema>;
export type Layer3Input = z.infer<typeof Layer3Schema>;

export const EmailCheckSchema = z.object({
  email: z.string().email().toLowerCase(),
});
