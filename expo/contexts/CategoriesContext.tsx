import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Category } from '@/types';

const defaultCategories: Category[] = [
  { id: 'xalat', uz: 'Xalat', ru: 'Халат' },
  { id: 'pijama', uz: 'Pijama', ru: 'Пижама' },
  { id: 'koylak', uz: "Ko'ylak", ru: 'Рубашка' },
  { id: 'futbolka', uz: 'Futbolka', ru: 'Футболка' },
  { id: 'shim', uz: 'Shim', ru: 'Брюки' },
  { id: 'ichki_kiyim', uz: 'Ichki kiyim', ru: 'Нижнее бельё' },
  { id: 'sochiq', uz: 'Sochiq', ru: 'Полотенце' },
  { id: 'choyshablar', uz: 'Choyshablar', ru: 'Постельное бельё' },
];

export const [CategoriesProvider, useCategories] = createContextHook(() => {
  const [categories, setCategories] = useState<Category[]>([]);
  const initialized = useRef(false);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('milana_categories');
      if (stored) {
        return JSON.parse(stored) as Category[];
      }
      await AsyncStorage.setItem('milana_categories', JSON.stringify(defaultCategories));
      return defaultCategories;
    },
  });

  useEffect(() => {
    if (categoriesQuery.data && !initialized.current) {
      setCategories(categoriesQuery.data);
      initialized.current = true;
    }
  }, [categoriesQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (updated: Category[]) => {
      await AsyncStorage.setItem('milana_categories', JSON.stringify(updated));
      return updated;
    },
  });

  const addCategory = useCallback(
    (category: Omit<Category, 'id'>) => {
      const newCategory: Category = {
        ...category,
        id: `cat_${Date.now()}`,
      };
      const updated = [...categories, newCategory];
      setCategories(updated);
      syncMutation.mutate(updated);
      console.log('[Categories] Added:', newCategory.id);
      return newCategory;
    },
    [categories, syncMutation],
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<Category, 'id'>>) => {
      const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setCategories(updated);
      syncMutation.mutate(updated);
      console.log('[Categories] Updated:', id);
    },
    [categories, syncMutation],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      syncMutation.mutate(updated);
      console.log('[Categories] Deleted:', id);
    },
    [categories, syncMutation],
  );

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading: categoriesQuery.isLoading,
  };
});
