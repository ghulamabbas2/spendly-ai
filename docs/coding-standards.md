# Spendly AI — Coding Standards

Conventions for writing code in this repo. See [`architecture.md`](architecture.md) for structure/naming and [`data.md`](data.md) for the service-layer contract.

## TypeScript

- **Strict mode is on.** `strict: true` in `tsconfig.json` — no loosening it per-file.
- **No `any`.** Use precise types, `unknown` with narrowing, or generics. If a value is genuinely dynamic, type it as `unknown` and narrow before use.
- **No `@ts-ignore` / `@ts-expect-error` without a comment** explaining why it's needed. Prefer fixing the type; suppress only as a last resort, and prefer `@ts-expect-error` (it fails when the error goes away).
- Shared types live in `src/types` (kebab-case files) — see [`architecture.md`](architecture.md).

## Formatting & linting

- **Prettier** formats all code — config in `.prettierrc.js` (single quotes, trailing commas, no bracket spacing, arrow parens avoided). Don't hand-format against it.
- **ESLint** with the React Native config (`@react-native`, in `.eslintrc.js`). Code must pass `npm run lint` with no errors before it's considered done.
- Files use the `@format` docblock pragma to opt into Prettier.

## Imports

Order imports in three groups, separated by a blank line:

1. **External packages** — `react`, `react-native`, third-party libs.
2. **Internal aliases** — absolute imports into the project (e.g. `@/services`, `@/components`).
3. **Relative imports** — `./` and `../`.

```ts
import React from 'react';
import {View, Text} from 'react-native';

import {getExpenses} from '@/services/expenses-service';
import type {Expense} from '@/types/expense';

import {formatCurrency} from './format-currency';
```

## Components

- **Typed function components.** No class components.
- **Props are typed explicitly** via a named `Props` type/interface. Don't rely on inference for the props object.
- Destructure props in the signature.

```tsx
type Props = {
  label: string;
  amount: number;
  onPress: () => void;
};

function SpendCard({label, amount, onPress}: Props) {
  return (
    // ...
  );
}

export default SpendCard;
```

## Async & errors

- **Use `async`/`await`** — never `.then()`/`.catch()` chains.
- **Throw real `Error` objects** (or subclasses), never strings or plain objects. Services throw on failure; callers `try/catch` and handle loading/error state (see [`data.md`](data.md)).

```ts
if (error) throw new Error(`Failed to load expenses: ${error.message}`);
```

## Structure & size

- **Keep components small.** A component should mostly render UI.
- **Extract logic into hooks** (`src/hooks`) — data fetching, subscriptions, derived state, side effects.
- **Extract pure logic into helpers** (`src/lib`) — formatting, calculations, parsing. No React, no I/O, easy to unit-test.
- If a component grows large or mixes concerns, split it: presentational component + hook + helper.
