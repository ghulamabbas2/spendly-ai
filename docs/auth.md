# Spendly AI — Authentication

Authentication is handled by **Supabase Auth** using **email/password**. Auth state drives root navigation, and every data access relies on Row-Level Security so identity is enforced at the database — not just in the client. See [`database.md`](database.md) for the RLS policies and [`architecture.md`](architecture.md) for where the client lives.

## Method

- **Email + password** only (no social/OAuth, no magic links for now).
- Sign up, sign in, and sign out go through the Supabase Auth client in the service layer (`src/services`). Screens and hooks never call the auth SDK directly — they go through a service (typically via an auth hook/context).

## Session handling

- The **Supabase client holds the session** and **refreshes it automatically** — access tokens are renewed in the background before they expire, and the session is persisted so it survives app restarts.
- The app exposes the current session through auth state (context) so navigation and services can react to sign-in / sign-out.
- On sign-out, the session is cleared and the app returns to the auth screens.

## Root navigation branches on session

Root navigation branches on **session presence**:

- **No session** → the **Auth stack** (sign in / sign up). Signed-out users can reach *only* these screens.
- **Session present** → the **App stack** (Home, Chat, Insights, Profile, and their sub-screens).

The switch is driven by auth state, so a sign-in or sign-out (including an expired/invalidated session) automatically moves the user to the correct stack. There is no in-app path from the signed-out state to any app screen except by authenticating.

## Identity is enforced at the database

Client-side navigation gating is a **UX guardrail, not the security boundary**. Actual protection comes from **Row-Level Security**: every table scopes rows to `auth.uid()`, so a request only ever reads or writes the authenticated user's own data — regardless of what the client attempts. Even if a client bug exposed a screen or query, the database rejects access to other users' rows.

See [`database.md`](database.md) for the per-table RLS policies.

## Signup side effects

On signup, a default set of categories is seeded for the new user (see [`database.md`](database.md) — *Categories: per-user, seeded on signup*), so the app is usable immediately after the first sign-in.
