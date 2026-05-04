import { z } from "zod";

export const feedbackSchema = z.object({
  overallRating: z.number().int().min(1).max(5),
  orgRating: z.number().int().min(1).max(5),
  favoriteMoment: z.string().optional(),
  changedVision: z.boolean(),
  improvements: z.string().optional(),
  verbatim: z.string().optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
