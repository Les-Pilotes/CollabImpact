import { z } from "zod";

/**
 * Walk-in (inscription Jour J sur place) — formulaire ultra-minimal scanné via
 * le QR générique de l'event. On ne demande que l'essentiel ; l'orientation
 * pourra être complétée plus tard. cf. issue #10.
 */
export const walkinSchema = z.object({
  eventId: z.string().min(1),
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  phone: z.string().trim().max(30).optional(),
  droitsImageAccepted: z.boolean(),
});

export type WalkinInput = z.infer<typeof walkinSchema>;
