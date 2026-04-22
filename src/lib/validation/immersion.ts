import { z } from "zod";

export const SpeakerSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  role: z.string().max(120).optional(),
  email: z.string().email().optional(),
});

export const ImmersionSchema = z.object({
  name: z.string().min(1).max(200),
  status: z
    .enum(["brouillon", "publie", "complet", "en_cours", "termine"])
    .default("brouillon"),
  companyName: z.string().min(1).max(200),
  companySector: z.string().min(1).max(120),
  companyAddress: z.string().min(1).max(300),
  companyCity: z.string().min(1).max(120),
  speakers: z.array(SpeakerSchema).default([]),
  date: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(600),
  maxCapacity: z.number().int().min(1).max(200),
  themes: z.array(z.string().min(1).max(60)).max(15).default([]),
  description: z.string().max(5000).optional(),
  internalContact: z.string().max(200).optional(),
  program: z.string().max(10000).optional(),
});

export type ImmersionInput = z.infer<typeof ImmersionSchema>;
export type SpeakerInput = z.infer<typeof SpeakerSchema>;
