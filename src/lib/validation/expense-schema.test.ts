import { expenseInputSchema } from './expense-schema';

describe('expenseInputSchema', () => {
  const validInput = {
    amount: 42.5,
    categoryId: '123e4567-e89b-12d3-a456-426614174000',
    note: 'Coffee',
    date: '2026-08-09',
  };

  it('parses valid input', () => {
    const result = expenseInputSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it('parses valid input without an optional note', () => {
    const { note, ...withoutNote } = validInput;

    const result = expenseInputSchema.safeParse(withoutNote);

    expect(result.success).toBe(true);
  });

  it('rejects a zero amount', () => {
    const result = expenseInputSchema.safeParse({ ...validInput, amount: 0 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.amount).toEqual([
        'Amount must be greater than zero',
      ]);
    }
  });

  it('rejects a negative amount', () => {
    const result = expenseInputSchema.safeParse({ ...validInput, amount: -5 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.amount).toEqual([
        'Amount must be greater than zero',
      ]);
    }
  });

  it('rejects a categoryId that is not a uuid', () => {
    const result = expenseInputSchema.safeParse({ ...validInput, categoryId: 'not-a-uuid' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.categoryId).toEqual(['Pick a category']);
    }
  });

  it('rejects a note longer than 200 characters', () => {
    const result = expenseInputSchema.safeParse({ ...validInput, note: 'a'.repeat(201) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.note).toBeDefined();
    }
  });

  it('rejects a date that is not in YYYY-MM-DD format', () => {
    const result = expenseInputSchema.safeParse({ ...validInput, date: '08/09/2026' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.date).toBeDefined();
    }
  });
});
