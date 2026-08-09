import { useCallback, useEffect, useRef, useState } from 'react';

import { chatQuestionSchema } from '../lib/validation/chat-schema';
import { askSpendingQuestion } from '../services/ai-service';
import type { ChatMessage } from '../types/chat';

// Suggested questions shown as chips above the composer (docs/ui.md §2.5).
export const SUGGESTED_QUESTIONS = [
  'How much on food this month?',
  'Where can I cut back?',
  "What's my biggest expense?",
];

const ERROR_TEXT = "Sorry — I couldn't answer that right now.";

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${messageCounter}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  // Guard against setting state after unmount (chat history is ephemeral).
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  // Runs the AI call for `question`, resolving the pending assistant bubble
  // (`pendingId`) into an answer or a friendly error.
  const runQuestion = useCallback(
    async (question: string, pendingId: string, history: ChatMessage[]) => {
      setSending(true);
      try {
        const answer = await askSpendingQuestion(question, history);
        if (!activeRef.current) return;
        setMessages(prev =>
          prev.map(message =>
            message.id === pendingId
              ? { ...message, text: answer, status: undefined }
              : message,
          ),
        );
      } catch (e) {
        // Log the real error; show the user something human (docs/errors-and-validation.md).
        console.error(e);
        if (!activeRef.current) return;
        setMessages(prev =>
          prev.map(message =>
            message.id === pendingId
              ? { ...message, text: ERROR_TEXT, status: 'error' }
              : message,
          ),
        );
      } finally {
        if (activeRef.current) setSending(false);
      }
    },
    [],
  );

  // Sends a new question: appends the user bubble + a pending thinking bubble,
  // then calls the AI. No-ops on empty/whitespace input or while a call is in flight.
  const send = useCallback(
    (raw: string) => {
      if (sending) return;
      const parsed = chatQuestionSchema.safeParse(raw);
      if (!parsed.success) return;
      const question = parsed.data;

      const userMessage: ChatMessage = {
        id: nextId(),
        role: 'user',
        text: question,
      };
      const pendingId = nextId();
      const pending: ChatMessage = {
        id: pendingId,
        role: 'assistant',
        text: '',
        status: 'sending',
      };

      const history = messages;
      setMessages(prev => [...prev, userMessage, pending]);
      runQuestion(question, pendingId, history);
    },
    [messages, sending, runQuestion],
  );

  // Re-sends the question behind a failed answer, reusing its bubble.
  const retry = useCallback(
    (assistantId: string) => {
      if (sending) return;
      const index = messages.findIndex(message => message.id === assistantId);
      if (index < 1) return;
      const question = messages[index - 1]?.text ?? '';
      if (!question) return;

      const history = messages.slice(0, index - 1);
      setMessages(prev =>
        prev.map(message =>
          message.id === assistantId
            ? { ...message, text: '', status: 'sending' }
            : message,
        ),
      );
      runQuestion(question, assistantId, history);
    },
    [messages, sending, runQuestion],
  );

  return {
    messages,
    sending,
    send,
    retry,
    suggestions: SUGGESTED_QUESTIONS,
  };
}
