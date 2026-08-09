# Category Management

## Context

Categories already exist as a read-only concept (`categories` table, `getCategories()` service, `Category` type) and are seeded per-user on signup. `docs/database.md` explicitly states categories are meant to be user-owned and fully manageable ("create, rename, recolor, and delete their own"), but no CRUD UI exists yet. `docs/ui.md` §2.8 specifies a "Categories" pushed screen but marks edit/add/delete UX as **TBD** in the prototype — this plan fills that gap with a concrete design.

Entry points: `ProfileScreen`'s "Manage categories" row already exists but is unwired (no `onPress`). The Add Expense category picker (`docs/ui.md` §2.3) doesn't exist yet because `AddExpenseScreen` is currently a bare stub with no form. Per user decision, this plan does **not** build the Add Expense form or its picker — it only ensures `Categories` is a properly registered stack screen so a future picker's "Manage categories" footer button can navigate to it the same way `ProfileScreen` will.

## Delete rule (decision)

The `expenses.category_id` FK has no `ON DELETE CASCADE`/`SET NULL` (per `docs/database.md`), so the DB already rejects deleting a category that's still referenced. The app makes this a good UX instead of a raw FK error:

- **Category has 0 expenses** → delete immediately after a simple confirm ("Delete this category?").
- **Category has ≥1 expenses** → block direct delete; show a reassignment step: "This category has N expenses. Choose a category to move them to," listing the user's other categories. On confirm, expenses are bulk-reassigned to the chosen category, then the category is deleted (one service call, one user action).
- **Category is the user's only category** → deletion is blocked entirely with a friendly message ("You need at least one category") since there's nothing to reassign to.

## Files to create

- `src/lib/validation/category-schema.ts` — `categoryInputSchema` (Zod): `name` (trim, min 1, max 40), `icon` (string, min 1), `color` (hex string, regex `/^#[0-9a-f]{6}$/i`). Mirrors `auth-schema.ts` / the prescribed `expense-schema.ts` style in `docs/errors-and-validation.md`.
- `src/hooks/use-categories.ts` — owns `categories`/`loading`/`error`/`reload` state (pattern from `use-home-dashboard.ts`), plus thin async wrappers `create`, `update`, `remove` that call the service and reload on success.
- `src/components/CategoryFormSheet.tsx` — bottom-sheet modal (per `radius.sheet`/`shadow.sheet` tokens) with a name input, an icon grid picker, and a color swatch grid picker. Used for both **add** and **edit** (title "New category" / "Edit category"; Save disabled until name is non-empty, matching the Add Expense Save-button disabled pattern in `docs/ui.md`). Icon choices: the 10 icons from the design-system category palette table plus a few generic extras (`home`, `work`, `school`, `pets`, `savings`, `card_giftcard`). Color choices: the 10 category-palette hexes plus the 6 new-category cycling hexes from `docs/design-system.md` §1.7.
- `src/components/ReassignCategoryModal.tsx` — confirm dialog shown when deleting a category with existing expenses; lists remaining categories to pick a reassignment target, calls `deleteCategory(id, targetId)` on confirm.
- `src/screens/CategoriesScreen.tsx` — per `docs/ui.md` §2.8: header with back arrow, subtitle "{N} categories · used across all your expenses", list rows (icon chip w/ 13%-tint background via existing `hexToRgba`, name, color dot, `edit` icon opening `CategoryFormSheet` in edit mode), dashed-outline "Add category" button opening `CategoryFormSheet` in create mode, trash/delete icon per row driving the delete rule above. Uses `EmptyState`, `Skeleton`-style loading, and error-with-retry states consistent with `HomeScreen`.

## Files to change

- `src/services/categories-service.ts` — add:
  - `createCategory(input: CategoryInput): Promise<Category>`
  - `updateCategory(id: string, input: CategoryInput): Promise<Category>`
  - `deleteCategory(id: string, reassignToCategoryId?: string): Promise<void>` — if `reassignToCategoryId` is given, bulk-update `expenses.category_id` for that category first, then delete the row; otherwise delete directly (works only when unreferenced, per the FK).
  All follow the existing "return typed data or throws" contract (`docs/data.md`).
- `src/services/expenses-service.ts` — add `countExpensesByCategory(categoryId: string): Promise<number>` (a `select('id', {count:'exact', head:true})` filtered by `category_id`), used by `CategoriesScreen` to decide whether to show the simple confirm or the reassignment modal before calling `deleteCategory`.
- `src/navigation/types.ts` — add `Categories: undefined` to `AppStackParamList`.
- `src/navigation/AppStack.tsx` — register `CategoriesScreen` as a plain push (like `ExpenseDetail`, not a modal), so the native back arrow works and the tab bar hides per `docs/ui.md`'s transitions table.
- `src/screens/ProfileScreen.tsx` — give the screen a composite navigation prop (tab `Profile` + stack, same shape as `HomeScreen`'s), wire the "Manage categories" row's `onPress` to `navigation.navigate('Categories')`, and set its `value` to the live category count (fetch via `useCategories()` or a lightweight `getCategories()` call).

## Manual Test Scenarios

- Open Profile → tap "Manage categories" → Categories screen opens, shows the correct count and all seeded categories with correct icons/colors.
- Tap "Add category", enter a name, pick an icon and color, save → new category appears in the list immediately and persists after navigating away and back.
- Edit an existing category's name/icon/color → list updates immediately and the change is reflected on Home's "Top categories" (uses the same category data).
- Delete a category with no expenses → simple confirm, category disappears, count decrements.
- Delete a category that has expenses → reassignment modal appears listing other categories; pick one, confirm → expenses move to the chosen category, the deleted category is gone, no orphaned `category_id`.
- Try to delete the user's only remaining category → blocked with a friendly "you need at least one category" message, nothing deleted.
- Sign in as a different user (or fresh signup) → only that user's categories are visible (RLS boundary), never another user's.
