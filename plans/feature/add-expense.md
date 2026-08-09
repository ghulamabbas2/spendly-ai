# Add Expense

## Context

The FAB and navigation route already exist (`TabBar.tsx` navigates to `AddExpense`, registered in `AppStack.tsx` with `presentation: 'modal'`), but `AddExpenseScreen.tsx` is still a placeholder stub. `docs/ui.md` §2.2–2.4 fully specifies this screen (amount, category picker, note, date picker, validated Save), and `docs/errors-and-validation.md` already prescribes the exact Zod schema to use. The `expenses-service.ts` currently only has read functions — this feature adds the first write path (`createExpense`). Category management (list/CRUD) and the home dashboard already exist and provide directly reusable patterns (`ReassignCategoryModal.tsx` for a category grid, `useCategories` hook, `useHomeDashboard`'s `reload()`).

Goal: a working Add Expense flow — FAB → modal sheet → validated save → back to Home with the new expense on top.

## Files to create

- **`src/lib/validation/expense-schema.ts`** — per `docs/errors-and-validation.md`:
  ```ts
  export const expenseInputSchema = z.object({
    amount: z.number().positive('Amount must be greater than zero'),
    categoryId: z.string().uuid('Pick a category'),
    note: z.string().max(200).optional(),
    date: z.string().date(),
  });
  export type ExpenseInput = z.infer<typeof expenseInputSchema>;
  ```

- **`src/components/CategoryPickerSheet.tsx`** — bottom sheet modal (same `Modal transparent animationType="fade"` + scrim + sheet shell as `ReassignCategoryModal.tsx`). Props: `visible`, `categories: Category[]`, `selectedId: string | null`, `onSelect(id)`, `onManageCategories()`, `onClose()`. Title "Choose category"; 2-column grid (icon chip + name, `flexDirection: 'row', flexWrap: 'wrap'`, tile width ~48%) using the same selected-state styling (colored border + `hexToRgba(color, 0.13)` tint) as `ReassignCategoryModal`'s option tiles. Footer button "Manage categories" (`tune` icon) calls `onManageCategories` (closes sheet + navigates to `Categories`). Tapping a tile calls `onSelect(id)` then `onClose()` (per §2.3: "selecting a category sets it on the form and returns to the sheet").

- **`src/components/DatePickerModal.tsx`** — center modal (`shadow.modal`, `motion.msgIn` per `docs/design-system.md`) per `docs/ui.md` §2.4. Props: `visible`, `value: Date`, `onSelect(date: Date)`, `onClose()`. Header: `chevron_left` / month-year label / `chevron_right` (local `viewMonth` state, independent of `value`). Weekday row Mon-first. 7-column day grid from the new `getCalendarGrid` helper (below). States: selected = primary fill/white text, today = primary tint bg/primary text, default = transparent/primary text. Tapping a day calls `onSelect(date)` then closes immediately (no confirm button, per spec).

- **`docs/../plans/feature/add-expense.md`** — not created separately; this file is persisted to `./plans/feature/add-expense.md` on approval (per the `plan-feature` skill).

## Files to change

- **`src/lib/date-range.ts`** — add two pure helpers (no React/I-O, per `docs/architecture.md`):
  - `formatLongDate(date: Date): string` → e.g. "Aug 8, 2026" (`Intl.DateTimeFormat` month:'short', day:'numeric', year:'numeric'), reused for the date row and later the detail screen.
  - `getCalendarGrid(monthDate: Date): (Date | null)[][]` → weeks (Mon-first) of the given month, `null` for leading/trailing blanks, for `DatePickerModal`.

- **`src/services/expenses-service.ts`** — add `createExpense(input: ExpenseInput): Promise<Expense>`, following the exact `createCategory` pattern: `supabase.auth.getUser()` → throw on error/missing user → `insert({ user_id, amount: input.amount, category_id: input.categoryId, note: input.note?.trim() || null, date: input.date }).select('*').single()` → throw `Error('Failed to create expense: ...')` on failure, else return the row.

- **`src/screens/AddExpenseScreen.tsx`** — replace the stub with the real form per `docs/ui.md` §2.2 and `design-system.md` tokens (`text.displayXL` 48px/800 for amount, `text.sheetTitle` 19px/800 for the header, `radius.sheet` 30px, `gradient.brand` for the enabled Save button — following the same hardcoded-literal styling convention as `CategoryFormSheet.tsx`, no shared token file exists yet):
  - Header row: title "Add Expense" + close (`×`) icon → `navigation.goBack()`, no save.
  - Amount: large centered `TextInput`, `$` prefix, placeholder `0.00`, `keyboardType="decimal-pad"`, filters input to digits + one `.`.
  - Category row: shows selected icon + name, or muted "Select category"; tap opens `CategoryPickerSheet` (fed by `useCategories()`, already used elsewhere for exactly this list).
  - Note: plain `TextInput`, placeholder "What was it for?", optional.
  - Date row: defaults to today, displays via `formatLongDate`; tap opens `DatePickerModal`.
  - Validation: `canSave = Number(amount) > 0 && !!categoryId && !submitting` gates the button's enabled/disabled visual state (same disabled-grey pattern as `CategoryFormSheet`). On Save, run `expenseInputSchema.safeParse({ amount: Number(amount), categoryId, note, date: toDateString(date) })`; on failure show the relevant field error inline (amount error under the amount input, "Pick a category" under the category row) — this is the friendly-message path per `docs/errors-and-validation.md`, never a raw thrown error for these cases. On parse success, call `createExpense`, wrapped in try/catch; unexpected errors set a generic form-level error ("Couldn't save this expense. Please try again.") and log via `console.error`, never showing `error.message`.
  - On success: `navigation.goBack()`.
  - Use `useSafeAreaInsets()` for top/bottom padding (per `CLAUDE.md` convention, screen is nested under `SafeAreaProvider`).

- **`src/screens/HomeScreen.tsx`** — add a `useFocusEffect` (from `@react-navigation/native`) that calls the existing `reload()` from `useHomeDashboard()` whenever Home regains focus. This is what makes "Save → back to Home with the new expense on top" actually refresh the list (currently `useHomeDashboard` only fetches on mount/`reloadToken` change, and returning from the `AddExpense` modal doesn't remount `HomeScreen`). `getRecentExpenses` already orders by `date desc, created_at desc`, so a newly-created expense naturally sorts to the top once the list is refetched.

## Data / validation notes

- `expenses` table (`docs/database.md`): `amount numeric(12,2) not null`, `category_id uuid` nullable but the UI enforces it required, `note text` optional, `date date not null`, RLS scoped to `auth.uid() = user_id`. No schema changes needed.
- No new dependency — `docs/ui.md` §2.4 specifies a custom calendar, not a native date-picker library, and none is installed; building it from `getCalendarGrid` keeps this dependency-free.
- Edit-mode reuse of this same sheet (`ExpenseDetailScreen`'s "Edit" action) is explicitly out of scope here — `AddExpenseScreen` is built Add-only; wiring edit is a separate follow-up since `ExpenseDetailScreen` is still a stub.

## QA Scenarios

- Tap the FAB → Add Expense sheet opens; enter amount `42.50`, pick a category, leave note blank, keep default date (today), tap Save → sheet closes, Home shows the new expense at the top of Recent Transactions with the category name as title and correct amount.
- On the Add Expense sheet with no amount and no category, the Save ("Add expense") button is disabled/greyed out — it cannot be tapped, so nothing is saved and the sheet stays open. (Validation via `expenseInputSchema` still runs on Save once the button is enabled; the inline field errors are the friendly-message path for an otherwise-submittable form.)
- Enter a negative or zero amount (e.g. `0` or blocked via input filtering) → Save stays disabled/greyed out until a positive amount is entered.
- Tap the category row → Category Picker opens showing all categories in a 2-column grid; tap one → returns to the Add Expense sheet with it selected (colored icon + name shown).
- Tap the date row → Calendar opens defaulting to the current month with today highlighted; pick a different day → calendar closes and the date row updates immediately.
- From the Category Picker, tap "Manage categories" → picker closes and navigates to the Categories screen (Add Expense sheet also dismissed, matching the "no save" close behavior).
