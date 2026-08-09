import { z } from 'zod';

export const expenseInputSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  categoryId: z.string().uuid('Pick a category'),
  note: z.string().max(200).optional(),
  date: z.string().date(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
