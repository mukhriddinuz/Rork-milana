import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

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

const PRODUCTS_KEY = ['products'] as const;

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

const mapProductToRow = (product: Partial<Product>): Record<string, unknown> => {
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
  const queryClient = useQueryClient();

  // React Query is the single source of truth. Optimistic updates write
  // straight into the cache so a later refetch (focus, invalidate, another
  // admin's change) always reconciles instead of going stale.
  const productsQuery = useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        logger.error('[Products] Fetch failed:', error.message);
        throw error;
      }
      return (data ?? []).map((r) => mapRowToProduct(r as ProductRow));
    },
  });

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const setCache = useCallback(
    (updater: (prev: Product[]) => Product[]) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_KEY, (prev) => updater(prev ?? []));
    },
    [queryClient],
  );

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { id: _omit, createdAt: _omit2, ...rest } = updates as Partial<Product>;
      const { error } = await supabase.from('products').update(mapProductToRow(rest)).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });

  const addProduct = useCallback(
    (product: Omit<Product, 'id' | 'createdAt'>) => {
      const optimistic: Product = {
        ...product,
        id: `tmp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setCache((prev) => [optimistic, ...prev]);
      addMutation.mutate(product, {
        onSuccess: (saved) => {
          setCache((prev) => [saved, ...prev.filter((p) => p.id !== optimistic.id)]);
        },
        onError: (err) => {
          logger.error('[Products] Add failed:', err);
          setCache((prev) => prev.filter((p) => p.id !== optimistic.id));
        },
      });
      return optimistic;
    },
    [addMutation, setCache],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      const snapshot = queryClient.getQueryData<Product[]>(PRODUCTS_KEY) ?? [];
      setCache((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      updateMutation.mutate(
        { id, updates },
        {
          onError: (err) => {
            logger.error('[Products] Update failed:', err);
            queryClient.setQueryData(PRODUCTS_KEY, snapshot);
          },
        },
      );
    },
    [updateMutation, setCache, queryClient],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const snapshot = queryClient.getQueryData<Product[]>(PRODUCTS_KEY) ?? [];
      setCache((prev) => prev.filter((p) => p.id !== id));
      deleteMutation.mutate(id, {
        onError: (err) => {
          logger.error('[Products] Delete failed:', err);
          queryClient.setQueryData(PRODUCTS_KEY, snapshot);
        },
      });
    },
    [deleteMutation, setCache, queryClient],
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
