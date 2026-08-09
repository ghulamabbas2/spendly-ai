---
name: write-tests
description: Write Jest unit tests for a feature following docs/testing.md. Use whenever the user asks to write, add, or update tests for a feature, screen, hook, or helper — or says things like "write tests for this", "add tests", "test this feature", or "cover this with tests". Reads docs/testing.md first, then writes *.test.ts files next to the code they test, mocking Supabase and Claude services at the service-function boundary. Writes tests only — does not run them, does not commit — and hands back.
---

# Write Tests

Run this **after a feature has been built** (see [`create-feature`](../create-feature/SKILL.md)). It writes the Jest unit-test layer for a feature, following [`docs/testing.md`](../../../docs/testing.md). It writes **tests only** — it does not run them and does not commit.

## Workflow

1. **Read `docs/testing.md` first.** This is the source of truth for what gets a Jest test, where the file goes, and how mocking works. Do not improvise a different layout or convention.

2. **Identify what needs coverage.** Per `docs/testing.md`, Jest covers:
   - Pure functions/helpers in `src/lib` (formatting, date math, etc.).
   - Zod schemas in `src/lib/validation` (valid input parses; invalid input produces the expected `fieldErrors`).
   - Hooks, screens, and components are **not** unit-tested — that's Maestro's job, out of scope for this skill. If a hook/screen has branching logic that isn't already extracted into `src/lib`, don't extract it yourself — note it and cover only what's already testable, or ask the user to extract it first.

3. **Place tests correctly.** Next to the file they test, as `*.test.ts` — never in `__tests__/` (that directory holds only the template's app-level smoke test).
   ```
   src/lib/date-range.ts
   src/lib/date-range.test.ts
   ```

4. **Mock at the service boundary.** Any code path that touches a file importing the Supabase client or the Claude client must have `src/services/*` mocked (`jest.mock('@/services/expenses-service')`) — never let a test hit the Supabase or Claude SDKs directly, and never mock by reaching into those SDKs. Pure `src/lib` code needs no mocking.

5. **Keep every test independent.** No test may depend on another test's side effects, ordering, or shared mutable state — each test sets up and cleans up its own fixtures.

6. **Write the tests.** Cover the valid/expected path plus the meaningful edge and error cases (invalid input, boundary values, thrown errors from mocked services) — matching the style of existing `*.test.ts` files in the repo where present.

## Boundaries

- **Tests only.** Do not modify implementation code (`src/lib`, `src/services`, screens, hooks) except to add the new `*.test.ts` files. If a test reveals a real bug, stop and report it rather than silently fixing the implementation.
- **Do not run the tests.** Do not invoke `npm test`. The user runs them when ready.
- **Do not commit.** Leave all changes in the working tree; do not stage, commit, branch, or push.
- **No Maestro.** This skill covers the Jest layer only — end-to-end flows are a separate, explicit task.

## When done

Stop and hand back. Report **what was added in 2–3 lines** (which test files, covering what). Do not run tests, do not commit, and do not start any follow-on work.
