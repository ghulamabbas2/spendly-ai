import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as authService from '../services/auth-service';
import { getProfile } from '../services/profiles-service';
import type { AuthUser, Session } from '../types/auth';

type AuthContextValue = {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // undefined = not fetched yet (fall back to session metadata); the `profiles` row is canonical once loaded.
  const [profileFullName, setProfileFullName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(nextSession => {
      setSession(nextSession);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!session) {
      setProfileFullName(undefined);
      return;
    }

    let active = true;
    (async () => {
      try {
        const profile = await getProfile(session.user.id);
        if (active) setProfileFullName(profile.fullName);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      active = false;
    };
  }, [session]);

  const user = useMemo<AuthUser | null>(() => {
    if (!session) return null;
    return {
      ...session.user,
      fullName: profileFullName !== undefined ? profileFullName : session.user.fullName,
    };
  }, [session, profileFullName]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signUp: authService.signUp,
      signIn: authService.signIn,
      signOut: authService.signOut,
    }),
    [session, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
