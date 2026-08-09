# Spendly AI — AI Features

How AI features work in Spendly. Every AI feature runs inside a **Supabase Edge Function** that holds the Claude API key; the app calls the Edge Function and never calls Anthropic directly. See [`data.md`](data.md) for the service/Edge-Function routing, [`security.md`](security.md) for key handling and data minimization, [`database.md`](database.md) for the schema/RLS, and [`auth.md`](auth.md) for session/identity.

## Where AI runs

- **All AI features run server-side in a Supabase Edge Function** that holds the `ANTHROPIC_API_KEY` and calls Claude. The key never ships in the app bundle (see [`security.md`](security.md)).
- **The app never calls Anthropic directly.** The AI service (`src/services`) invokes the Edge Function, which returns typed data or throws — the same contract as every other service (see [`data.md`](data.md)).
- **The Edge Function runs in the caller's authenticated context.** Supabase forwards the session, so any data the function reads from Supabase is RLS-scoped to that user (see [`auth.md`](auth.md), [`database.md`](database.md)).

```
App (no key) ─▶ AI service (src/services) ─▶ Supabase Edge Function ─▶ Claude API
                                              (holds ANTHROPIC_API_KEY,
                                               reads Supabase directly,
                                               calls Claude server-side)
```

## Chat

Natural-language Q&A about the user's own spending. The user asks in plain language ("How much did I spend on food last month?"); the Edge Function answers using the user's data.

- **Read-only.** Chat only ever answers questions. It **never writes** — it creates no expenses, edits nothing, and deletes nothing. It has no write path.
- **Summaries first.** The Edge Function pulls **computed summaries** from Supabase — totals by category and by period — and sends those, together with the question, to Claude. Claude answers from the summaries.
- **Raw rows only when needed.** When a question genuinely needs line-item detail (e.g. "What was my biggest purchase at the grocery store?"), the function reads the specific **raw rows** required for that question — nothing broader.
- **Returns the answer.** The function returns Claude's answer to the app; the screen handles loading and error state.

```
User question ─▶ AI service ─▶ Edge Function
                                 1. read computed summaries (totals by category/period)
                                    from Supabase, scoped to this user
                                 2. read specific raw rows only if the question needs detail
                                 3. send summaries + question to Claude
                                 4. return Claude's answer
```

## Privacy

Chat handles financial data, so it follows the app's data-minimization rules (see [`security.md`](security.md)):

- **Send the least data that answers the question.** Default to computed summaries; escalate to raw rows only when the specific question requires line-item detail, and read only the rows that question needs — never the user's full history.
- **Scoped to this user.** Every read the Edge Function makes is RLS-scoped to the authenticated caller (see [`database.md`](database.md)). One user's data can never reach another's session.
- **Expense rows never leave the database to the client for AI.** The Edge Function reads Supabase directly, server-side, and only the summarized/necessary data is sent to Claude. Raw expense rows are not round-tripped through the client to build an AI request.
- **Disclose AI data use.** Tell the user that their spending data is shared with the AI to answer their questions, so the sharing is transparent and expected.
