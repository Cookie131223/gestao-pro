import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { AuthSession, refreshSession, signIn, signOutRemote, signUp } from '../lib/supabase-api';
import { SessionManager, SESSION_KEY } from '../lib/session-manager';

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<'signed-in' | 'confirm-email'>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const managerRef = useRef<SessionManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new SessionManager(AsyncStorage, refreshSession, setSession, Date.now, async (work) => {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request('gestaopro-session-refresh', work);
      }
      return work();
    });
  }
  const manager = managerRef.current;

  useEffect(() => {
    let active = true;
    void manager.restore().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [manager]);

  useEffect(() => {
    if (loading) return;
    const refresh = () => { if (manager.current) void manager.getAccessToken().catch(() => {}); };
    const timer = setInterval(refresh, 30_000);
    const appListener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    const storageListener = (event: StorageEvent) => {
      if (event.key === SESSION_KEY) void manager.restore();
    };
    if (Platform.OS === 'web') {
      window.addEventListener('focus', refresh);
      window.addEventListener('online', refresh);
      window.addEventListener('storage', storageListener);
    }
    return () => {
      clearInterval(timer);
      appListener.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('focus', refresh);
        window.removeEventListener('online', refresh);
        window.removeEventListener('storage', storageListener);
      }
    };
  }, [loading, manager]);

  async function login(email: string, password: string) {
    await manager.set(await signIn(email.trim().toLowerCase(), password));
  }
  async function register(email: string, password: string) {
    const next = await signUp(email.trim().toLowerCase(), password);
    if (!next) return 'confirm-email' as const;
    await manager.set(next);
    return 'signed-in' as const;
  }
  async function logout() {
    const current = manager.current;
    await manager.set(null);
    if (current) { try { await signOutRemote(current.access_token); } catch { /* Local logout already completed. */ } }
  }
  return <AuthContext.Provider value={{ session, loading, login, register, logout, getAccessToken: () => manager.getAccessToken() }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
}
