import { z } from "zod";

export const inscriptionSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Téléphone invalide").max(15, "Téléphone invalide"),
  city: z.string().min(1, "La ville est requise"),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide (YYYY-MM-DD)"),
  source: z.enum([
    "whatsapp",
    "instagram",
    "bouche_a_oreille",
    "classe",
    "conseiller",
    "autre",
  ]),
});

export type InscriptionInput = z.infer<typeof inscriptionSchema>;
