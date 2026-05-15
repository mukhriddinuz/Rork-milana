import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { CartItem } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'milana_cart';

export const [CartProvider, useCart] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const mergedForUser = useRef<string | null>(null);

  const persistLocal = useCallback(async (next: CartItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log('[Cart] persist local failed:', e);
    }
  }, []);

  // Hydrate local cache for guests.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const local = stored ? (JSON.parse(stored) as CartItem[]) : [];
        if (!userId) {
          setItems(local);
        }
      } catch (e) {
        console.log('[Cart] local hydrate failed:', e);
      } finally {
        if (!userId) setIsLoading(false);
      }
    })();
  }, [userId]);

  // Fetch / merge from Supabase for authenticated users.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        if (mergedForUser.current !== userId) {
          try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const localItems: CartItem[] = stored ? JSON.parse(stored) : [];
            if (localItems.length > 0) {
              const { data: existing, error: exErr } = await supabase
                .from('cartItems')
                .select('productId, quantity')
                .eq('userId', userId);
              if (exErr) console.log('[Cart] merge fetch error:', exErr.message);
              const existingMap = new Map<string, number>(
                (existing ?? []).map((r: { productId: string; quantity: number }) => [
                  r.productId,
                  r.quantity,
                ]),
              );
              const rows = localItems.map((it) => ({
                userId,
                productId: it.productId,
                quantity: it.quantity + (existingMap.get(it.productId) ?? 0),
              }));
              const { error: upErr } = await supabase
                .from('cartItems')
                .upsert(rows, { onConflict: 'userId,productId' });
              if (upErr) console.log('[Cart] merge upsert error:', upErr.message);
              await AsyncStorage.removeItem(STORAGE_KEY);
            }
          } catch (e) {
            console.log('[Cart] merge failed:', e);
          }
          mergedForUser.current = userId;
        }

        const { data, error } = await supabase
          .from('cartItems')
          .select('productId, quantity')
          .eq('userId', userId);
        if (error) {
          console.log('[Cart] fetch error:', error.message);
          return;
        }
        if (cancelled) return;
        const mapped: CartItem[] = (data ?? []).map(
          (r: { productId: string; quantity: number }) => ({
            productId: r.productId,
            quantity: r.quantity,
          }),
        );
        setItems(mapped);
      } catch (e) {
        console.log('[Cart] fetch failed:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const upsertRemote = useCallback(
    async (productId: string, quantity: number) => {
      if (!userId) return;
      try {
        const { error } = await supabase
          .from('cartItems')
          .upsert(
            { userId, productId, quantity },
            { onConflict: 'userId,productId' },
          );
        if (error) console.log('[Cart] upsert error:', error.message);
      } catch (e) {
        console.log('[Cart] upsert failed:', e);
      }
    },
    [userId],
  );

  const deleteRemote = useCallback(
    async (productId: string) => {
      if (!userId) return;
      try {
        const { error } = await supabase
          .from('cartItems')
          .delete()
          .eq('userId', userId)
          .eq('productId', productId);
        if (error) console.log('[Cart] delete error:', error.message);
      } catch (e) {
        console.log('[Cart] delete failed:', e);
      }
    },
    [userId],
  );

  const addToCart = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        const newQty = existing ? existing.quantity + 1 : 1;
        const updated = existing
          ? prev.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...prev, { productId, quantity: 1 }];
        if (userId) {
          upsertRemote(productId, newQty);
        } else {
          persistLocal(updated);
        }
        return updated;
      });
    },
    [userId, upsertRemote, persistLocal],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (!existing) return prev;
        const willRemove = existing.quantity <= 1;
        const updated = willRemove
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
            );
        if (userId) {
          if (willRemove) {
            deleteRemote(productId);
          } else {
            upsertRemote(productId, existing.quantity - 1);
          }
        } else {
          persistLocal(updated);
        }
        return updated;
      });
    },
    [userId, upsertRemote, deleteRemote, persistLocal],
  );

  const removeItemCompletely = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const updated = prev.filter((i) => i.productId !== productId);
        if (userId) {
          deleteRemote(productId);
        } else {
          persistLocal(updated);
        }
        console.log('[Cart] Removed item completely', productId);
        return updated;
      });
    },
    [userId, deleteRemote, persistLocal],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (userId) {
      (async () => {
        try {
          const { error } = await supabase
            .from('cartItems')
            .delete()
            .eq('userId', userId);
          if (error) console.log('[Cart] clear error:', error.message);
        } catch (e) {
          console.log('[Cart] clear failed:', e);
        }
      })();
    } else {
      persistLocal([]);
    }
    console.log('[Cart] Cleared');
  }, [userId, persistLocal]);

  const getQuantity = useCallback(
    (productId: string) => {
      return items.find((i) => i.productId === productId)?.quantity ?? 0;
    },
    [items],
  );

  const totalItems = useMemo(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  return {
    items,
    addToCart,
    removeFromCart,
    removeItemCompletely,
    clearCart,
    getQuantity,
    totalItems,
    isLoading,
  };
});
