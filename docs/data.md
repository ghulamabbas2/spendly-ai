# Spendly AI — Data Access

All data access goes through a **service layer** in `src/services`. Screens and components never talk to Supabase, the Claude API, or any Edge Function inline — they call service functions. See [`architecture.md`](architecture.md) for how the layers fit together, [`database.md`](database.md) for the schema/RLS, and [`auth.md`](auth.md) for session/identity.

## Principles

- **Services own all I/O.** The Supabase client, the AI service, and any network calls live only in `src/services`. Screens/hooks import service functions, never SDKs.
- **Never inline data access in screens.** No `supabase.from(...)`, no `fetch`, no client SDK calls inside screen or component files.
- **Every query is scoped to the signed-in user.** Services rely on the authenticated Supabase session; RLS enforces per-user access at the database as well (defense in depth — see [`auth.md`](auth.md)).

## Services

### Supabase service
Reads and writes against Postgres via the Supabase client. Always operates as the signed-in user; RLS guarantees rows are scoped to `auth.uid()` regardless of what the client requests. Grouped by domain, e.g. `expenses-service.ts`, `categories-service.ts`, `profile-service.ts`.

### Claude / AI service
Handles AI calls (insights, categorization, natural-language queries). **The app never calls the Claude API directly** — see *AI calls go through an Edge Function* below.

## The pattern

A service function **returns typed data or throws**. The screen (or a hook wrapping the service) **handles loading and error** state.

```ts
// src/services/expenses-service.ts
import {supabase} from './supabase-client';
import type {Expense} from '../types/expense';

// Returns typed data, or throws on failure.
export async function getExpenses(): Promise<Expense[]> {
  const {data, error} = await supabase
    .from('expenses')
    .select('*')
    .order('date', {ascending: false});

  if (error) throw error;
  return data as Expense[];
}
```

```ts
// src/screens/ExpensesScreen.tsx (or a hook it uses)
const [expenses, setExpenses] = useState<Expense[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  let active = true;
  (async () => {
    try {
      setLoading(true);
      const data = await getExpenses(); // typed data or throws
      if (active) setExpenses(data);
    } catch (e) {
      if (active) setError(e as Error);
    } finally {
      if (active) setLoading(false);
    }
  })();
  return () => {
    active = false;
  };
}, []);
```

Rules for the pattern:

1. **Service returns typed data or throws** — no `{data, error}` tuples leaking into screens; the service unwraps the result and returns the domain type, or throws.
2. **Screen owns UI state** — loading, error, and success are handled where the data is consumed, in local state or context.
3. **Results live in local state or context** — no external state-management library (see [`architecture.md`](architecture.md)). Cross-screen data goes in context; view-local data in `useState`.

## AI calls go through an Edge Function

The **Claude API is never called from the app.** The Anthropic API key must never ship in the client.

- AI calls go to a **Supabase Edge Function** that holds the API key and calls Claude **server-side**.
- The app's **AI service calls the Edge Function**, not Anthropic directly.
- The Edge Function runs in the user's authenticated context (Supabase forwards the session), so it can enforce identity and scope any data it reads to the caller.

```
Screen ─▶ AI service (src/services) ─▶ Supabase Edge Function ─▶ Claude API
                                         (holds API key,
                                          calls Claude server-side)
```

The AI service follows the same contract as every other service: **returns typed data or throws**, and the screen handles loading/error.

```ts
// src/services/ai-service.ts
import {supabase} from './supabase-client';
import type {SpendingInsight} from '../types/insight';

// Calls the Edge Function — never Anthropic directly. Typed data or throws.
export async function getSpendingInsights(): Promise<SpendingInsight[]> {
  const {data, error} = await supabase.functions.invoke('insights');
  if (error) throw error;
  return data as SpendingInsight[];
}
```
