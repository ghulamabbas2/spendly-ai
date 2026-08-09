# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SpendlyAI is a React Native 0.86 app (React 19) written in TypeScript. The repository is currently the default React Native template — application code has not yet been added, so most feature work starts from `App.tsx`.

**Android only.** This app targets Android exclusively — iOS is not supported. Ignore the `ios/` directory and never run or maintain iOS builds.

## Commands

- `npm start` — start the Metro bundler (port 8081). If the port is busy: `lsof -ti:8081 | xargs kill -9`.
- `npm run android` — build and run on an Android emulator/device.
- `npm run lint` — ESLint over the project.
- `npm test` — run the Jest suite.
- Run a single test: `npm test -- __tests__/App.test.tsx` or filter by name with `npm test -- -t "renders correctly"`.

Node >= 22.11.0 is required (see `engines` in `package.json`).

## Architecture

- **Entry point**: `index.js` registers the root `App` component with `AppRegistry` under the name from `app.json`.
- **Root component**: `App.tsx` wraps the tree in `SafeAreaProvider` (from `react-native-safe-area-context`) and reads safe-area insets in child components. Follow this pattern — consume insets via `useSafeAreaInsets()` inside a component nested under the provider, not at the root.
- **Native project**: `android/` (Gradle) holds the platform shell. Metro bundles JS/TS from the project root. (An `ios/` directory exists from the template but is unused — this is an Android-only app.)
- **Tests**: live in `__tests__/`, using `@react-native/jest-preset` (configured in `jest.config.js`) with `react-test-renderer`.

## Conventions

- Prettier config (`.prettierrc.js`): single quotes, trailing commas, no bracket spacing, arrow parens avoided.
- ESLint extends `@react-native` (`.eslintrc.js`).
- Files use the `@format` docblock pragma to opt into Prettier formatting.

## Live Docs (Context7)

Before writing or modifying code that uses an external library, framework, SDK, or CLI — including React Native, React, React Navigation, Supabase (client + Edge Functions), Zod, and Jest — pull the current documentation through the Context7 MCP first. Do not rely on training data for API signatures, configuration, or version-specific behavior; verify them against Context7.

- Start with `resolve-library-id` (unless given an exact `/org/project` ID), then `query-docs` scoped to a single concept. Split multi-concept questions into separate `query-docs` calls.
- If Context7 has no entry for a library, say so explicitly before proceeding, then fall back to other sources.
- This applies even to well-known libraries — recent releases may have changed the API.

## Design Prototype (Claude Design)

`docs/ui.md` links a **Claude Design** prototype (`https://claude.ai/design/p/...`) — the authoritative visual source for every screen and component. Before building or styling any screen, component, or navigation UI:

- Use the `DesignSync` tool (`get_project` / `list_files` / `get_file`) against that project to read the actual prototype markup — exact colors, gradients, spacing, icon names, and layout — not just the token summaries in `docs/design-system.md` and `docs/ui.md`. Those docs are a distilled reference; the prototype file (`Spendly AI.dc.html`) is the ground truth and can contain details (e.g. exact gap widths, gradients, real icon names) the summaries omit.
- `WebFetch` cannot reach `claude.ai/design` links (403 — authenticated). Do not try it for this URL; go straight to `DesignSync`.
- Match the corresponding prototype screen precisely — layout, spacing, colors, gradients, and icons — rather than approximating from tokens alone.

## Doc Convention

Whenever a new file is created in `/docs`, add it to the **Project Docs** section below with one line covering what it contains and when to read it.

### Project Docs

- [`docs/architecture.md`](docs/architecture.md) — folder structure, naming conventions, state management, and the data-flow rules (screens → hooks → services → Supabase/Claude). Read before adding files or wiring up data access.
- [`docs/design-system.md`](docs/design-system.md) — foundational design tokens (color, type, spacing, etc.) extracted from the prototype. Read when styling components or defining shared visual values.
- [`docs/ui.md`](docs/ui.md) — screen-by-screen and component-by-component UI spec, referencing tokens from `design-system.md`. Read when building or laying out screens and components.
- [`docs/database.md`](docs/database.md) — Supabase/Postgres schema (`profiles`, `expenses`, `categories`), RLS policies, indexes, and default-category seeding. Read when working with data models, queries, or the service layer.
- [`docs/auth.md`](docs/auth.md) — Supabase email/password auth, session handling/refresh, session-based root navigation, and DB-enforced identity via RLS. Read when working on auth flows, session state, or navigation gating.
- [`docs/data.md`](docs/data.md) — data-access pattern: service layer in `src/services`, the "return typed data or throws" contract, screens handling loading/error, and AI calls routed through a Supabase Edge Function (never Anthropic directly). Read when writing services, data fetching, or AI integration.
- [`docs/coding-standards.md`](docs/coding-standards.md) — TypeScript strict mode, Prettier/ESLint, import ordering, typed function components, async/await, error handling, and component/hook/helper structure. Read before writing or reviewing code.
- [`docs/errors-and-validation.md`](docs/errors-and-validation.md) — Zod validation (shared schemas in `src/lib/validation`), expected failures as typed inline results vs. unexpected errors caught at the screen with friendly messages, and required loading/error UI states for AI/network calls. Read when building forms, validation, or error handling.
- [`docs/security.md`](docs/security.md) — secrets in gitignored `.env` (with `.env.example`), keeping the Claude API key server-side via the Edge Function, RLS-enforced data ownership, and minimal/disclosed financial data to the AI. Read when handling secrets, keys, or data shared with the AI.
- [`docs/git-conventions.md`](docs/git-conventions.md) — Conventional Commits with imperative subjects, `type/feature` branch naming, and the branch → PR → human review → merge workflow (never straight to main). Read before committing, branching, or opening a PR.
- [`docs/testing.md`](docs/testing.md) — two-layer testing: Jest unit tests (`*.test.ts` next to the file, mocked services) for `src/lib` helpers and Zod schemas, and Maestro E2E flows (`.maestro/<feature>/`) driving each feature's QA Scenarios on an Android emulator. Read before writing tests or QA-scenario flows.
