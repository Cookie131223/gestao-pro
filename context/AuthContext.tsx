import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  AuthSession,
  refreshSession,
  signIn,
  signOutRemote,
  signUp,
} from '../lib/supabase-api';

const SESSION_KEY = '@obramax:session';

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<'signed-in' | 'confirm-email'>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw) as AuthSession;

        if (saved.refresh_token) {
          try {
            const refreshed = await refreshSession(saved.refresh_token);
            if (!active) return;
            setSession(refreshed);
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
          } catch {
            await AsyncStorage.removeItem(SESSION_KEY);
          }
        } else if (active) {
          setSession(saved);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const next = await signIn(email.trim().toLowerCase(), password);
    setSession(next);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }

  async function register(email: string, password: string) {
    const next = await signUp(email.trim().toLowerCase(), password);

    if (!next) {
      return 'confirm-email' as const;
    }

    setSession(next);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return 'signed-in' as const;
  }

  async function logout() {
    const current = session;
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);

    if (current?.access_token) {
      try {
        await signOutRemote(current.access_token);
      } catch {
        // A sessão local já foi removida.
      }
    }
  }

  const value = useMemo(
    () => ({ session, loading, login, register, logout }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
}
