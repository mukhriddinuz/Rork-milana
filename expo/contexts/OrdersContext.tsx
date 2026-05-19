import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Order, OrderItem } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CreateOrderInput {
  items: OrderItem[];
  total: number;
  shippingAddress: string;
  phoneNumber: string;
}

interface OrderRow {
  id: string;
  user_id: string;
  client_name: string | null;
  total: number;
  status: Order['status'];
  shipping_address: string | null;
  phone_number: string | null;
  created_at: string;
  order_items?: OrderItemRow[];
}

interface OrderItemRow {
  id?: string;
  order_id?: string;
  product_id: string;
  model_number: string | null;
  variant_number: string | null;
  image: string | null;
  price: number;
  quantity: number;
}

function mapRowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    clientId: row.user_id,
    clientName: row.client_name ?? '',
    total: Number(row.total ?? 0),
    status: row.status,
    createdAt: row.created_at,
    shippingAddress: row.shipping_address ?? undefined,
    phoneNumber: row.phone_number ?? undefined,
    items: (row.order_items ?? []).map((it) => ({
      productId: it.product_id,
      modelNumber: it.model_number ?? '',
      variantNumber: it.variant_number ?? '',
      image: it.image ?? '',
      price: Number(it.price ?? 0),
      quantity: Number(it.quantity ?? 0),
    })),
  };
}

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seenOrderIds, setSeenOrderIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const seenInitialized = useRef(false);

  // Restore "seen" cache (local UX only).
  useEffect(() => {
    (async () => {
      if (seenInitialized.current) return;
      try {
        const stored = await AsyncStorage.getItem('milana_seen_orders');
        if (stored) setSeenOrderIds(JSON.parse(stored) as string[]);
      } catch (e) {
        console.log('[Orders] seen hydrate failed:', e);
      } finally {
        seenInitialized.current = true;
      }
    })();
  }, []);

  // Fetch this user's orders from Supabase.
  useEffect(() => {
    if (!userId) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('[Orders] Fetch failed:', error.message);
          return;
        }
        if (cancelled) return;
        const mapped = (data ?? []).map((r) => mapRowToOrder(r as OrderRow));
        setOrders(mapped);
      } catch (e) {
        console.error('[Orders] Fetch threw:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const createOrder = useCallback(
    async (
      input: CreateOrderInput,
    ): Promise<{ order: Order | null; error: string | null }> => {
      if (!userId) {
        return { order: null, error: 'Not authenticated' };
      }
      if (input.items.length === 0) {
        return { order: null, error: 'Empty cart' };
      }

      try {
        // Step A: insert the order.
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            client_name: user?.name ?? '',
            total: input.total,
            status: 'pending',
            shipping_address: input.shippingAddress,
            phone_number: input.phoneNumber,
          })
          .select()
          .single();

        if (orderErr || !orderData) {
          console.error('[Orders] Insert order failed:', orderErr?.message);
          return { order: null, error: orderErr?.message ?? 'Order insert failed' };
        }

        // Step B: insert the line items.
        const itemRows = input.items.map((it) => ({
          order_id: (orderData as { id: string }).id,
          product_id: it.productId,
          model_number: it.modelNumber,
          variant_number: it.variantNumber,
          image: it.image,
          price: it.price,
          quantity: it.quantity,
        }));
        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(itemRows);

        if (itemsErr) {
          console.error('[Orders] Insert order_items failed:', itemsErr.message);
          // best-effort: rollback the order so we don't leave a header without lines.
          await supabase.from('orders').delete().eq('id', (orderData as { id: string }).id);
          return { order: null, error: itemsErr.message };
        }

        const newOrder = mapRowToOrder({
          ...(orderData as OrderRow),
          order_items: itemRows.map((r) => ({
            order_id: r.order_id,
            product_id: r.product_id,
            model_number: r.model_number,
            variant_number: r.variant_number,
            image: r.image,
            price: r.price,
            quantity: r.quantity,
          })),
        });
        setOrders((prev) => [newOrder, ...prev]);
        setToastMessage('newOrderNotification');
        console.log('[Orders] Created order:', newOrder.id);
        return { order: newOrder, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.error('[Orders] createOrder threw:', msg);
        return { order: null, error: msg };
      }
    },
    [userId, user?.name],
  );

  const markOrdersSeen = useCallback(
    (ids: string[]) => {
      const newSeen = Array.from(new Set([...seenOrderIds, ...ids]));
      setSeenOrderIds(newSeen);
      AsyncStorage.setItem('milana_seen_orders', JSON.stringify(newSeen)).catch(() => {});
    },
    [seenOrderIds],
  );

  const unseenCount = useMemo(
    () => orders.filter((o) => !seenOrderIds.includes(o.id)).length,
    [orders, seenOrderIds],
  );

  const isOrderUnseen = useCallback(
    (orderId: string) => !seenOrderIds.includes(orderId),
    [seenOrderIds],
  );

  const dismissToast = useCallback(() => setToastMessage(null), []);

  return {
    orders,
    createOrder,
    markOrdersSeen,
    unseenCount,
    isOrderUnseen,
    toastMessage,
    dismissToast,
    isLoading,
  };
});
