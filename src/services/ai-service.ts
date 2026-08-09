import { supabase } from './supabase-client';
import type { ChatMessage } from '../types/chat';

type ChatResponse = { answer: string };

// One turn of history sent to the Edge Function — minimal by design (role + text
// only, no ids or UI status). See docs/ai-features.md (least data).
type HistoryTurn = { role: ChatMessage['role']; text: string };

// Asks the Chat Edge Function a spending question and returns Claude's answer.
// The app never calls Anthropic directly — the Edge Function holds the key and
// reads Supabase server-side (docs/data.md, docs/ai-features.md).
// Returns typed data or throws.
export async function askSpendingQuestion(
  question: string,
  history: ChatMessage[],
): Promise<string> {
  const trimmedHistory: HistoryTurn[] = history
    .filter(message => message.status !== 'error' && message.text.length > 0)
    .map(message => ({ role: message.role, text: message.text }));

  const { data, error } = await supabase.functions.invoke<ChatResponse>('chat', {
    body: { question, history: trimmedHistory },
  });

  if (error) throw new Error(`Failed to get an answer: ${error.message}`);
  if (!data?.answer) throw new Error('Failed to get an answer: empty response');
  return data.answer;
}
