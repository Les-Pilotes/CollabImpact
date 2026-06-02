import { z } from "zod";

// ─── Couche Fondamentale ─────────────────────────────────────────────────────
// Note: only email/firstName/lastName are structurally required. The remaining
// fields here can be disabled per-event via FormConfig — schema accepts them
// as optional so an inscription that omits a disabled field still validates.
export const fondamentaleSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .min(8, "Téléphone invalide")
    .max(20, "Téléphone invalide")
    .optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide (YYYY-MM-DD)")
    .optional(),
  // 100% féminin : pas de choix de genre, toujours "Fille".
  gender: z.literal("Fille").default("Fille"),
  city: z.string().min(1, "La ville est requise").optional(),
});

// ─── Couche Orientation ──────────────────────────────────────────────────────
export const NIVEAUX = [
  "3ème",
  "2nde",
  "1ère",
  "Terminale",
  "BTS",
  "Licence",
  "Master",
  "Autres",
] as const;

export const REGIONS = [
  "Île-De-France",
  "Hauts-de-France",
  "Auvergne-Rhône-Alpes",
  "Provence-Alpes-Côte d'Azur",
  "Pays de la Loire",
] as const;

export const orientationSchema = z.object({
  niveauScolaire: z.enum(NIVEAUX).optional(),
  niveauScolaireAutre: z.string().optional(),
  etablissement: z.string().optional(),
  region: z.enum(REGIONS).optional(),
  projetPro: z
    .string()
    .min(1, "Décris ton projet ou indique 'pas encore' ou 'en construction'")
    .optional(),
  motivation: z.array(z.string()).optional(),
  motivationDetail: z.string().optional(),
  commentConnu: z.string().min(1, "Indique comment tu nous as connus").optional(),
});

// ─── Couche Événement ────────────────────────────────────────────────────────
export const evenementSchema = z.object({
  droitsImageAccepted: z.boolean().optional(),
  droitsImageSignature: z.string().optional(), // required if accepted + majeure
  regime: z.array(z.string()).optional(),
  accessibilite: z.string().optional(),
  accompagnateur: z.boolean().default(false),
  commentaire: z.string().optional(),
});

// ─── Full inscription payload ────────────────────────────────────────────────
export const inscriptionSchema = z.object({
  eventId: z.string().min(1),
  // Couche Fondamentale
  ...fondamentaleSchema.shape,
  // Couche Orientation
  ...orientationSchema.shape,
  // Couche Événement
  ...evenementSchema.shape,
});

export type InscriptionInput = z.infer<typeof inscriptionSchema>;

export const NIVEAUX_SCOLAIRES = NIVEAUX;
export const REGIONS_FR = REGIONS;
export const MOTIVATIONS = [
  "Apprendre de nouvelles compétences",
  "Élargir mon réseau professionnel",
  "Découvrir l'entrepreneuriat",
  "Trouver un stage / une alternance",
  "Préciser mon orientation",
  "Autres",
] as const;

export const SOURCES = [
  "WhatsApp",
  "Instagram",
  "Bouche à oreille",
  "Via un référent / professeur",
  "Établissement scolaire",
  "Réseaux sociaux Pilotes",
  "Autre",
] as const;

export const REGIMES = [
  "Aucun",
  "Végétarien",
  "Végétalien",
  "Sans gluten",
  "Halal",
  "Casher",
  "Allergie (préciser dans commentaire)",
] as const;
