import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';

type ProductRow = {
  id: string;
  modelNumber: string;
  variantNumber: string;
  category: string;
  image: string;
  secondaryImage?: string | null;
  price: number | null;
  oldPrice?: number | null;
  status: Product['status'];
  isTrending: boolean | null;
  isNew?: boolean | null;
  visibility: Product['visibility'];
  createdAt: string;
  createdBy: string;
  targetAudience?: Product['targetAudience'] | null;
  description?: string | null;
};

const mapRowToProduct = (row: ProductRow): Product => ({
  id: row.id,
  modelNumber: row.modelNumber,
  variantNumber: row.variantNumber,
  category: row.category,
  image: row.image,
  secondaryImage: row.secondaryImage ?? undefined,
  price: row.price,
  oldPrice: row.oldPrice ?? null,
  status: row.status,
  isTrending: row.isTrending ?? false,
  isNew: row.isNew ?? row.isTrending ?? false,
  visibility: row.visibility ?? 'all',
  createdAt: row.createdAt,
  createdBy: row.createdBy,
  targetAudience: row.targetAudience ?? undefined,
  description: row.description ?? undefined,
});

export const [ProductsProvider, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const initialized = useRef(false);
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) {
        console.error('[Products] Fetch failed:', error.message);
        return [];
      }
      return (data ?? []).map((r) => mapRowToProduct(r as ProductRow));
    },
  });

  useEffect(() => {
    if (productsQuery.data && !initialized.current) {
      setProducts(productsQuery.data);
      initialized.current = true;
    }
  }, [productsQuery.data]);

  const addMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          modelNumber: product.modelNumber,
          variantNumber: product.variantNumber,
          category: product.category,
          image: product.image,
          price: product.price,
          oldPrice: product.oldPrice ?? null,
          status: product.status,
          isTrending: product.isTrending,
          visibility: product.visibility,
          createdBy: product.createdBy,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapRowToProduct(data as ProductRow);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { id: _omit, createdAt: _omit2, isNew: _omit3, secondaryImage: _omit4, targetAudience: _omit5, description: _omit6, ...rest } = updates as Partial<Product> & Record<string, unknown>;
      const { error } = await supabase.from('products').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const addProduct = useCallback(
    (product: Omit<Product, 'id' | 'createdAt'>) => {
      const optimistic: Product = {
        ...product,
        id: `tmp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [optimistic, ...prev]);
      addMutation.mutate(product, {
        onSuccess: (saved) => {
          setProducts((prev) => [saved, ...prev.filter((p) => p.id !== optimistic.id)]);
        },
        onError: (err) => {
          console.error('[Products] Add failed:', err);
          setProducts((prev) => prev.filter((p) => p.id !== optimistic.id));
        },
      });
      console.log('[Products] Added:', optimistic.modelNumber);
      return optimistic;
    },
    [addMutation],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      updateMutation.mutate(
        { id, updates },
        { onError: (err) => console.error('[Products] Update failed:', err) },
      );
      console.log('[Products] Updated:', id, updates);
    },
    [updateMutation],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      deleteMutation.mutate(id, {
        onError: (err) => console.error('[Products] Delete failed:', err),
      });
      console.log('[Products] Deleted:', id);
    },
    [deleteMutation],
  );

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id) ?? null,
    [products],
  );

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    isLoading: productsQuery.isLoading,
  };
});
