import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, Language, UserRole } from '@/types';
import { translations } from '@/constants/translations';
import { supabase } from '@/lib/supabase';

/**
 * Map a Supabase auth user to our local `User` shape so the rest of the app
 * (which expects { id, name, role, username }) keeps working unchanged.
 */
function mapSupabaseUser(su: SupabaseUser): User {
  const meta = (su.user_metadata ?? {}) as Record<string, unknown>;
  const metaRole = typeof meta.role === 'string' ? (meta.role as UserRole) : undefined;
  const role: UserRole =
    metaRole === 'warehouse' || metaRole === 'accountant' || metaRole === 'client'
      ? metaRole
      : 'client';
  const name =
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && (meta.full_name as string)) ||
    su.email ||
    'User';
  const username =
    (typeof meta.username === 'string' && (meta.username as string)) || su.email || su.id;
  return {
    id: su.id,
    name,
    role,
    username,
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('ru');
  const [authReady, setAuthReady] = useState<boolean>(false);
  const initialized = useRef(false);

  // Legacy local user (used by demo role-based login flows in admin/rules screens).
  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_auth');
      return stored ? (JSON.parse(stored) as User) : null;
    },
  });

  const langQuery = useQuery({
    queryKey: ['language'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_language');
      return (stored as Language) || 'ru';
    },
  });

  useEffect(() => {
    if (authQuery.data !== undefined && !initialized.current) {
      setUser(authQuery.data);
      initialized.current = true;
    }
  }, [authQuery.data]);

  useEffect(() => {
    if (langQuery.data) {
      setLanguage(langQuery.data);
    }
  }, [langQuery.data]);

  // Hydrate from Supabase session on mount, then subscribe to auth changes.
  useEffect(() => {
    let isMounted = true;

    const persist = async (u: User | null) => {
      if (u) {
        await AsyncStorage.setItem('milana_auth', JSON.stringify(u));
      } else {
        await AsyncStorage.removeItem('milana_auth');
      }
    };

    const applySession = async (session: Session | null) => {
      if (!isMounted) return;
      if (session?.user) {
        const mapped = mapSupabaseUser(session.user);
        setUser(mapped);
        await persist(mapped);
      }
    };

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.log('[Auth] getSession error:', error.message);
        await applySession(data?.session ?? null);
      } catch (e) {
        console.log('[Auth] getSession failed:', e);
      } finally {
        if (isMounted) setAuthReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] state change:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        AsyncStorage.removeItem('milana_auth').catch(() => {});
        return;
      }
      if (session?.user) {
        const mapped = mapSupabaseUser(session.user);
        setUser(mapped);
        AsyncStorage.setItem('milana_auth', JSON.stringify(mapped)).catch(() => {});
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /** Real Supabase email/password sign up. */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { name?: string; username?: string; role?: UserRole },
    ): Promise<{ user: User | null; error: string | null }> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata ?? {} },
      });
      if (error) {
        console.log('[Auth] signUp error:', error.message);
        return { user: null, error: error.message };
      }
      const mapped = data.user ? mapSupabaseUser(data.user) : null;
      if (mapped) {
        setUser(mapped);
        await AsyncStorage.setItem('milana_auth', JSON.stringify(mapped));
      }
      return { user: mapped, error: null };
    },
    [],
  );

  /** Real Supabase email/password sign in. */
  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ user: User | null; error: string | null }> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.log('[Auth] signIn error:', error.message);
        return { user: null, error: error.message };
      }
      const mapped = data.user ? mapSupabaseUser(data.user) : null;
      if (mapped) {
        setUser(mapped);
        await AsyncStorage.setItem('milana_auth', JSON.stringify(mapped));
      }
      return { user: mapped, error: null };
    },
    [],
  );

  /** Send a password reset email via Supabase. */
  const resetPasswordForEmail = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.log('[Auth] resetPasswordForEmail error:', error.message);
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  /** Real Supabase sign out (also clears the legacy local user). */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log('[Auth] signOut error:', error.message);
    setUser(null);
    initialized.current = false;
    await AsyncStorage.removeItem('milana_auth');
  }, []);

  // ----- Legacy demo flows kept for backward compatibility -----
  // These are still used by admin/rules/register screens (role-based local logins).

  const login = useCallback(async (role: UserRole) => {
    const demoUsers: Record<UserRole, User> = {
      warehouse: { id: 'w1', name: 'Ombor / Склад', role: 'warehouse', username: 'warehouse' },
      accountant: { id: 'a1', name: 'Buxgalter / Бухгалтер', role: 'accountant', username: 'accountant' },
      client: { id: 'c1', name: 'Mijoz / Клиент', role: 'client', username: 'client' },
    };
    const newUser = demoUsers[role];
    setUser(newUser);
    await AsyncStorage.setItem('milana_auth', JSON.stringify(newUser));
    console.log('[Auth] Logged in as:', role);
  }, []);

  const loginAsClient = useCallback(
    async (clientId: string, clientName: string, username: string) => {
      const newUser: User = { id: clientId, name: clientName, role: 'client', username };
      setUser(newUser);
      await AsyncStorage.setItem('milana_auth', JSON.stringify(newUser));
      console.log('[Auth] Client logged in:', clientId, username);
    },
    [],
  );

  /** Logout alias that also signs out from Supabase if a session exists. */
  const logout = useCallback(async () => {
    await signOut();
    console.log('[Auth] Logged out');
  }, [signOut]);

  const changeLanguage = useCallback(async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem('milana_language', lang);
    console.log('[Auth] Language changed to:', lang);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translations[language]?.[key] ?? fallback ?? key;
    },
    [language],
  );

  return {
    user,
    language,
    // Real Supabase auth
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    // Legacy/demo helpers (kept so existing screens keep working)
    login,
    loginAsClient,
    logout,
    changeLanguage,
    t,
    isLoading: authQuery.isLoading || langQuery.isLoading || !authReady,
  };
});
