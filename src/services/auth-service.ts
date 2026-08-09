import type { AuthError, Session as SupabaseSession } from '@supabase/supabase-js';

import type { Session } from '../types/auth';
import { supabase } from './supabase-client';

// Wraps a Supabase AuthError while preserving its `code` (e.g. "over_email_send_rate_limit",
// "user_already_exists") so screens can show an accurate message instead of a generic one.
export class AuthServiceError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
  }
}

function toAuthServiceError(prefix: string, error: AuthError): AuthServiceError {
  return new AuthServiceError(`${prefix}: ${error.message}`, error.code);
}

function toDomainSession(session: SupabaseSession | null): Session | null {
  if (!session) return null;
  const fullName = session.user.user_metadata?.full_name;
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: typeof fullName === 'string' ? fullName : null,
    },
  };
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw toAuthServiceError('Failed to sign up', error);
  return { needsEmailConfirmation: data.session === null };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toAuthServiceError('Failed to sign in', error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Failed to sign out: ${error.message}`);
}

export function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(toDomainSession(session));
  });

  return () => subscription.unsubscribe();
}
