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
