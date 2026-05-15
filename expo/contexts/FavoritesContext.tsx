import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'milana_favorites';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hydratedLocal = useRef<boolean>(false);
  const mergedForUser = useRef<string | null>(null);

  const persistLocal = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.log('[Favorites] persist local failed:', e);
    }
  }, []);

  // Hydrate local cache (used for guests, and as merge source on login).
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const ids = stored ? (JSON.parse(stored) as string[]) : [];
        if (!userId) {
          setFavoriteIds(ids);
        }
        hydratedLocal.current = true;
      } catch (e) {
        console.log('[Favorites] local hydrate failed:', e);
      } finally {
        if (!userId) setIsLoading(false);
      }
    })();
  }, [userId]);

  // Fetch from Supabase for authenticated users, merging local guest favorites on first login.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        // Merge local guest favorites into supabase on first sync for this user.
        if (mergedForUser.current !== userId) {
          try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const localIds = stored ? (JSON.parse(stored) as string[]) : [];
            if (localIds.length > 0) {
              const rows = localIds.map((pid) => ({ userId, productId: pid }));
              const { error: upErr } = await supabase
                .from('favorites')
                .upsert(rows, { onConflict: 'userId,productId', ignoreDuplicates: true });
              if (upErr) console.log('[Favorites] merge upsert error:', upErr.message);
              await AsyncStorage.removeItem(STORAGE_KEY);
            }
          } catch (e) {
            console.log('[Favorites] merge failed:', e);
          }
          mergedForUser.current = userId;
        }

        const { data, error } = await supabase
          .from('favorites')
          .select('productId')
          .eq('userId', userId);
        if (error) {
          console.log('[Favorites] fetch error:', error.message);
          return;
        }
        if (cancelled) return;
        const ids = (data ?? []).map((r: { productId: string }) => r.productId);
        setFavoriteIds(ids);
      } catch (e) {
        console.log('[Favorites] fetch failed:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavoriteIds((prev) => {
        const exists = prev.includes(productId);
        const updated = exists
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];

        if (userId) {
          (async () => {
            try {
              if (exists) {
                const { error } = await supabase
                  .from('favorites')
                  .delete()
                  .eq('userId', userId)
                  .eq('productId', productId);
                if (error) console.log('[Favorites] delete error:', error.message);
              } else {
                const { error } = await supabase
                  .from('favorites')
                  .insert({ userId, productId });
                if (error) console.log('[Favorites] insert error:', error.message);
              }
            } catch (e) {
              console.log('[Favorites] toggle sync failed:', e);
            }
          })();
        } else {
          persistLocal(updated);
        }
        console.log('[Favorites]', exists ? 'Removed' : 'Added', productId);
        return updated;
      });
    },
    [userId, persistLocal],
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds],
  );

  const totalFavorites = useMemo(() => favoriteIds.length, [favoriteIds]);

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite,
    totalFavorites,
    isLoading,
  };
});
