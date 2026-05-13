import { z } from "zod";

const STATUSES = ["brouillon", "publie", "complet", "en_cours", "termine", "archive"] as const;
const TYPES = ["FEMININ", "IMMERSION", "ATELIER", "IMPULSION"] as const;

export const createEventSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  type: z.enum(TYPES).default("FEMININ"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (YYYY-MM-DD)"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Heure invalide (HH:mm)")
    .default("09:30"),
  address: z.string().min(2, "Adresse requise"),
  capacity: z.coerce.number().int().positive("Capacité doit être positive"),
  description: z.string().optional(),
});

export const updateEventSchema = createEventSchema.extend({
  replyToEmail: z
    .string()
    .email("Email invalide")
    .optional()
    .or(z.literal("")),
  emailSignature: z.string().optional(),
});

export const transitionStatusSchema = z.object({
  newStatus: z.enum(STATUSES),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const EVENT_STATUSES = STATUSES;
export const EVENT_TYPES = TYPES;

/**
 * Allowed lifecycle transitions from a status. Free to skip forward, but
 * archiving is always allowed; un-archive moves back to brouillon.
 */
export const ALLOWED_TRANSITIONS: Record<
  (typeof STATUSES)[number],
  (typeof STATUSES)[number][]
> = {
  brouillon: ["publie", "archive"],
  publie: ["brouillon", "complet", "en_cours", "termine", "archive"],
  complet: ["publie", "en_cours", "termine", "archive"],
  en_cours: ["termine", "archive"],
  termine: ["archive", "publie"], // re-open allowed
  archive: ["brouillon"], // restore
};
