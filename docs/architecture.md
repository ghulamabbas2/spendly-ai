# SpendlyAI — Architecture

SpendlyAI is a bare **React Native CLI** app written in **TypeScript**, targeting **Android only**. This document describes how the codebase is organized and the rules that keep it consistent.

## Platform

- **Android only.** iOS is not supported. Do not add iOS-specific configuration, permissions, or `Platform.OS` branches. Ignore the `ios/` directory from the template.
- Bare React Native CLI (not Expo). Native code lives in `android/`; Metro bundles JS/TS from the project root.

## Folder structure

All application code lives under `src/`:

```
src/
  screens/       # Full-screen views, one per route
  components/    # Reusable presentational components
  navigation/    # Navigators, route config, navigation types
  services/      # External clients: Supabase + Claude API
  hooks/         # Reusable React hooks
  types/         # Shared TypeScript types and interfaces
  lib/           # Pure helpers / utilities (no React, no I/O)
```

### `src/screens`
Full-screen components mounted by the navigator. A screen composes components, calls hooks, and orchestrates data flow — it does **not** talk to Supabase or Claude directly. Screens read and write data only through the service layer (usually via a hook that wraps a service).

### `src/components`
Reusable UI building blocks (buttons, cards, list items, inputs). Presentational and composable; they receive data and callbacks via props and stay free of data-fetching logic.

### `src/navigation`
Navigator definitions, the route registry, and navigation-related types (param lists). This is the single place that knows how screens connect to one another.

### `src/services`
The data access layer. Contains the **Supabase client** and the **Claude API client**, plus the functions that wrap them. All reads, writes, and API calls go through here. This is the only layer permitted to import the Supabase or Claude SDKs.

### `src/hooks`
Reusable hooks. Hooks bridge screens/components and services — e.g. a hook calls a service function, manages loading/error state, and exposes data to a screen.

### `src/types`
Shared TypeScript types and interfaces used across layers (domain models, API shapes, DTOs).

### `src/lib`
Pure helper functions and utilities: formatting, parsing, date math, calculations. No React, no side effects, no I/O — keep these easy to unit-test.

## Naming conventions

- **Screens are PascalCase**, matching their component name: `HomeScreen.tsx`, `TransactionsScreen.tsx`.
- **Reusable components are PascalCase**, one component per file: `SpendCard.tsx`, `CategoryPill.tsx`.
- **Non-component files are kebab-case**: services, hooks, lib helpers, and type modules.
  - Services: `supabase-client.ts`, `claude-client.ts`, `transactions-service.ts`
  - Hooks: `use-transactions.ts`, `use-insights.ts`
  - Lib: `format-currency.ts`, `date-range.ts`
  - Types: `transaction.ts`, `insight.ts`

## State management

- State is **local component state or React Context** — no external state management library.
- Local state (`useState`/`useReducer`) for view-specific concerns.
- Context for cross-cutting state that many screens need (e.g. session, user preferences).

## Data flow

Data comes from **Supabase**, accessed exclusively through the service layer.

```
Screen  ──uses──▶  Hook  ──calls──▶  Service  ──▶  Supabase / Claude API
   │                                    │
   └────────────── data ◀───────────────┘
```

Rules:

1. **Screens never call Supabase or Claude directly.** They go through services (typically via a hook).
2. **Services own all external I/O.** The Supabase and Claude clients are instantiated and used only in `src/services`.
3. **Hooks adapt services for React**, handling loading/error state and exposing data to the UI.
4. **`src/lib` stays pure** — it holds no clients and performs no I/O.

## Services in detail

- **Supabase client** (`src/services`): database reads/writes and auth. The single source of persisted data.
- **Claude API client** (`src/services`): AI features (spending insights, categorization, natural-language queries). Wrapped by service functions so screens/hooks never touch the raw client.

## Testing

- Tests live in `__tests__/`, using `@react-native/jest-preset`.
- `src/lib` helpers are the easiest and highest-value unit-test targets (pure functions).
- Mock the service layer when testing hooks and screens so tests don't hit Supabase or Claude.
