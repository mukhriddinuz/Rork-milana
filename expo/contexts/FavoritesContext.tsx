import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';

export const [FavoritesProvider, useFavorites] = createContextHook(() => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const initialized = useRef(false);

  const favQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_favorites');
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  useEffect(() => {
    if (favQuery.data && !initialized.current) {
      setFavoriteIds(favQuery.data);
      initialized.current = true;
    }
  }, [favQuery.data]);

  const persist = useCallback((ids: string[]) => {
    AsyncStorage.setItem('milana_favorites', JSON.stringify(ids));
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(productId);
      const updated = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      persist(updated);
      console.log('[Favorites]', exists ? 'Removed' : 'Added', productId);
      return updated;
    });
  }, [persist]);

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
    isLoading: favQuery.isLoading,
  };
});
