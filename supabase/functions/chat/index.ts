// Spendly AI — Chat Edge Function (Deno).
//
// Read-only natural-language Q&A over the caller's own spending. Runs the flow
// documented in docs/ai-features.md:
//   1. Read computed summaries (totals by category / period) from Supabase,
//      scoped to the authenticated caller via RLS.
//   2. Read a small set of raw rows only when the question needs line-item detail.
//   3. Send the summaries + question to Claude (server-side — the key never
//      leaves here).
//   4. Return Claude's answer.
//
// The app calls this function; it never calls Anthropic directly (docs/data.md,
// docs/security.md). verify_jwt is on (default), so only authenticated users reach here.

import { createClient } from 'npm:@supabase/supabase-js@2';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';
const MAX_QUESTION_LENGTH = 500;
const DETAIL_ROW_LIMIT = 10;
// Bound the free-text carried into the AI payload (notes are user-entered and
// may contain PII — send only what a line-item answer needs, truncated).
const MAX_NOTE_LENGTH = 80;
// Cap each history turn's text so a modified client can't inflate the prompt.
const MAX_HISTORY_TURN_LENGTH = 500;

const SYSTEM_PROMPT = [
  'You are Spendly AI, a friendly assistant that answers questions about the',
  "user's personal spending. All amounts are in US dollars (USD).",
  'Answer ONLY from the spending summary provided in the user message — never',
  'invent, estimate, or assume figures that are not there. If the summary has no',
  'relevant data, say so plainly (e.g. that there is no spending recorded yet).',
  'Be concise and conversational: a sentence or two, with concrete numbers.',
  'You cannot make changes — you only answer questions.',
].join(' ');

type HistoryTurn = { role: 'user' | 'assistant'; text: string };

type ExpenseRow = {
  amount: number | string;
  date: string;
  note: string | null;
  categories: { name: string } | null;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// True only when the question needs individual transactions — not an aggregate
// the category/period summaries already answer. Broad tokens like "most",
// "which", or "highest" (e.g. "which category do I spend the most on") are left
// out on purpose: those are answered from byCategory totals, no raw rows needed.
function isDetailQuestion(question: string): boolean {
  const wantsLineItems =
    /\b(transactions?|purchases?|items?|receipts?)\b|\b(list|show)\b|what did i (buy|spend on)/i;
  const singlePurchase =
    /\b(biggest|largest|most expensive|highest|single|priciest)\b[^.?!]*\b(expense|purchase|transaction|item|buy|charge|cost)\b/i;
  return wantsLineItems.test(question) || singlePurchase.test(question);
}

// Which period's rows a detail question is asking about, so raw rows are scoped
// to that window rather than always ranked across all-time history.
function detailRows(
  question: string,
  allRows: ExpenseRow[],
  thisMonthRows: ExpenseRow[],
  lastMonthRows: ExpenseRow[],
): ExpenseRow[] {
  if (/this month/i.test(question)) return thisMonthRows;
  if (/last month/i.test(question)) return lastMonthRows;
  return allRows;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Aggregates rows into { total, count } per category name.
function totalsByCategory(rows: ExpenseRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const name = row.categories?.name ?? 'Uncategorized';
    totals[name] = (totals[name] ?? 0) + Number(row.amount);
  }
  // Round to cents.
  for (const name of Object.keys(totals)) {
    totals[name] = Math.round(totals[name] * 100) / 100;
  }
  return totals;
}

function sum(rows: ExpenseRow[]): number {
  const total = rows.reduce((acc, row) => acc + Number(row.amount), 0);
  return Math.round(total * 100) / 100;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return json({ error: 'AI is not configured' }, 500);
  }

  // Parse + validate input (mirrors src/lib/validation/chat-schema.ts).
  let payload: { question?: unknown; history?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const question =
    typeof payload.question === 'string' ? payload.question.trim() : '';
  if (question.length === 0 || question.length > MAX_QUESTION_LENGTH) {
    return json({ error: 'Invalid question' }, 400);
  }

  const history: HistoryTurn[] = Array.isArray(payload.history)
    ? (payload.history as HistoryTurn[])
        .filter(
          turn =>
            turn &&
            (turn.role === 'user' || turn.role === 'assistant') &&
            typeof turn.text === 'string' &&
            turn.text.length > 0,
        )
        .slice(-6)
        .map(turn => ({
          role: turn.role,
          text: turn.text.slice(0, MAX_HISTORY_TURN_LENGTH),
        }))
    : [];

  // Client scoped to the caller — RLS restricts every read to this user's rows.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
    },
  );

  const { data, error } = await supabase
    .from('expenses')
    .select('amount, date, note, categories(name)')
    .order('date', { ascending: false });

  if (error) {
    console.error('Failed to load expenses:', error.message);
    return json({ error: 'Could not read your spending' }, 500);
  }

  const rows = (data ?? []) as ExpenseRow[];

  // Period boundaries (UTC).
  const now = new Date();
  const thisMonthStart = isoDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  );
  const lastMonthStart = isoDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
  );

  const thisMonthRows = rows.filter(row => row.date >= thisMonthStart);
  const lastMonthRows = rows.filter(
    row => row.date >= lastMonthStart && row.date < thisMonthStart,
  );

  // Summaries first (least data). Raw rows only when the question needs detail.
  const summary: Record<string, unknown> = {
    today: isoDate(now),
    currency: 'USD',
    allTime: { total: sum(rows), transactions: rows.length },
    thisMonth: {
      total: sum(thisMonthRows),
      transactions: thisMonthRows.length,
      byCategory: totalsByCategory(thisMonthRows),
    },
    lastMonth: {
      total: sum(lastMonthRows),
      transactions: lastMonthRows.length,
      byCategory: totalsByCategory(lastMonthRows),
    },
    byCategoryAllTime: totalsByCategory(rows),
  };

  if (isDetailQuestion(question)) {
    const scoped = detailRows(question, rows, thisMonthRows, lastMonthRows);
    summary.topExpenses = [...scoped]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, DETAIL_ROW_LIMIT)
      .map(row => ({
        amount: Number(row.amount),
        date: row.date,
        // Truncated free text — bounds the PII carried to the model.
        note: row.note ? row.note.slice(0, MAX_NOTE_LENGTH) : null,
        category: row.categories?.name ?? 'Uncategorized',
      }));
  }

  const userContent = `Question: ${question}\n\nHere is a summary of my spending (USD). Use only these figures:\n\n${JSON.stringify(
    summary,
    null,
    2,
  )}`;

  const messages = [
    ...history.map(turn => ({ role: turn.role, content: turn.text })),
    { role: 'user', content: userContent },
  ];

  let aiResponse: Response;
  try {
    aiResponse = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        thinking: { type: 'disabled' },
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
  } catch (e) {
    console.error('Anthropic request failed:', e);
    return json({ error: 'Could not reach the AI' }, 502);
  }

  if (!aiResponse.ok) {
    console.error(
      'Anthropic error:',
      aiResponse.status,
      await aiResponse.text(),
    );
    return json({ error: 'The AI could not answer right now' }, 502);
  }

  const result = (await aiResponse.json()) as {
    content?: { type: string; text?: string }[];
  };
  const answer = (result.content ?? [])
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n')
    .trim();

  if (!answer) {
    return json({ error: 'The AI returned an empty answer' }, 502);
  }

  return json({ answer });
});
