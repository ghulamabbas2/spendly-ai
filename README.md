# SpendlyAI

> AI‑powered personal expense tracking for Android — log spending, understand it, and chat with your money.

SpendlyAI is a React Native (Android‑only) app that turns raw expenses into insight. You capture transactions in seconds, organize them into budget‑aware categories, and ask an AI assistant plain‑language questions about your spending. Every AI feature runs server‑side through a Supabase Edge Function that holds the Claude API key — the app never talks to Anthropic directly, and only the minimum, user‑scoped data ever leaves the device.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Backend Setup (Supabase)](#backend-setup-supabase)
- [Running the App](#running-the-app)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security & Privacy](#security--privacy)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Fast expense capture** — add an expense with amount, category, date, and notes in a couple of taps.
- **Categories & budgets** — create categories with icons and colors, set budgets, and track progress per period.
- **Home dashboard** — a live snapshot of recent spend, biggest category, and period totals.
- **Insights** — spend charts and trends over selectable time ranges.
- **AI Chat** — ask natural‑language questions ("How much did I spend on food last month?") answered by Claude, working from computed summaries first and raw rows only when a question truly needs them.
- **Secure auth** — Supabase email/password auth with session‑based navigation gating and RLS‑enforced data ownership.
- **Polished UX** — skeleton loaders, empty states, bottom sheets, and a safe‑area‑aware layout throughout.

## Tech Stack

| Layer | Technology |
| --- | --- |
| App | React Native 0.86, React 19, TypeScript (strict) |
| Navigation | React Navigation 7 (native‑stack + bottom‑tabs) |
| State/Data | Custom hooks over a typed service layer |
| Backend | Supabase (Postgres, Auth, Row‑Level Security) |
| AI | Claude via a Supabase Edge Function (Deno) |
| Validation | Zod |
| Icons/UI | `@react-native-vector-icons/material-icons`, `react-native-svg`, `react-native-safe-area-context`, `react-native-gesture-handler` |
| Testing | Jest (unit) + Maestro (E2E) |
| CI/CD | GitHub Actions → Gradle AAB → Google Play Developer API |

> **Android only.** This app targets Android exclusively. The `ios/` directory exists from the RN template but is unused and unsupported.

## Architecture

SpendlyAI follows a strict, one‑directional data flow. UI never touches the database or the AI directly:

```
Screens ──▶ Hooks ──▶ Services ──▶ Supabase (Postgres + Auth + RLS)
                          │
                          └────────▶ Supabase Edge Function ──▶ Claude API
```

- **Screens** (`src/screens`) render UI and own loading/error states.
- **Hooks** (`src/hooks`) orchestrate data for a screen and expose typed state.
- **Services** (`src/services`) are the only layer that calls Supabase or the Edge Function. Each function returns typed data or throws.
- **Edge Function** (`supabase/functions/chat`) holds the Claude API key and is the *only* thing that calls Anthropic. The app calls the function, never the model.
- **RLS** enforces that a user can only ever read or write their own rows — identity is enforced in the database, not just the client.

## Project Structure

```
SpendlyAI/
├── App.tsx                     # Root component (SafeAreaProvider + navigation)
├── index.js                    # AppRegistry entry point
├── src/
│   ├── screens/                # HomeScreen, AddExpense, Insights, Chat, Profile, ...
│   ├── components/             # Reusable UI (Card, TransactionRow, SpendChart, sheets, skeletons)
│   ├── navigation/             # RootNavigator, AuthStack, AppStack, TabNavigator
│   ├── hooks/                  # use-auth, use-home-dashboard, use-insights, use-chat, ...
│   ├── services/               # supabase-client, auth/expenses/categories/profiles/ai services
│   ├── lib/                    # helpers (format-currency, date-range, insights) + validation/ (Zod)
│   └── types/                  # shared TypeScript types
├── supabase/
│   ├── functions/chat/         # Deno Edge Function that calls Claude
│   ├── migrations/             # SQL schema + RLS
│   └── config.toml
├── android/                    # Native Android project (Gradle)
├── docs/                       # Architecture, design system, auth, security, deployment, ...
├── __tests__/                  # Jest tests
└── .github/workflows/          # CI: PR check + release
```

## Prerequisites

- **Node.js >= 22.11.0** (see `engines` in `package.json`)
- **JDK 17** and the **Android SDK** (Android Studio recommended)
- An Android emulator or a physical device with USB debugging
- A **Supabase** project (URL + anon key)
- An **Anthropic (Claude) API key** — used only on the Edge Function, never in the app
- The **Supabase CLI** (for migrations and deploying the Edge Function)

Complete the React Native [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide (Android target) before continuing.

## Getting Started

```bash
# 1. Clone
git clone https://github.com/ghulamabbas2/spendly-ai.git
cd spendly-ai

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
#   then fill in SUPABASE_URL and SUPABASE_ANON_KEY (see below)
```

## Environment Variables

App runtime config lives in a gitignored `.env` (loaded via `react-native-dotenv` and imported through `@env`). Copy `.env.example` and fill in:

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | App | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | App | Public anon key (safe on device; RLS protects data) |
| `ANTHROPIC_API_KEY` | **Edge Function only** | Set on the Supabase Edge Function secrets — **never** in the app `.env` |

Release/signing secrets (keystore, Play service account) are documented in `.env.example` and live as CI secrets, never in the repo. See [`docs/deployment.md`](docs/deployment.md).

## Backend Setup (Supabase)

```bash
# Link the CLI to your project
supabase link --project-ref <your-project-ref>

# Apply the database schema + RLS policies
supabase db push

# Set the Claude key as an Edge Function secret (server-side only)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy the AI chat function
supabase functions deploy chat
```

Schema (`profiles`, `expenses`, `categories`), RLS policies, indexes, and default‑category seeding are described in [`docs/database.md`](docs/database.md).

## Running the App

Start Metro in one terminal:

```bash
npm start
```

Build and launch on Android in another:

```bash
npm run android
```

> If Metro's port is busy: `lsof -ti:8081 | xargs kill -9`.

Fast Refresh applies JS changes on save. To fully reload, press <kbd>R</kbd> twice, or open the Dev Menu with <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS) / <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux).

## Available Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the Metro bundler (port 8081) |
| `npm run android` | Build and run on an Android emulator/device |
| `npm run lint` | Run ESLint over the project |
| `npm run typecheck` | Type‑check with `tsc --noEmit` |
| `npm test` | Run the Jest suite |

Run a single test: `npm test -- __tests__/App.test.tsx`, or filter by name: `npm test -- -t "renders correctly"`.

## Testing

Two layers, described in [`docs/testing.md`](docs/testing.md):

- **Unit (Jest)** — `*.test.ts` files next to the code they cover (e.g. `src/lib/*`, Zod schemas), with Supabase and Claude services mocked at the service boundary.
- **E2E (Maestro)** — flows in `.maestro/<feature>/` drive each feature's QA scenarios against an Android emulator.

```bash
npm test          # unit tests
npm run lint      # lint
npm run typecheck # types
```

## Deployment

SpendlyAI ships to Google Play as a **signed Android App Bundle (AAB)** built by Gradle and delivered via the Play Developer API from CI — no Fastlane/EAS/Expo. Full details in [`docs/deployment.md`](docs/deployment.md).

| Trigger | What CI does | Uploads? |
| --- | --- | --- |
| PR → `main` | `./gradlew bundleRelease` as a build check | No |
| Merge to `main` | Build signed AAB, upload to the **internal testing** track | Yes → internal only |
| Production | **Manual** promotion (internal → production) in the Play Console | Never from CI |

Implemented by `.github/workflows/android-pr-check.yml`, `.github/workflows/android-release.yml`, and the signing/versioning config in `android/app/build.gradle`.

Hard rules:

- **CI never publishes to production** — promotion is always a manual human step.
- **The keystore is never committed** — it is a base64 CI secret, materialized only at build time.
- **All release config lives in secrets**, never in the repo (the repo carries only `.env.example`).

Local release build:

```bash
cd android
./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```

## Security & Privacy

- **Secrets** live in a gitignored `.env` (with a committed `.env.example` template); real values are never committed.
- **The Claude API key stays server‑side** on the Supabase Edge Function — the app never calls Anthropic directly.
- **Row‑Level Security** enforces per‑user data ownership in the database, so a user can only access their own expenses and categories.
- **Data minimization** — the AI receives the least data necessary (computed summaries first, raw rows only when required), always user‑scoped and disclosed to the user.

See [`docs/security.md`](docs/security.md) and [`docs/ai-features.md`](docs/ai-features.md).

## Documentation

Deep‑dive docs live in [`docs/`](docs/):

| Doc | Read when |
| --- | --- |
| [`architecture.md`](docs/architecture.md) | Adding files, wiring data access, understanding data flow |
| [`design-system.md`](docs/design-system.md) | Styling components, using design tokens |
| [`ui.md`](docs/ui.md) | Building or laying out screens and components |
| [`database.md`](docs/database.md) | Working with schema, queries, or the service layer |
| [`auth.md`](docs/auth.md) | Auth flows, session state, navigation gating |
| [`data.md`](docs/data.md) | Writing services, data fetching, or AI integration |
| [`ai-features.md`](docs/ai-features.md) | Building Chat or any AI feature |
| [`coding-standards.md`](docs/coding-standards.md) | Writing or reviewing code |
| [`errors-and-validation.md`](docs/errors-and-validation.md) | Forms, validation, error handling |
| [`security.md`](docs/security.md) | Handling secrets, keys, or data shared with the AI |
| [`git-conventions.md`](docs/git-conventions.md) | Committing, branching, opening a PR |
| [`deployment.md`](docs/deployment.md) | CI, signing, versioning, Play Store release |
| [`testing.md`](docs/testing.md) | Writing tests or QA‑scenario flows |

## Contributing

This project follows **Conventional Commits** and a branch → PR → human review → merge workflow (never straight to `main`). Branches are named `type/feature` (e.g. `feature/privacy-policy`). See [`docs/git-conventions.md`](docs/git-conventions.md).

```bash
git checkout -b feature/your-feature
# ... make changes, npm run lint && npm run typecheck && npm test ...
git commit -m "feat: add your feature"
# open a PR against main
```

## License

This project is private and not currently licensed for redistribution. All rights reserved.
