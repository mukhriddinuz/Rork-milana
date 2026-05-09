import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Order } from '@/types';

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [seenOrderIds, setSeenOrderIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const initialized = useRef(false);
  const seenInitialized = useRef(false);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_orders');
      return stored ? (JSON.parse(stored) as Order[]) : [];
    },
  });

  const seenQuery = useQuery({
    queryKey: ['seen_orders'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_seen_orders');
      return stored ? (JSON.parse(stored) as string[]) : [];
    },
  });

  useEffect(() => {
    if (ordersQuery.data && !initialized.current) {
      setOrders(ordersQuery.data);
      initialized.current = true;
    }
  }, [ordersQuery.data]);

  useEffect(() => {
    if (seenQuery.data && !seenInitialized.current) {
      setSeenOrderIds(seenQuery.data);
      seenInitialized.current = true;
    }
  }, [seenQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (updated: Order[]) => {
      await AsyncStorage.setItem('milana_orders', JSON.stringify(updated));
      return updated;
    },
  });

  const submitOrder = useCallback(
    (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'seen'>): Order => {
      const newOrder: Order = {
        ...orderData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        seen: false,
      };
      const updated = [newOrder, ...orders];
      setOrders(updated);
      syncMutation.mutate(updated);
      setToastMessage('newOrderNotification');
      console.log('[Orders] Submitted order:', newOrder.id);
      return newOrder;
    },
    [orders, syncMutation],
  );

  const updateOrderStatus = useCallback(
    (id: string, status: Order['status']) => {
      const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
      setOrders(updated);
      syncMutation.mutate(updated);
      console.log('[Orders] Status updated:', id, status);
    },
    [orders, syncMutation],
  );

  const markOrdersSeen = useCallback(
    (ids: string[]) => {
      const newSeen = [...new Set([...seenOrderIds, ...ids])];
      setSeenOrderIds(newSeen);
      AsyncStorage.setItem('milana_seen_orders', JSON.stringify(newSeen));
    },
    [seenOrderIds],
  );

  const unseenCount = useMemo(() => {
    return orders.filter((o) => !seenOrderIds.includes(o.id)).length;
  }, [orders, seenOrderIds]);

  const isOrderUnseen = useCallback(
    (orderId: string) => !seenOrderIds.includes(orderId),
    [seenOrderIds],
  );

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    orders,
    submitOrder,
    updateOrderStatus,
    markOrdersSeen,
    unseenCount,
    isOrderUnseen,
    toastMessage,
    dismissToast,
    isLoading: ordersQuery.isLoading,
  };
});
