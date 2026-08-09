# Chat Screen — Implementation Plan

## Context

SpendlyAI needs its **Chat** feature: a read-only, natural-language Q&A screen where the user asks about their own spending in plain English and gets an answer from Claude. The Chat tab is already wired into navigation (`TabNavigator` → `ChatScreen`, `TabBar` config), but `ChatScreen.tsx` is a placeholder and there is **no AI service and no Edge Function** — both are net-new.

Per the approved scope, this is **full-stack**: the client screen + hook + AI service, **and** the `chat` Supabase Edge Function that pulls computed summaries from Supabase, calls Claude server-side, and returns the answer. It implements the flow documented in `docs/ai-features.md` (summaries first, raw rows only when a question needs detail; least data; user-scoped; the Claude key never leaves the server).

**Grounding:** matches the Chat prototype (`docs/ui.md` §2.5 + verified prototype markup) and the layer conventions in `docs/architecture.md`, `docs/data.md`, `docs/ai-features.md`, `docs/security.md`, `docs/errors-and-validation.md`. Edge Function auth pattern confirmed against current Supabase docs via Context7; Claude model/params against the claude-api skill.

## Design decisions (locked)

- **Chat history is ephemeral** — held in the hook's `useState` (a `ChatMessage[]`), cleared on unmount. No `messages` table, no persistence. Consistent with "read-only, never writes" and the prototype.
- **Model:** `claude-sonnet-5` in the Edge Function (near-Opus quality on this simple task, cost-appropriate for a consumer chat feature). Easy to swap to `claude-opus-5`. Thinking disabled + `max_tokens: 1024` for a fast, concise answer.
- **Thinking state** is a build requirement (not in the prototype): a left-aligned AI "typing" bubble with animated dots shown while the call is in flight.
- **AI-call failure**: the thinking bubble is replaced by a left-aligned AI **error bubble** ("Sorry — I couldn't answer that right now.") with a **Retry** affordance; the user's message stays in the thread and can be re-sent.

## Files to create / change

### Backend (Edge Function)
- **`supabase/functions/chat/index.ts`** *(new)* — Deno `Deno.serve` handler. Per `docs/ai-features.md` + `docs/data.md`:
  - Creates a Supabase client with `global.headers.Authorization = req.headers.get('Authorization')` so all reads are **RLS-scoped to the caller** (Context7-confirmed pattern). Keep `verify_jwt = true` (default).
  - Parses `{ question, history? }`; validates the question server-side (non-empty, length cap) — reject with 400 on bad input.
  - **Computes summaries** from `expenses` (joined to `categories`): totals by category and by period (this month / last month / all-time) + transaction counts. **Raw rows only when the question needs detail** — fetch a capped top-N (e.g. 10) of specific rows only when the question matches detail intent ("biggest/largest/most/list/show"); otherwise send summaries alone.
  - Calls Claude via `npm:@anthropic-ai/sdk`, `model: 'claude-sonnet-5'`, `thinking: {type: 'disabled'}`, `max_tokens: 1024`, a concise system prompt (financial assistant; answer only from the provided summaries; USD; don't invent numbers). Key read from `Deno.env.get('ANTHROPIC_API_KEY')` — **server-side only**.
  - Returns `{ answer: string }`; returns typed errors (400 bad input, 500 on failure) so the client can surface a friendly message.
  - **Data minimization** (`docs/security.md`): only aggregated summaries leave the DB by default; raw rows are capped and only when required; nothing beyond the user's own scope.
- **`.env.example`** *(edit)* — confirm the commented server-side `# ANTHROPIC_API_KEY=` line is present (already noted in `docs/security.md`). Real value set via `supabase secrets set ANTHROPIC_API_KEY=…` — never committed.

### Client
- **`src/types/chat.ts`** *(new)* — `ChatMessage` view type (camelCase, per hook-view convention): `{ id: string; role: 'user' | 'assistant'; text: string; status?: 'sending' | 'error' }`.
- **`src/lib/validation/chat-schema.ts`** *(new)* — Zod schema for the question (trimmed, non-empty, max length), per `docs/errors-and-validation.md` (shared schemas in `src/lib/validation`). Reused client-side before sending; mirrors the Edge Function's server-side check.
- **`src/services/ai-service.ts`** *(new)* — `askSpendingQuestion(question: string, history: ChatMessage[]): Promise<string>` invoking `supabase.functions.invoke('chat', { body: { question, history } })`. Follows the service contract in `docs/data.md`: **returns typed data or throws** (`if (error) throw new Error(...)`). Never calls Anthropic directly.
- **`src/hooks/use-chat.ts`** *(new)* — owns `messages: ChatMessage[]`, `sending: boolean`, and actions `send(text)` / `retry()`. `send` appends the user message + a placeholder thinking message, calls `askSpendingQuestion`, then replaces the placeholder with the answer or an error message. Uses the repo's `active`-guard/try-catch/`error` conventions (`use-insights.ts` shape) adapted to an append-to-array list. Exposes the suggested-question chips.
- **`src/screens/ChatScreen.tsx`** *(rewrite the stub)* — column layout matching the prototype exactly:
  - **Header** (`paddingTop: 56`): purple `#7c3aed` icon chip (40×40, radius 12, `auto_awesome`), "Spendly AI" (16/800), green dot + "Analyzing your data" (11.5/700, `#16a34a`); bottom hairline `#eceef2`.
  - **Thread** (`flex:1`, scroll): message bubbles — **sent** = `gradient.brand`, white, right, radius `18 18 4 18`; **AI** = white surface, dark, left, radius `18 18 18 4`, `shadow.card`; 13.5px / line-height 1.5. Thinking bubble = AI-styled animated dots. `msgIn` entrance. Auto-scroll to bottom on new message.
  - **Composer** (fixed bottom): horizontally scrollable **suggested chips** (outlined pills `#dfe2e8`, tap to send; defaults: "How much on food this month?", "Where can I cut back?", "What's my biggest expense?"), then the rounded input bar (`#fff`, border `#e2e5ea`, radius 26) with `TextInput` ("Ask about your spending…") + circular send button (`gradient.brand`, `arrow_upward`, `shadow.sendButton`). Send on submit or button; disabled while `sending` or input empty.
  - Keyboard handling via `KeyboardAvoidingView` + `useSafeAreaInsets()` (no existing pattern in repo — new; the tab bar's 86px composer clearance from `design-system.md`). `accessibilityLabel`s on the send button and chips.

## Data / navigation / validation notes

- **No new tables, no migration** — Chat only reads existing `expenses`/`categories`; summaries are computed in the Edge Function. History is not persisted.
- **Navigation:** nothing to register — `Chat` tab is already wired (`TabParamList.Chat: undefined`). Work is inside `ChatScreen.tsx`. No stack routes needed.
- **RLS is the security boundary:** the Edge Function reads Supabase as the caller (Authorization-header client), so summaries and any raw rows are automatically scoped to `auth.uid()` (`docs/security.md`, `docs/database.md`).
- **Validation:** shared Zod schema (`chat-schema.ts`) client-side; the Edge Function re-validates server-side. Empty/whitespace questions are rejected inline before any call.
- **Deploy steps (for QA to work end-to-end):** `supabase functions deploy chat`; `supabase secrets set ANTHROPIC_API_KEY=…`. These are operational, run once.

## QA Scenarios

- Ask "How much did I spend on food this month?" → a thinking bubble appears, then a left-aligned AI answer with the correct total; the question stays right-aligned above it.
- Tap a suggested chip (e.g. "What's my biggest expense?") → it sends as a user message and returns a sensible answer; chips/send are disabled while a request is in flight.
- Submit an empty or whitespace-only message → inline validation blocks it; nothing is sent, no bubble added.
- Force the AI call to fail (offline, or Edge Function down) → the thinking bubble is replaced by a friendly AI error bubble with a Retry that re-sends the same question; the app doesn't crash and no expense is written.
- Open Chat as a signed-out user (or with no expenses) → signed-out is gated to sign-in with no data; with zero expenses, the greeting + chips still render and a question returns a graceful "no spending yet" style answer.
- Send several questions in a row → each pairs a right-aligned question with a left-aligned answer, the thread auto-scrolls to the newest, and the composer stays above the keyboard.
