import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Product } from '@/types';
import { mockProducts } from '@/mocks/data';

export const [ProductsProvider, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const initialized = useRef(false);

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_products');
      if (stored) {
        const parsed = JSON.parse(stored) as Product[];
        return parsed.map((p) => ({
          ...p,
          isTrending: p.isTrending ?? false,
          isNew: p.isNew ?? p.isTrending ?? false,
          visibility: p.visibility ?? 'all',
        }));
      }
      await AsyncStorage.setItem('milana_products', JSON.stringify(mockProducts));
      return mockProducts;
    },
  });

  useEffect(() => {
    if (productsQuery.data && !initialized.current) {
      setProducts(productsQuery.data);
      initialized.current = true;
    }
  }, [productsQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (updated: Product[]) => {
      await AsyncStorage.setItem('milana_products', JSON.stringify(updated));
      return updated;
    },
  });

  const addProduct = useCallback(
    (product: Omit<Product, 'id' | 'createdAt'>) => {
      const newProduct: Product = {
        ...product,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newProduct, ...products];
      setProducts(updated);
      syncMutation.mutate(updated);
      console.log('[Products] Added:', newProduct.modelNumber);
      return newProduct;
    },
    [products, syncMutation],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setProducts(updated);
      syncMutation.mutate(updated);
      console.log('[Products] Updated:', id, updates);
    },
    [products, syncMutation],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      syncMutation.mutate(updated);
      console.log('[Products] Deleted:', id);
    },
    [products, syncMutation],
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
