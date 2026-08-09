export type ChatRole = 'user' | 'assistant';

// A single message in the chat thread. This is a view type (ephemeral, held in
// the hook's state) — it is never persisted, so it uses camelCase rather than
// the snake_case of DB row types.
export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  // 'sending' while the AI answer is in flight (thinking bubble); 'error' when
  // the call failed. Undefined for a settled message.
  status?: 'sending' | 'error';
};
