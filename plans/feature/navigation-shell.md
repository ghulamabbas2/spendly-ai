# Navigation Shell

## Context

SpendlyAI has no `src/` yet — this is a from-scratch build of the app's navigation skeleton, the structure every future feature (Home, Chat, Insights, Profile, Add Expense, auth) will be dropped into. Per `docs/auth.md`, root navigation must branch on Supabase auth session presence, but no Supabase client or auth service exists yet — that's a future feature. This plan stubs a minimal, same-shaped `useAuth()` hook now so navigation gating is correct and testable today, and a later auth feature swaps its internals for real Supabase session logic without touching navigation code.

Screens are empty placeholders (per the request) — just enough to prove routes and gating work. No icon library or gradients are wired in yet (none installed); the custom tab bar uses design-system colors/sizing but plain text labels for now, per `docs/design-system.md` — visual polish is a later UI pass, not part of the skeleton.

## Dependencies to add

Per React Navigation docs (Context7 `/websites/reactnavigation`) for a bare RN CLI app:
```
@react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
react-native-screens react-native-gesture-handler
```
(`react-native-safe-area-context` is already installed.)

## Files to create

**`src/types/auth.ts`** — `export type Session = { userId: string };` (minimal placeholder shape; real auth feature will replace/extend this per `docs/auth.md`).

**`src/hooks/use-auth.ts`** *(kebab-case per `docs/architecture.md` naming convention)* — defines an `AuthContext`, an `AuthProvider` component holding `session: Session | null` state, and a `useAuth()` hook returning `{ session, signIn, signOut }`. `signIn`/`signOut` just set/clear the stub session for now — placeholder that lets the shell be manually tested end-to-end before the real Supabase-backed hook lands.

**`src/navigation/types.ts`** — param list types: `AuthStackParamList` (`SignIn`, `SignUp`), `TabParamList` (`Home`, `Chat`, `Insights`, `Profile`), `AppStackParamList` (`Tabs`, `AddExpense`).

**`src/navigation/RootNavigator.tsx`** — reads `useAuth().session`; renders `<AuthStack />` if null, else `<AppStack />`. Per `docs/auth.md`: "no in-app path from signed-out to any app screen except by authenticating."

**`src/navigation/AuthStack.tsx`** — native stack with `SignIn` and `SignUp` placeholder screens, headers shown.

**`src/navigation/AppStack.tsx`** — native stack with two screens: `Tabs` (renders `TabNavigator`, `headerShown: false`) and `AddExpense` (`presentation: 'modal'`, `headerShown: false`). Presenting `AddExpense` as a stack-level modal (sibling to `Tabs`, not nested inside it) means the tab bar is naturally hidden while it's open — matches `docs/ui.md` §1.1 tab-bar-visibility rule with no extra logic.

**`src/navigation/TabNavigator.tsx`** — `createBottomTabNavigator` with `Home`, `Chat`, `Insights`, `Profile` screens and a custom `tabBar={props => <TabBar {...props} />}`.

**`src/navigation/TabBar.tsx`** — custom tab bar row: 4 tab buttons (text label only, no icons yet) laid out with a gap for the center FAB, per `docs/ui.md` §1.1 order `Home, Chat, [FAB], Insights, Profile`. Styled with `docs/design-system.md` tokens: bar height 76px, `color.surface` (`#ffffff`) background, active label `color.primary` (`#7c3aed`), inactive `color.navInactive` (`#9aa0ab`). FAB: 62px circle, solid `color.primary` (gradient deferred — no gradient lib installed), raised above the bar. FAB `onPress` calls `navigation.getParent()?.navigate('AddExpense')` to reach the parent `AppStack`, since the modal must cover the whole tab UI, not live inside one tab.

**Placeholder screens** in `src/screens/` (PascalCase, per `docs/architecture.md`): `HomeScreen.tsx`, `ChatScreen.tsx`, `InsightsScreen.tsx`, `ProfileScreen.tsx`, `AddExpenseScreen.tsx`, `SignInScreen.tsx`, `SignUpScreen.tsx`. Each is a `View` + `Text` naming the screen. `ProfileScreen` additionally renders a "Sign out" button calling `useAuth().signOut()`; `SignInScreen` renders a "Sign in" button calling `useAuth().signIn()` — stub actions to exercise the auth-gated navigation manually before real auth exists.

## Files to change

**`App.tsx`** — replace the template `NewAppScreen` content with: `GestureHandlerRootView` → `SafeAreaProvider` (existing) → `AuthProvider` → `NavigationContainer` → `RootNavigator`.

**`package.json`** — add the navigation + screens/gesture-handler dependencies listed above.

## Verification

- `npm run android` — app launches to `SignInScreen` (no session by default).
- Tap "Sign in" on `SignInScreen` → lands on `TabNavigator`, `HomeScreen` visible, tab bar shows 4 tabs + center FAB.
- Tap each tab (Chat, Insights, Profile) → correct placeholder screen renders, tab bar stays visible and active tab highlights in `color.primary`.
- Tap the center FAB from any tab → `AddExpenseScreen` opens as a modal covering the tab bar; swipe/back-gesture or hardware back dismisses it back to the tab you were on.
- On `ProfileScreen`, tap "Sign out" → returns to `SignInScreen`; tabs are no longer reachable.
- `npm run lint` and `npm test` pass with no new errors.

## Manual Test Scenarios

- Launch the app fresh → `SignInScreen` shown, no tabs reachable (auth boundary).
- Tap "Sign in" → tabs appear, `Home` is the default active tab.
- Tap `Chat`, `Insights`, `Profile` in turn → each placeholder screen renders and the tab bar's active indicator follows.
- Tap the center FAB → `Add Expense` opens as a modal over the current tab; dismiss it → returns to the same tab, tab bar visible again.
- Tap "Sign out" on `Profile` → back to `SignInScreen`; pressing hardware back does not reveal any app screen.
