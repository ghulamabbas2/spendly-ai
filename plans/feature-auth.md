# Signup & Login (email/password)

## Context

The nav-shell PR (`bcd179e`) scaffolded the auth surface but left it stubbed: `use-auth.tsx` fakes a session with `useState`, `SignInScreen`/`SignUpScreen`/`ProfileScreen` have no real forms, and nothing calls Supabase Auth yet. The database side is already done — `supabase/migrations/20260809110911_init_schema.sql` creates `profiles`/`categories`/`expenses` with RLS and a trigger (`on_auth_user_created_seed_categories`) that inserts a `profiles` row and seeds 7 default categories whenever a row is added to `auth.users`. This migration is already applied to the live remote project (`spendly-ai`, ref `syaaeaojqcsifpboifdk`). `src/services/supabase-client.ts` is already configured with `AsyncStorage` persistence and `AppState`-driven auto-refresh.

This feature wires the real Supabase Auth client through the service layer so sign up / sign in / sign out work end-to-end, the session persists across restarts, and Profile shows the signed-in user. Because profile creation and category seeding happen via the DB trigger, the client only needs to call `supabase.auth.signUp` — no separate insert calls.

Per Context7 docs for `@supabase/supabase-js`: `onAuthStateChange` fires `INITIAL_SESSION` immediately with whatever session is in persisted storage (or `null`), then fires again on `SIGNED_IN`/`SIGNED_OUT`/`TOKEN_REFRESHED`/etc. This one subscription is sufficient to both hydrate the initial (possibly persisted) session on app start and react to future changes — no separate `getSession()` call needed. Also per docs: if the Supabase project has "Confirm email" enabled, `signUp` returns `session: null` (user created but not logged in) until the user confirms via email link — the UI must handle that case distinctly from an immediate auto-login.

`docs/ui.md` marks auth screens as **TBD** in the prototype (app is "signed-in by default" there), so there's no prototype screen to match — build functional forms using the design-system tokens already in use by the existing stub screens (`#7c3aed` primary, similar spacing), not a pixel-perfect layout.

## Files to create / change

- **`src/lib/validation/auth-schema.ts`** (new) — Zod schemas per `docs/errors-and-validation.md`: `signInSchema` (email, password) and `signUpSchema` (email, password min length 8, confirmPassword with `.refine` match). Export inferred types `SignInInput`/`SignUpInput`.
- **`src/types/auth.ts`** (rewrite) — replace the stub `Session`. Define `AuthUser = { id: string; email: string }` and `Session = { user: AuthUser }` — a small domain type, not the raw Supabase SDK type, so only the service layer touches the SDK shape.
- **`src/services/auth-service.ts`** (new) — the only file besides `supabase-client.ts` that touches `supabase.auth`. Per `docs/data.md` contract (typed data or throws):
  - `signUp(email, password): Promise<{ needsEmailConfirmation: boolean }>` — calls `supabase.auth.signUp`, throws on error, returns whether the response session was null (confirmation required).
  - `signIn(email, password): Promise<void>` — calls `supabase.auth.signInWithPassword`, throws on error.
  - `signOut(): Promise<void>` — calls `supabase.auth.signOut`, throws on error.
  - `subscribeToAuthChanges(callback: (session: Session | null) => void): () => void` — wraps `supabase.auth.onAuthStateChange`, maps the SDK `Session` to the domain `Session`/`AuthUser`, returns an unsubscribe function.
- **`src/hooks/use-auth.tsx`** (rewrite) — real `AuthProvider`:
  - State: `session: Session | null`, `loading: boolean` (starts `true`).
  - `useEffect` on mount: `authService.subscribeToAuthChanges(s => { setSession(s); setLoading(false); })`, cleanup unsubscribes.
  - `signUp`/`signIn`/`signOut` call the corresponding `auth-service` functions and let errors throw (screens catch them); session state itself is never set manually — it's always driven by the subscription, so it can't drift from what Supabase reports.
  - Context value: `{ session, user: session?.user ?? null, loading, signUp, signIn, signOut }`.
- **`src/navigation/RootNavigator.tsx`** — while `loading` is true (still resolving the persisted session on startup), render a simple centered `ActivityIndicator` instead of `AuthStack`/`AppStack`, so a persisted session doesn't flash the sign-in screen.
- **`src/screens/SignInScreen.tsx`** (rewrite) — email + password `TextInput`s, local `useState` form values + field errors, `signInSchema.safeParse` on submit (inline errors, per `errors-and-validation.md`), calls `useAuth().signIn`, catches thrown errors into a friendly banner ("Couldn't sign in. Check your email and password."), disables the button while submitting, link to Sign Up (`navigation.navigate('SignUp')`).
- **`src/screens/SignUpScreen.tsx`** (rewrite) — email + password + confirm password fields, `signUpSchema.safeParse`, calls `useAuth().signUp`. If `needsEmailConfirmation` is true, show an inline success message ("Check your email to confirm your account, then sign in.") and a link to Sign In; if false, do nothing further — the auth-state subscription fires `SIGNED_IN` and `RootNavigator` switches automatically. Friendly error banner on thrown errors (e.g. "That email is already in use.").
- **`src/screens/ProfileScreen.tsx`** (rewrite) — reads `user` from `useAuth()`, shows email (and a simple initials avatar derived from it), keeps the existing Sign Out button wired to `useAuth().signOut()`, with a submitting state and a console-logged/friendly-message catch if it throws.
- **`package.json`** — add `zod` as an explicit dependency (it's already present in `node_modules`/`package-lock.json` as a transitive peer dependency, but `docs/errors-and-validation.md` requires it as a direct, explicit dependency since app code imports it directly).

## Notes

- No new DB migration needed — schema, RLS, and the seed trigger already exist and are applied to the remote project.
- No navigation param changes needed — `AuthStackParamList` (`SignIn`/`SignUp`) already fits.
- Keep all `supabase.auth.*` calls inside `auth-service.ts` — screens/hooks never import `@supabase/supabase-js` directly, per `docs/architecture.md`.
- No tests are added as part of this build (per project convention, tests are a separate explicit step).

## Manual Test Scenarios

- Sign up with a new email + matching passwords → (if email confirmation is off) lands directly in the App stack on Home; Profile shows the new email, and a fresh set of 7 default categories exists (verify via Categories screen or a Supabase table check).
- Sign up with a new email when confirmation is required → sees the "check your email" message, confirms via the emailed link, then signs in successfully.
- Force-quit and reopen the app after signing in → session persists, app opens directly to the App stack (no re-login), no flash of the sign-in screen.
- Sign in with a wrong password → friendly inline error, no navigation, no crash.
- Sign up with an already-registered email → friendly error shown, no duplicate profile/categories created.
- Submit either form with an invalid email or a too-short/mismatched password → inline field errors, nothing submitted to Supabase.
- Tap Sign Out from Profile → returns to the Sign In screen; relaunching the app afterward stays on Sign In (no stale session).
