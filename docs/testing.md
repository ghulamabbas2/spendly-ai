# Spendly AI — Testing

Two layers: **Jest** for unit tests, **Maestro** for end-to-end. See [`architecture.md`](architecture.md) for the layer boundaries these tests exercise and [`git-conventions.md`](git-conventions.md) for how test commits are made.

## Principle: every test is independent

No test may depend on another test's side effects, execution order, or shared mutable state — Jest or Maestro. Each test sets up whatever it needs and cleans up after itself. This is what lets tests run in any order, in parallel, or individually (`npm test -- -t "..."`) without surprises.

## Layer 1 — Jest (unit tests)

### What's covered

- **Pure functions and helpers** in `src/lib` (formatting, date math, `getCalendarGrid`, etc.).
- **Zod schemas** in `src/lib/validation` — valid input parses, invalid input produces the expected `fieldErrors`.

Hooks, screens, and components are not covered by this layer — see [Maestro](#layer-2--maestro-end-to-end) below for flow-level coverage. If a hook or screen has meaningful branching logic (e.g. a status-derivation function), extract it into `src/lib` per [`coding-standards.md`](coding-standards.md) so it's unit-testable.

### Location & naming

Unit tests live **next to the file they test**, as `*.test.ts`:

```
src/lib/date-range.ts
src/lib/date-range.test.ts

src/lib/validation/expense-schema.ts
src/lib/validation/expense-schema.test.ts
```

(`__tests__/App.test.tsx` is the template's app-level smoke test and stays where it is — new unit tests do not go in `__tests__/`.)

### Mocking

Any test that touches a file importing the Supabase client or the Claude client must mock `src/services/*` — never let a unit test make a real network call. Mock at the service-function boundary (`jest.mock('@/services/expenses-service')`), not by reaching into the Supabase/Claude SDKs.

```ts
jest.mock('@/services/expenses-service', () => ({
  createExpense: jest.fn(),
}));
```

Since `src/lib` is pure (no clients, no I/O — per [`architecture.md`](architecture.md)), most `src/lib` tests need no mocking at all.

### Running

```
npm test                                   # full suite
npm test -- src/lib/date-range.test.ts     # single file
npm test -- -t "formats a positive amount" # filter by test name
```

## Layer 2 — Maestro (end-to-end)

Maestro drives the real app on an Android emulator through the **QA Scenarios** listed in each feature's plan file (`./plans/<branch>.md` — see the `plan-feature` skill). Each QA Scenario becomes one Maestro flow.

### Setup

Maestro is configured at the **project root**, one directory per feature:

```
.maestro/
  add-expense/
    save-with-valid-input.yaml
    inline-errors-on-empty-submit.yaml
    save-disabled-until-amount-positive.yaml
    ...
  categories/
    ...
  config.yaml            # shared appId / env, if needed
```

Install the Maestro CLI (once, outside the repo) per the [Maestro docs](https://docs.maestro.dev) — this is a system-level CLI, not an npm dependency.

### Writing a flow

- One YAML flow per QA Scenario, named for what it verifies (kebab-case).
- Each flow starts the app fresh (`launchApp` with `clearState: true` or equivalent) and drives only the elements needed for that scenario — no dependency on a previous flow having run first.
- Any data a flow needs (a category to pick, an existing expense) is created by the flow itself (via UI steps or a seeded test account), never assumed to already exist from another flow or a shared fixture.
- Assert on visible UI state (`assertVisible`, text content), not on implementation details.

Example shape, from an Add Expense QA Scenario:

```yaml
appId: com.spendlyai
---
- launchApp:
    clearState: true
- tapOn: 'Add expense'
- tapOn: '0.00'
- inputText: '42.50'
- tapOn: 'Select category'
- tapOn: 'Groceries'
- tapOn: 'Save'
- assertVisible: 'Groceries'
```

### Running

```
maestro test .maestro/add-expense/
maestro test .maestro/add-expense/save-with-valid-input.yaml
```

Run against a live Android emulator (`npm run android` app already installed) — Maestro does not build the app.

## Where each kind of change gets tested

| Change | Jest | Maestro |
|---|---|---|
| New `src/lib` helper | ✅ unit test next to it | — |
| New/changed Zod schema | ✅ unit test next to it | — |
| New service function (`src/services`) | — (mocked, not tested directly) | ✅ exercised indirectly via the flow that uses it |
| New screen/flow | — | ✅ one flow per QA Scenario in the feature's plan |
