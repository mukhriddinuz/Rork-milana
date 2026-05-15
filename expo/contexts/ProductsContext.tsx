import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';

type ProductRow = {
  id: string;
  model_number: string;
  variant_number: string;
  category: string;
  image: string;
  secondary_image?: string | null;
  price: number | null;
  old_price?: number | null;
  status: Product['status'];
  is_trending: boolean | null;
  is_new?: boolean | null;
  visibility: Product['visibility'];
  created_at: string;
  created_by: string;
  target_audience?: Product['targetAudience'] | null;
  description?: string | null;
};

const mapRowToProduct = (row: ProductRow): Product => ({
  id: row.id,
  modelNumber: row.model_number,
  variantNumber: row.variant_number,
  category: row.category,
  image: row.image,
  secondaryImage: row.secondary_image ?? undefined,
  price: row.price,
  oldPrice: row.old_price ?? null,
  status: row.status,
  isTrending: row.is_trending ?? false,
  isNew: row.is_new ?? row.is_trending ?? false,
  visibility: row.visibility ?? 'all',
  createdAt: row.created_at,
  createdBy: row.created_by,
  targetAudience: row.target_audience ?? undefined,
  description: row.description ?? undefined,
});

const mapProductToRow = (
  product: Partial<Product>,
): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (product.modelNumber !== undefined) row.model_number = product.modelNumber;
  if (product.variantNumber !== undefined) row.variant_number = product.variantNumber;
  if (product.category !== undefined) row.category = product.category;
  if (product.image !== undefined) row.image = product.image;
  if (product.secondaryImage !== undefined) row.secondary_image = product.secondaryImage ?? null;
  if (product.price !== undefined) row.price = product.price;
  if (product.oldPrice !== undefined) row.old_price = product.oldPrice ?? null;
  if (product.status !== undefined) row.status = product.status;
  if (product.isTrending !== undefined) row.is_trending = product.isTrending;
  if (product.isNew !== undefined) row.is_new = product.isNew;
  if (product.visibility !== undefined) row.visibility = product.visibility;
  if (product.createdBy !== undefined) row.created_by = product.createdBy;
  if (product.targetAudience !== undefined) row.target_audience = product.targetAudience ?? null;
  if (product.description !== undefined) row.description = product.description ?? null;
  return row;
};

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
        .order('created_at', { ascending: false });
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
        .insert(mapProductToRow(product))
        .select('*')
        .single();
      if (error) throw error;
      return mapRowToProduct(data as ProductRow);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { id: _omit, createdAt: _omit2, ...rest } = updates as Partial<Product>;
      const { error } = await supabase.from('products').update(mapProductToRow(rest)).eq('id', id);
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
