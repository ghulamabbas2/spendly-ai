# Insights Screen

## Context

The Insights tab (`src/screens/InsightsScreen.tsx`) is still the default placeholder — it renders a centered "Insights" label and nothing else, even though it's wired into the tab bar (`TabNavigator.tsx`) and linked from Home's "View all". This builds out the real screen per prototype section **2.6 Insights** (`docs/ui.md:118`) and the ground-truth prototype markup (`Spendly AI.dc.html`, `<!-- INSIGHTS -->` block).

The screen is driven by a **custom date range** (FROM / TO), unlike Home which uses fixed week/month/year periods. The range drives four cards below it: total-in-range + spend-over-time chart, category breakdown, and biggest categories. When the range has no expenses, the cards collapse to an empty state (the range picker stays visible so the user can widen it).

**Decisions:** default range = 1st of current month → today ("this month so far"); chart supports **both Bar (default) and Line**, switched by an in-screen toggle (there's no settings/tweak system yet to carry the prototype's `chartStyle` tweak).

## Approach

Follow the established screen → hook → service → lib layering (`docs/architecture.md`, `docs/data.md`). All aggregation math lives in a pure, unit-testable lib module; the hook orchestrates fetch + range state; the screen renders and matches the prototype exactly.

Reuse what already exists — do **not** rebuild:
- `getExpensesInRange(start, end)` in `src/services/expenses-service.ts` (end is **exclusive** — pass `TO + 1 day` for an inclusive TO).
- `getCategories()` in `src/services/categories-service.ts`.
- `DatePickerModal` (`src/components/DatePickerModal.tsx`) — single-date calendar, already used by Add Expense; drive it for both endpoints.
- `CategoryProgressRow` (`src/components/CategoryProgressRow.tsx`) — the breakdown row is identical except the amount cell shows `"$X · N%"`; pass that combined string as the existing `amount` prop, no component change needed.
- `Card`, `EmptyState`, `Skeleton`, `CategoryProgressRowSkeleton`; `formatCurrency`; `hexToRgba` + `toMaterialIconName` (for tiles); date helpers `toDateString` / `formatShortDate` / `fromDateString` in `src/lib/date-range.ts`.
- `react-native-svg` (`Svg`, `Rect`, `Polyline`, `Polygon`) — already a dependency, used in `HomeScreen.tsx`.

## Files to create / change

- **`src/lib/insights.ts`** (new) — pure aggregation helpers, per `docs/testing.md` (testable lib logic):
  - `bucketSpendOverTime(expenses, start, endExclusive)` → up to **8** buckets across the range (weekly when the range is ≤ 8 weeks, otherwise equal-width buckets of `ceil(days/8)` days). Each bucket: `{ label: formatShortDate(bucketStart), total }`. Returns bar geometry-ready totals (screen/chart component maps to SVG coords).
  - `buildCategoryBreakdown(expenses, categories)` → all categories with spend in range, sorted desc: `{ id, name, icon, color, tint, amount, pct, barWidthPercent }` (pct = share of range total; barWidthPercent normalized to the largest, matching Home).
  - `biggestCategories(breakdown, 3)` → top 3 for the tiles.
- **`src/lib/insights.test.ts`** (new) — Jest unit tests for the three helpers: bucket counts/labels, ≤8-bar cap, empty range, percentage/sort correctness. (Written later via the write-tests flow; listed here so the shape is testable.)
- **`src/hooks/use-insights.ts`** (new) — mirrors `use-home-dashboard.ts`. Holds `rangeStart` / `rangeEnd` state (default: `startOfMonth(now)` → `today`), fetches `getCategories()` + `getExpensesInRange(rangeStart, rangeEnd+1day)` in `Promise.all` on range/reload change, exposes `loading`, `error`, `reload`, `rangeStart`, `rangeEnd`, `setRangeStart`, `setRangeEnd`, `rangeTotal`, `rangeCount`, `chartBuckets`, `breakdown`, `biggest`, `hasExpenses`. Applies the collapse rule on set: a start after end (or end before start) collapses both to the picked day (`docs/ui.md:92`).
- **`src/components/SpendChart.tsx`** (new) — SVG chart in a `viewBox="0 0 300 120"`; `style: 'bar' | 'line'` prop. Bar = one `Rect` (rx 4, `#7c3aed`) per bucket; Line = `Polygon` filled area (opacity .1) + `Polyline` (stroke `#7c3aed`, width 2.5). Bucket start-date labels row below. Matches the prototype `<svg>` exactly.
- **`src/components/BiggestCategoryTile.tsx`** (new) — tile: solid-color icon chip (white glyph) on a tinted rounded card, name (ellipsized), amount. Matches prototype tile markup.
- **`src/screens/InsightsScreen.tsx`** (replace placeholder) — `ScrollView` (`paddingTop:56, paddingHorizontal:20, paddingBottom:120`), title "Insights" (24/800). Cards top→bottom:
  1. **Date range** card: "DATE RANGE" caption + FROM / `arrow_forward` / TO buttons; each opens `DatePickerModal` for its endpoint.
  2. **Total in range** card: "Total in range" + "{N} txns", `rangeTotal` (32/800), "Spend over time" + Bar/Line **toggle**, then `<SpendChart>`.
  3. **Category breakdown** card: `CategoryProgressRow` per breakdown item (amount = `"$X · N%"`).
  4. **Biggest categories** card: row of up to 3 `<BiggestCategoryTile>`.
  - `useFocusEffect(reload)` like Home. **Loading** → skeletons (chart placeholder + `CategoryProgressRowSkeleton` rows). **Error** → error box + Retry (copy from Home). **Empty range** (no expenses) → keep the Date range card, replace cards 2–4 with `EmptyState` (icon `bar-chart` / `insights`, "No spending in this range", "Try widening your date range.").

## Data / navigation / validation notes

- No schema, table, RLS, or navigation changes — screen and tab route already exist; RLS already scopes `expenses`/`categories` to the signed-in user (`docs/database.md`).
- No new service function — reuse `getExpensesInRange`; the hook passes `endExclusive = rangeEnd + 1 day` so the TO date is inclusive.
- No Zod/validation — the calendar constrains input to valid dates; the collapse rule prevents an inverted range, so no free-text validation is needed.
- Per `CLAUDE.md` Live Docs: during implementation, confirm `react-native-svg` `Rect`/`Polyline`/`Polygon` props and RN `ScrollView`/`Modal` usage via Context7 before finalizing (the repo already demonstrates the pattern in `HomeScreen.tsx`).

## QA Scenarios

- Open Insights with expenses this month → range shows "This month so far" (1st → today); total, chart bars, breakdown, and biggest-categories tiles all reflect that range.
- Tap FROM, pick an earlier date, then tap TO, pick a later date → every card recomputes for the new range; the chart shows up to 8 labeled buckets.
- Set FROM to a date after the current TO → both endpoints collapse to the picked day (per prototype rule); no inverted/empty-garbage state.
- Pick a range with no expenses (e.g. a future week) → Date range card stays; cards 2–4 replaced by the empty state prompting to widen the range.
- Toggle Bar ⇄ Line → the same data redraws as bars vs. a filled line, no reload, totals unchanged.
- Open Insights while signed out / as another user → RLS returns no rows; empty state shown, no other user's data visible.
- Kill network then open Insights → friendly error box with a working Retry button (no crash, no partial render).
