import { z } from "zod";

/**
 * v2 feedback payload — the public form submits a map of answers indexed by
 * question key (cf. src/lib/feedback/questions.ts). Values are either a string
 * (text / long / select / scale / yesno) or a string[] (multi-select).
 * Bounds keep a malicious client from storing unbounded blobs.
 */
const answerValue = z.union([z.string().max(5000), z.array(z.string().max(500)).max(30)]);

export const feedbackSchema = z.object({
  answers: z.record(z.string().max(80), answerValue),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
