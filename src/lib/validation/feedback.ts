import { z } from "zod";

export const FeedbackSchema = z.object({
  overallRating: z.number().int().min(1).max(5),
  organizationRating: z.number().int().min(1).max(5),
  favoriteMoment: z.string().max(500).optional(),
  favoriteSpeaker: z.string().max(200).optional(),
  changedVision: z.boolean(),
  wouldContinue: z.boolean(),
  improvements: z.string().max(1000).optional(),
  verbatim: z.string().max(1500).optional(),
});

export type FeedbackInput = z.infer<typeof FeedbackSchema>;
