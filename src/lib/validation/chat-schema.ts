import { z } from 'zod';

// A chat question. Shared between the client (guard before sending) and mirrored
// server-side in the `chat` Edge Function. Trimmed, non-empty, length-capped.
export const chatQuestionSchema = z
  .string()
  .trim()
  .min(1, 'Type a question about your spending')
  .max(500, 'Keep your question under 500 characters');

export type ChatQuestion = z.infer<typeof chatQuestionSchema>;
