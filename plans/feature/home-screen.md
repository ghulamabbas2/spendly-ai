# Home Dashboard

## Context

`HomeScreen.tsx` is currently a 24-line placeholder. This builds the real dashboard per `docs/ui.md` §2.1 and the Claude Design prototype (`Spendly AI.dc.html`, `<!-- HOME -->` section, verified directly via DesignSync): a period-filterable total-spent hero card with vs-previous comparison and transaction count, a top-categories breakdown, and a recent-transactions list where tapping a row pushes an Expense Detail screen. No `expenses`/`categories` types, services, hooks, or date-range helpers exist yet — this is greenfield per `docs/architecture.md`'s reserved layout. Per user decision, Expense Detail is built as a **minimal stub screen** in this plan (proves navigation only); the fully-styled detail screen with Edit/Delete is a separate future feature.

## Files to create

**Types** (`docs/architecture.md` — `src/types`, kebab-case files, PascalCase exports)
- `src/types/category.ts` — `Category` (`id, user_id, name, icon, color, created_at`)
- `src/types/expense.ts` — `Expense` (`id, user_id, amount, category_id, note, date, created_at`)

**Lib** (`src/lib`, pure, no React/I/O per `docs/architecture.md`)
- `src/lib/date-range.ts` — `Period = 'week' | 'month' | 'year'`; `getPeriodRange(period, now)` and `getPreviousPeriodRange(period, now)` each returning `{start: Date; end: Date}`; `formatPeriodLabel(period)` → "This Week"/"This Month"/"This Year" text for the hero card; `formatShortDate(date)` → "Jul 11" style for transaction rows.

**Services** (`src/services`, "typed data or throws" pattern per `docs/data.md`)
- `src/services/categories-service.ts` — `getCategories(): Promise<Category[]>`
- `src/services/expenses-service.ts` — `getExpensesInRange(start: Date, end: Date): Promise<Expense[]>` (for current + previous period totals/comparison); `getRecentExpenses(limit = 8): Promise<Expense[]>` (all-time, newest-first, independent of period filter, per §2.1). Both scoped implicitly to the signed-in user via RLS, ordered by `date desc`.

**Hook**
- `src/hooks/use-home-dashboard.ts` — owns `period` state (default `'month'`), calls the services for current-period expenses, previous-period expenses, recent expenses, and categories; derives: total spent, % change vs previous (or "no prior data" when previous period has 0 expenses), transaction count, top 4 categories by spend (name/amount/color/icon/proportional bar width normalized to the largest), and the merged/joined recent-transaction rows (category name/icon/color looked up by `category_id`). Exposes `{loading, error, period, setPeriod, totalSpent, comparison, txnCount, topCategories, recentTransactions}`. Follows `docs/data.md`'s loading/error-in-consumer pattern (hook owns it here since data feeds multiple UI sections).

**Components** (`src/components`, presentational, matching `docs/design-system.md` tokens)
- `src/components/Card.tsx` — reusable white card (`radius.lg` 22px, `shadow.card`), used by Top Categories and Recent Transactions sections.
- `src/components/PeriodToggle.tsx` — 3-segment Week/Month/Year control on translucent track, active = white bg/primary text, matches hero card's `motion.toggle`.
- `src/components/CategoryProgressRow.tsx` — icon chip + name + amount + proportional bar (one row of Top Categories).
- `src/components/TransactionRow.tsx` — icon chip + title + "{category} · {date}" + amount, pressable (`#f6f7f9` press state), used by Recent Transactions and reusable later by Insights/Category screens.
- `src/components/EmptyState.tsx` — generic centered icon + heading + subtext + optional CTA button; no prototype spec exists for Home's empty case, so this is designed to match existing tokens (`textMuted #8a90a0`, `primary #7c3aed`) rather than copied from the prototype.

**Screen**
- `src/screens/HomeScreen.tsx` — replaces the placeholder. Renders header (avatar initials + greeting + bell — bell is decorative/non-functional, no notifications feature exists), hero card (`PeriodToggle` + total + comparison pill + txn count) via `gradient.brandCard`/`shadow.heroCard`, Top Categories `Card`, Recent Transactions `Card`. When `recentTransactions` is empty (no expenses at all, regardless of period), renders `EmptyState` instead of the hero/categories/recent sections ("No expenses yet" + prompt to add one). When only the *selected period* has no expenses but other expenses exist, hero card still renders with `$0.00` / "No prior data" / 0 transactions (not the full empty state — only true zero-expense accounts get the empty state, since Recent Transactions is all-time).

**Navigation**
- `src/navigation/types.ts` — add `ExpenseDetail: {expenseId: string}` to `AppStackParamList`.
- `src/screens/ExpenseDetailScreen.tsx` — minimal stub (reads `route.params.expenseId`, displays it plainly), registered as a pushed screen (not modal) in `AppStack.tsx`. No styling polish, no Edit/Delete — full detail screen is a separate future feature.
- `src/navigation/AppStack.tsx` — register `ExpenseDetailScreen`.
- `TransactionRow` press handler in `HomeScreen.tsx` calls `navigation.navigate('ExpenseDetail', {expenseId: t.id})`.

## Data notes

- No new tables/migrations — uses existing `expenses`/`categories` (`docs/database.md`), RLS already scoped to `auth.uid()`.
- Comparison %: `(current - previous) / previous * 100`; when `previous === 0` show "No prior data" instead of a percentage (avoids div-by-zero), per §2.1.
- No date library in `package.json` — `date-range.ts` implemented with plain `Date` math (week = Mon–Sun, per common convention; confirm not blocking since prototype doesn't specify week start — defaulting to Monday).
- Top categories bar width: `amount / maxCategoryAmount * 100`, capped at 4 categories, sorted descending by spend within the selected period.

## Manual Test Scenarios

- Sign in with an account that has expenses in the current month → Home shows correct total, comparison pill, transaction count, up to 4 top categories with proportional bars, and up to 8 recent transactions.
- Tap "Week" then "Year" on the period toggle → total, comparison, and transaction count update accordingly; Top Categories updates; Recent Transactions list stays the same (all-time, not period-scoped).
- Tap a transaction row → pushes to the Expense Detail stub screen showing that transaction's id; back arrow returns to Home.
- Sign in with a brand-new account that has zero expenses → Home renders the empty state ("No expenses yet") instead of the hero/categories/recent sections.
- Select a period with no expenses but the account has expenses elsewhere (e.g. "This Week" with only last month's spending) → hero shows $0.00 / "No prior data" / 0 transactions, but Recent Transactions still shows the account's actual recent expenses (not the empty state).
- Sign out and attempt to view Home → session gating in `RootNavigator` redirects to sign-in before Home ever renders (per `docs/auth.md`); no other user's expenses are ever visible due to RLS.

---

# User Full Name

## Context

The app currently only knows a user's email (`AuthUser = {id, email}`, `docs/auth.md`). The Home dashboard greets by email and Profile's identity card has no name line, even though `docs/ui.md` §2.7 specifies the Profile identity card as "Avatar (initials), **name**, email". This adds a `full_name` to signup, threads it through auth, and displays it on both screens.

**Storage decision:** `full_name` is captured at signup via `supabase.auth.signUp({..., options: {data: {full_name}}})`, which Supabase stores on `auth.users.raw_user_meta_data`. The existing `seed_default_categories` trigger (fires `after insert on auth.users`) is extended to copy it into a new nullable `profiles.full_name` column. The app then reads the name back from the **session's `user_metadata`** (no extra query) rather than fetching `profiles` — simplest path since there's no profile-editing feature yet. If a future "edit name" feature is added, it should switch the read path to the `profiles` table (the DB copy) since session metadata won't reflect post-signup edits.

`full_name` is **nullable** in the DB (not `not null`) so the migration doesn't fail against already-seeded profile rows (e.g. the `gabbasudemy@gmail.com` test account) that predate this column. The signup **form** requires a non-empty name via Zod; existing users simply have `full_name: null` until they re-register, and the UI falls back to email wherever a name is missing.

## Files to change

**Migration**
- `supabase/migrations/<timestamp>_add_profile_full_name.sql` — `alter table profiles add column full_name text;` and `create or replace function public.seed_default_categories()` with the profile insert changed to `insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');` (rest of the function unchanged). Applied via `supabase db push` (same flow used for the initial schema, per project memory).
- `docs/database.md` — add the `full_name text` row to the `profiles` table doc.

**Types**
- `src/types/auth.ts` — `AuthUser` gains `fullName: string | null`.

**Service / hook**
- `src/services/auth-service.ts` — `toDomainSession` reads `session.user.user_metadata?.full_name` (narrowed to `string | null`) into `fullName`. `signUp(email, password, fullName)` passes `options: {data: {full_name: fullName}}` to `supabase.auth.signUp`.
- `src/hooks/use-auth.tsx` — `signUp` context type updated to `(email, password, fullName) => Promise<{needsEmailConfirmation: boolean}>`.

**Validation**
- `src/lib/validation/auth-schema.ts` — `signUpSchema` gains `fullName: z.string().trim().min(1, 'Enter your name')`.

**Lib**
- `src/lib/initials.ts` (new) — `getInitials(fullName: string | null, email: string): string`, splitting full name into first+last initials, falling back to the existing email-prefix behavior when there's no name. Replaces the private `getInitials` currently duplicated in `ProfileScreen.tsx` and the one added to `HomeScreen.tsx`.

**Screens**
- `src/screens/SignUpScreen.tsx` — add a "Full name" field (first field, above email), wire it through `signUpSchema.safeParse` and into `signUp(email, password, fullName)`, add its `fieldErrors.fullName` inline error.
- `src/screens/HomeScreen.tsx` — avatar initials and greeting use `getInitials(user.fullName, user.email)`; the name line shows `user.fullName ?? user.email` (unchanged fallback behavior for users without a name).
- `src/screens/ProfileScreen.tsx` — identity card adds a name line above the email line (`user.fullName ?? user.email`, with email shown as the secondary line only when a name is present, matching §2.7's "name, email" layout); avatar switches to the shared `getInitials`.

## Manual Test Scenarios

- Sign up with a full name, email, and password → identity is created; Home dashboard greets with the name; Profile identity card shows "name" then "email".
- Sign up leaving the full name field blank → inline validation error on that field, nothing submitted.
- Sign in as the pre-existing `gabbasudemy@gmail.com` account (created before this migration, so `full_name` is `null`) → Home and Profile both fall back to showing the email, no crash or "null" text rendered.
- Sign out and back in as a user with a name containing only one word (e.g. "Madonna") → initials render as a single letter, not "MM" or blank.
