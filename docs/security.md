# Spendly AI — Security

Security practices for the app. See [`auth.md`](auth.md) for authentication, [`database.md`](database.md) for RLS policies, and [`data.md`](data.md) for how AI calls are routed.

## Secrets & API keys

- **All secrets and API keys live in environment config** — never hardcoded in source, never committed.
- **`.env` is gitignored.** A **`.env.example`** template is committed with the *keys only* (no real values) so contributors know what to configure.
- Rotate any key that is ever committed or leaked; a leaked key is compromised even if the commit is later removed.

```
# .env.example  (committed — placeholders only)
SUPABASE_URL=
SUPABASE_ANON_KEY=
# Server-side only — set on the Supabase Edge Function, NOT in the app:
# ANTHROPIC_API_KEY=
```

> The Supabase **anon key** is a public client identifier and may ship in the app — it is *not* a secret. It is safe only because Row-Level Security scopes every request to the authenticated user. Never ship the Supabase **service-role key** or the **Anthropic API key** in the client.

## The Claude API key never ships in the client

- **The Anthropic API key must not be embedded in the app bundle.** A bundled key can be extracted from the shipped APK and abused.
- **AI calls are routed so the key stays server-side:** the app's AI service calls a **Supabase Edge Function**, which holds the `ANTHROPIC_API_KEY` and calls Claude server-side (see [`data.md`](data.md)). The app never calls Anthropic directly.

```
App (no key) ─▶ Supabase Edge Function (holds ANTHROPIC_API_KEY) ─▶ Claude API
```

## Data ownership enforced by RLS

- **Row-Level Security enforces data ownership at the database.** Every table scopes rows to `auth.uid()`, so a user can only ever read or write their own data — regardless of what the client attempts (see [`database.md`](database.md)).
- Client-side gating (navigation, hidden UI) is a UX guardrail, **not** the security boundary. RLS is the real enforcement (see [`auth.md`](auth.md)).
- The Edge Function runs in the caller's authenticated context, so any data it reads on the user's behalf is also RLS-scoped to that user.

## Minimal, disclosed data to the AI

- **Send the least financial data needed** for a given AI feature — scope to the specific expenses/categories/time range the task requires, not the user's entire history.
- **Disclose to the user** what financial data is shared with the AI and why, so the sharing is transparent and expected.
- Prefer aggregating or trimming data in the Edge Function before it reaches Claude, so only what's necessary leaves the user's scope.
