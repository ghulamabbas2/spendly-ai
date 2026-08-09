import type { Session as SupabaseSession } from '@supabase/supabase-js';

import type { Session } from '../types/auth';
import { supabase } from './supabase-client';

function toDomainSession(session: SupabaseSession | null): Session | null {
  if (!session) return null;
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
    },
  };
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(`Failed to sign up: ${error.message}`);
  return { needsEmailConfirmation: data.session === null };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Failed to sign in: ${error.message}`);
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
