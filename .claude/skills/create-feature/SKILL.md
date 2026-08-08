---
name: create-feature
description: Build an approved feature — write the implementation code following the persisted plan and the /docs conventions. Use whenever the user starts building or implementing a feature whose plan has already been approved, or says things like "build it", "implement the plan", "start building", "let's build this", or "code it up". Reads the approved plan and relevant docs first, pulls live library docs via Context7, matches the prototype for any UI, then writes code only — no tests, no commits — and hands back.
---

# Create Feature

Run this **after a plan has been approved** (see [`plan-feature`](../plan-feature/SKILL.md)). It builds the feature from the persisted plan, following project conventions. It writes **code only** — it does not write tests and does not commit.

## Workflow

1. **Load the approved plan.** Determine the branch with `git branch --show-current`, then read `./plans/<branch>.md`. This is the source of truth for what to build — the files to create/change, data/navigation/validation notes, and scope. If no plan file exists, stop and tell the user to run `plan-feature` first — do not improvise a plan.

2. **Read the relevant docs first.** Before writing code, read the `/docs` files the plan touches so the implementation matches conventions. Always consult:
   - [`docs/architecture.md`](../../../docs/architecture.md) — folder structure, naming, state management, data-flow rules (screens → hooks → services → Supabase/Claude).
   - [`docs/coding-standards.md`](../../../docs/coding-standards.md) — TypeScript strict mode, import ordering, typed components, async/await, error handling, component/hook/helper shape.
   - [`docs/data.md`](../../../docs/data.md) — service layer, "return typed data or throws" contract, AI via Edge Function (never call Anthropic directly).
   - Plus the docs matching the feature area:
     - [`docs/ui.md`](../../../docs/ui.md) + [`docs/design-system.md`](../../../docs/design-system.md) — for any screen or component.
     - [`docs/database.md`](../../../docs/database.md) — for schema, queries, RLS.
     - [`docs/auth.md`](../../../docs/auth.md) — for auth flows, session state, navigation gating.
     - [`docs/errors-and-validation.md`](../../../docs/errors-and-validation.md) — for forms, Zod schemas, validation, loading/error states.
     - [`docs/security.md`](../../../docs/security.md) — for secrets, keys, data shared with the AI.

3. **Pull live library docs via Context7.** Before writing or modifying code that uses an external library, framework, SDK, or CLI (React Native, React, React Navigation, Supabase client + Edge Functions, Zod, Jest, etc.), fetch current docs through Context7 first — per the Live Docs rule in `CLAUDE.md`. Do not rely on training data for API signatures, config, or version-specific behavior. Start with `resolve-library-id`, then `query-docs` scoped to a single concept.

4. **Match the prototype for UI.** For any screen or component, open the prototype linked at the top of [`docs/ui.md`](../../../docs/ui.md) and build the UI to match the corresponding screen — layout, spacing, and visuals — using the tokens from `docs/design-system.md`. The UI should visually match the prototype, not approximate it.

5. **Build the feature.** Implement exactly what the approved plan specifies — the listed files, in the conventional locations. Follow the data-flow rules (screens → hooks → services → Supabase/Claude), the service contract, and the coding standards. If you discover the plan is wrong or incomplete mid-build, stop and surface it rather than silently expanding scope.

## Boundaries

- **Code only.** Do not write or modify tests. The user triggers `write-tests` explicitly when ready.
- **Do not commit.** Leave all changes in the working tree; do not stage, commit, branch, or push.
- **Stay in scope.** Build what the plan approved — no extra features, refactors, or "while I'm here" changes.

## When done

Stop and hand back. Report **what was built in 2–3 lines** (the key files and what they do). Do not run tests, do not commit, and do not start the next step — the user will trigger `write-tests` when ready.
