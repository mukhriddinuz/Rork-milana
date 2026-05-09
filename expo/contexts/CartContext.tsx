import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { CartItem } from '@/types';

export const [CartProvider, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const initialized = useRef(false);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_cart');
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    },
  });

  useEffect(() => {
    if (cartQuery.data && !initialized.current) {
      setItems(cartQuery.data);
      initialized.current = true;
    }
  }, [cartQuery.data]);

  const persist = useCallback((newItems: CartItem[]) => {
    AsyncStorage.setItem('milana_cart', JSON.stringify(newItems));
  }, []);

  const addToCart = useCallback((productId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      const updated = existing
        ? prev.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev, { productId, quantity: 1 }];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return prev;
      const updated =
        existing.quantity > 1
          ? prev.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
            )
          : prev.filter((i) => i.productId !== productId);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const removeItemCompletely = useCallback((productId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.productId !== productId);
      persist(updated);
      console.log('[Cart] Removed item completely', productId);
      return updated;
    });
  }, [persist]);

  const clearCart = useCallback(() => {
    setItems([]);
    persist([]);
    console.log('[Cart] Cleared');
  }, [persist]);

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
    isLoading: cartQuery.isLoading,
  };
});
