import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Category } from '@/types';
import { supabase } from '@/lib/supabase';

export const [CategoriesProvider, useCategories] = createContextHook(() => {
  const [categories, setCategories] = useState<Category[]>([]);
  const initialized = useRef(false);
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });
      if (error) {
        console.error('[Categories] Fetch failed:', error.message);
        return [];
      }
      return (data ?? []) as Category[];
    },
  });

  useEffect(() => {
    if (categoriesQuery.data && !initialized.current) {
      setCategories(categoriesQuery.data);
      initialized.current = true;
    }
  }, [categoriesQuery.data]);

  const addMutation = useMutation({
    mutationFn: async (category: Category) => {
      const { error } = await supabase.from('categories').insert(category);
      if (error) throw error;
      return category;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Category, 'id'>> }) => {
      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const addCategory = useCallback(
    (category: Omit<Category, 'id'>) => {
      const newCategory: Category = {
        ...category,
        id: `cat_${Date.now()}`,
      };
      const updated = [...categories, newCategory];
      setCategories(updated);
      addMutation.mutate(newCategory, {
        onError: (err) => console.error('[Categories] Add failed:', err),
      });
      console.log('[Categories] Added:', newCategory.id);
      return newCategory;
    },
    [categories, addMutation],
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<Category, 'id'>>) => {
      const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setCategories(updated);
      updateMutation.mutate(
        { id, updates },
        { onError: (err) => console.error('[Categories] Update failed:', err) },
      );
      console.log('[Categories] Updated:', id);
    },
    [categories, updateMutation],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      deleteMutation.mutate(id, {
        onError: (err) => console.error('[Categories] Delete failed:', err),
      });
      console.log('[Categories] Deleted:', id);
    },
    [categories, deleteMutation],
  );

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading: categoriesQuery.isLoading,
  };
});
