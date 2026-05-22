import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, Language } from '@/types';
import { translations } from '@/constants/translations';
import { supabase } from '@/lib/supabase';

/**
 * Map a Supabase auth user to our local `User` shape so the rest of the app
 * keeps working unchanged. All authenticated users are clients.
 */
function mapSupabaseUser(su: SupabaseUser): User {
  const meta = (su.user_metadata ?? {}) as Record<string, unknown>;
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
    role: 'client',
    username,
    email: su.email ?? undefined,
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('ru');
  const [authReady, setAuthReady] = useState<boolean>(false);
  const mountedRef = useRef(true);

  const langQuery = useQuery({
    queryKey: ['language'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_language');
      return (stored as Language) || 'ru';
    },
  });

  useEffect(() => {
    if (langQuery.data) {
      setLanguage(langQuery.data);
    }
  }, [langQuery.data]);

  // Hydrate from Supabase session on mount, then subscribe to auth changes.
  useEffect(() => {
    mountedRef.current = true;

    const applySession = (session: Session | null) => {
      if (!mountedRef.current) return;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    };

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.log('[Auth] getSession error:', error.message);
        applySession(data?.session ?? null);
      } catch (e) {
        console.log('[Auth] getSession failed:', e);
      } finally {
        if (mountedRef.current) setAuthReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] state change:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /** Real Supabase email/password sign up. */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { name?: string; username?: string; role?: 'client' },
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
      if (mapped) setUser(mapped);
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
      if (mapped) setUser(mapped);
      return { user: mapped, error: null };
    },
    [],
  );

  /** Send a password reset email via Supabase. */
  const resetPasswordForEmail = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      let redirectTo: string | undefined;
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          redirectTo = `${window.location.origin}/update-password`;
        } else {
          redirectTo = Linking.createURL('update-password');
        }
      } catch (e) {
        console.log('[Auth] redirectTo build failed:', e);
      }
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      );
      if (error) {
        console.log('[Auth] resetPasswordForEmail error:', error.message);
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  /** Update the password of the currently authenticated user. */
  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.log('[Auth] updatePassword error:', error.message);
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  /** Real Supabase sign out. */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log('[Auth] signOut error:', error.message);
    setUser(null);
  }, []);

  /** Alias for screens that still call `logout()`. */
  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const changeLanguage = useCallback(async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem('milana_language', lang);
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
    signUp,
    signIn,
    signOut,
    logout,
    resetPasswordForEmail,
    updatePassword,
    changeLanguage,
    t,
    isLoading: langQuery.isLoading || !authReady,
  };
});
