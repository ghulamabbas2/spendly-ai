import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name').max(40, 'Name is too long'),
  icon: z.string().min(1, 'Pick an icon'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Pick a color'),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
