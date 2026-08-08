# Spendly AI — Errors & Validation

How input is validated and how failures are handled across the app. See [`data.md`](data.md) for the service contract and [`coding-standards.md`](coding-standards.md) for error conventions.

## Validation with Zod

- **Validate all input with Zod before writing to Supabase.** No unvalidated data reaches a service write.
- **Shared schemas live in `src/lib/validation`** (kebab-case files, e.g. `expense-schema.ts`). Screens, hooks, and services import the same schema — one source of truth per model.
- Derive TypeScript types from schemas with `z.infer` so the type and the runtime check never drift.

```ts
// src/lib/validation/expense-schema.ts
import {z} from 'zod';

export const expenseInputSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  categoryId: z.string().uuid('Pick a category'),
  note: z.string().max(200).optional(),
  date: z.string().date(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
```

## Two kinds of failure

The app distinguishes **expected** failures from **unexpected** ones, and handles them differently.

### Expected failures → typed result, rendered inline

Bad form input is expected and is **not thrown**. Validation returns a **typed result** the screen renders inline (field-level messages), so the user can correct and retry.

```ts
// Parse without throwing; return a typed result.
const result = expenseInputSchema.safeParse(formValues);

if (!result.success) {
  // result.error.flatten().fieldErrors -> render inline under each field
  setFieldErrors(result.error.flatten().fieldErrors);
  return;
}

await createExpense(result.data); // only valid, typed data proceeds
```

- Use `safeParse` (not `parse`) at the boundary where user input is validated.
- Map `fieldErrors` to inline messages beside the relevant inputs.
- Expected failures never surface as a thrown error or an alert — they are part of normal form flow.

### Unexpected errors → caught at the screen, friendly message

Everything else (network down, Supabase error, Edge Function failure, unexpected exceptions) is **thrown** by the service (see [`data.md`](data.md)) and **caught at the screen**. The user sees a **friendly message** — never a raw error string, JSON, or stack trace.

```tsx
try {
  setSubmitting(true);
  await createExpense(input);
} catch (e) {
  // Log the real error for debugging; show the user something human.
  console.error(e);
  setError('Something went wrong saving your expense. Please try again.');
} finally {
  setSubmitting(false);
}
```

- Log the real error (for debugging) but present a plain-language message to the user.
- Never render `error.message`, stack traces, or backend payloads directly in the UI.

## AI & network calls

AI and network calls **always handle failure and error states in the UI**. Every such call has three visible states:

- **Loading** — a spinner/skeleton while the request is in flight.
- **Error** — a friendly message plus a way to retry when the call fails (network, timeout, Edge Function/Claude error).
- **Success** — the result rendered.

No AI or network call may leave the UI stuck in a silent or indefinite loading state. Because AI calls go through the Supabase Edge Function (see [`data.md`](data.md)), their failures are handled exactly like any other network error: caught at the screen, shown as a friendly message with retry.
