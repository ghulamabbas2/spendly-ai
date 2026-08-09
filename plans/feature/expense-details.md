# Plan — Expense Detail screen (view / edit / delete)

## Context

`src/screens/ExpenseDetailScreen.tsx` is currently a 36-line placeholder that only prints the
`expenseId`. Home (`HomeScreen.tsx:214`) already navigates to `ExpenseDetail` with `{ expenseId }`,
the route is registered in `AppStack.tsx`, and Home reloads its data on focus
(`useFocusEffect(reload)`), so **"return to Home with the list updated" already works** for free.

What's missing is the actual screen: show a single expense (amount, category, note, date), let the
user **Edit** it (reuse the Add Expense sheet, prefilled — per `docs/ui.md` §2.9) and **Delete** it
with a confirmation. The screen must match the prototype's "Expense details" screen (read via
DesignSync — ground truth).

## Files to create / change

**Service — `src/services/expenses-service.ts`** (extend, per `docs/data.md` "return typed data or throws"):
- `getExpenseById(id: string): Promise<Expense>` — `.select('*').eq('id', id).single()`; throw on error. RLS scopes to the owner.
- `updateExpense(id: string, input: ExpenseInput): Promise<Expense>` — `.update({...}).eq('id', id).select('*').single()`; same field mapping as `createExpense` (note trimmed → `null`). No need to set `user_id`; RLS blocks cross-user writes.
- `deleteExpense(id: string): Promise<void>` — `.delete().eq('id', id)`; throw on error.

**Helpers — `src/lib/date-range.ts`** (small additions, avoid TZ drift):
- `fromDateString(dateString: string): Date` — build a **local** `Date` from `YYYY-MM-DD` (`new Date(y, m-1, d)`). Used to prefill the Add Expense date picker on edit.
- `formatLongDateString(dateString: string): string` — `LONG_DATE_FORMATTER.format(fromDateString(...))`, mirroring `formatShortDate`. Used for the detail Date row.

**Screen — `src/screens/ExpenseDetailScreen.tsx`** (full rewrite to match prototype):
- Data: `useState<Expense>` loaded via `getExpenseById(route.params.expenseId)` in an effect with loading/error state (per `docs/data.md` — screen owns loading/error). Reload on focus via `useFocusEffect` so returning from an edit shows fresh values. Resolve the category from `useCategories()` (same pattern as `AddExpenseScreen`/`useHomeDashboard`).
- Layout (from prototype, screen padding `56/20/32`):
  - Header row: 40px circular white back button (`arrow_back`, shadow) + "Expense details" title (20px/800). Back → `navigation.goBack()`.
  - Centered block: 74px rounded icon tile (radius 22, `hexToRgba(color,0.13)` tint bg + category color icon via `toMaterialIconName`), amount 40px/800 (`formatCurrency`), title 15px/700 (note or category name — same fallback as `useHomeDashboard`).
  - White detail card (radius 22): **Category** row (11px color dot + name), **Date** row (`formatLongDateString`), **Note** row (`—` when empty). Label `#8a90a0`/700, value `#16181c`/800.
  - Actions row: **Edit** — outlined `#7c3aed` button, `edit` icon → `navigation.navigate('AddExpense', { expenseId })`. **Delete** — `#fef2f2` bg / `#dc2626` text, `delete` icon → confirmation.
- Delete confirmation: `Alert.alert('Delete expense?', ..., [Cancel, {text:'Delete', style:'destructive'}])`. On confirm → `deleteExpense(id)` then `navigation.goBack()` (Home reloads on focus). On failure show a friendly inline error; keep the row.
- Loading → simple centered state; error (e.g. not found / RLS) → friendly message + Back.

**Add Expense as create + edit — `src/screens/AddExpenseScreen.tsx`** + `src/navigation/types.ts`:
- `types.ts`: change `AddExpense: undefined` → `AddExpense: { expenseId?: string } | undefined`.
- `AddExpenseScreen`: read optional `route.params.expenseId`. When present (edit mode): fetch via `getExpenseById` on mount, prefill `amount`/`categoryId`/`note`/`date` (`fromDateString`), set title to **"Edit Expense"**, button to **"Save changes"**, and call `updateExpense(expenseId, data)` instead of `createExpense`. Create mode is unchanged. On save → `goBack()` (Detail/Home reload on focus).

## Data / navigation / validation notes

- **Validation:** reuse `expenseInputSchema` unchanged for both create and edit.
- **Navigation:** no new routes. Detail → `AddExpense` (existing transparent-modal sheet) for edit; Detail/Home refresh via existing `useFocusEffect` reloads. Tab bar already hidden on Detail per `docs/ui.md`.
- **Security:** all reads/writes go through RLS (owner-scoped); update/delete never send `user_id`. No new AI calls.
- **Prototype deviation:** prototype deletes immediately; per the request we add a native confirm dialog (`docs/ui.md` §2.9 lists this as TBD).

## Verification

1. `npm run lint` and `npm test` (existing `expense-schema.test.ts` / `date-range.test.ts` still pass; add cases for `fromDateString`/`formatLongDateString` if quick).
2. `npm run android`, then on the emulator run the QA Scenarios below.

## QA Scenarios

- Tap a transaction on Home → Expense Detail opens showing that expense's amount, category (dot + name), long-form date, and note (`—` if empty), matching the prototype.
- Tap **Edit** → Add Expense opens prefilled with the same values and title "Edit Expense"; change the amount and save → returns to Detail (and Home) showing the updated amount.
- Tap **Delete** → confirm dialog appears; tap **Cancel** → nothing changes, still on Detail. Tap **Delete** again → confirm **Delete** → returns to Home with that transaction gone and the total recalculated.
- Open Detail for an expense with no note → Note row shows `—`; category with a since-deleted/`null` category falls back to "Uncategorized" without crashing.
- Trigger a delete/update while offline (or force a service error) → friendly inline error shown, no partial change, screen stays usable.
