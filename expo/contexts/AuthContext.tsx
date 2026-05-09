import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { User, Language, UserRole } from '@/types';
import { translations } from '@/constants/translations';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('ru');
  const initialized = useRef(false);

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

  const loginAsClient = useCallback(async (clientId: string, clientName: string, username: string) => {
    const newUser: User = {
      id: clientId,
      name: clientName,
      role: 'client',
      username,
    };
    setUser(newUser);
    await AsyncStorage.setItem('milana_auth', JSON.stringify(newUser));
    console.log('[Auth] Client logged in:', clientId, username);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    initialized.current = false;
    await AsyncStorage.removeItem('milana_auth');
    console.log('[Auth] Logged out');
  }, []);

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
    login,
    loginAsClient,
    logout,
    changeLanguage,
    t,
    isLoading: authQuery.isLoading || langQuery.isLoading,
  };
});
