---
name: plan-feature
description: Plan and scope a new feature before writing any code. Use whenever the user starts, plans, scopes, or designs a new feature, screen, or flow — or says things like "let's add", "I want to build", "next feature", "how should we approach", or "plan out". Enters Plan Mode, produces a short technical plan grounded in the /docs conventions with QA Scenarios, waits for explicit approval, and writes the approved plan to ./plans/<branch>.md before any implementation.
---

# Plan Feature

Run this at the **start of every new feature, before any code is written.** It produces a short, reviewable technical plan and blocks implementation until the plan is explicitly approved.

## Workflow

1. **Enter Plan Mode.** Use `EnterPlanMode`. Do not create, edit, or write any code files while planning.

2. **Read the relevant docs first.** Ground the plan in project conventions by reading the docs that apply. Always consult:
   - [`docs/architecture.md`](../../../docs/architecture.md) — folder structure, naming, state management, data-flow rules (screens → hooks → services → Supabase/Claude).
   - Navigation — covered in [`docs/auth.md`](../../../docs/auth.md) (session-based root navigation, gating) and [`docs/ui.md`](../../../docs/ui.md) (screen layout). There is no dedicated `navigation.md`.
   - [`docs/database.md`](../../../docs/database.md) — schema, RLS, indexes, seeding.
   - [`docs/data.md`](../../../docs/data.md) — service layer, "return typed data or throws" contract, AI via Edge Function.
   - Plus the doc matching the feature area (e.g. `errors-and-validation.md` for forms, `security.md` for secrets/keys, `design-system.md`/`ui.md` for visuals, `coding-standards.md` for code shape).

   If a feature touches a library (React Native, React Navigation, Supabase, Zod, Jest, etc.), pull current docs via Context7 before asserting API details — per the Live Docs rule in `CLAUDE.md`.

3. **Write the plan.** Keep it short and technical. Include:
   - **Summary** — one or two sentences on what the feature does.
   - **Files to create / change** — a bullet list of paths, each with a one-line note on what it holds and which doc convention it follows (cite the doc, e.g. "per `docs/data.md` service contract").
   - **Data / navigation / validation notes** — only what's non-obvious: new tables or queries, new routes, Zod schemas, Edge Function calls.
   - **QA Scenarios** (see below).

4. **Wait for explicit approval.** Present the plan via `ExitPlanMode` and stop. Do **not** write any code until the user explicitly approves. Approval of the plan is not approval to skip review of the code that follows.

5. **On approval, persist the plan.** Determine the branch with `git branch --show-current`, then write the full approved plan to `./plans/<branch>.md` (create the `plans/` directory if needed). Do this **before** handing off to implementation.

## QA Scenarios

End every plan with a `## QA Scenarios` section: **3–6 concrete scenarios** the user will run on the Android emulator. Cover, at minimum:

- **Happy path** — the feature working as intended.
- **Auth boundary** — behavior for signed-out / wrong-user / RLS-denied access.
- **Validation** — invalid or malformed input is rejected with a friendly message.
- **Edge cases** — empty state, network/AI failure, boundary values, or concurrency.

Format each as a single line: **what the user does → what should happen.**

Example:
- Add an expense with a valid amount and category → it appears at the top of the list and persists after reload.
- Open the expenses screen while signed out → redirected to sign-in; no data visible.
- Submit the expense form with an empty amount → inline validation error, nothing saved.
- Save an expense while offline → friendly error shown, no partial/duplicate row created.
