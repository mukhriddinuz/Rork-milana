import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { HomepageConfigItem } from '@/types';

const STORAGE_KEY = 'homepage_config';

const DEFAULT_CONFIG: HomepageConfigItem[] = [
  { element_key: 'hero_banner', destination_segment: 'yangi', label: 'Bosh banner (Yangi kelganlar)' },
  { element_key: 'editorial_men', destination_segment: 'men', destination_category: 'koylak', label: 'Trendlar — Erkaklar' },
  { element_key: 'editorial_women', destination_segment: 'women', destination_category: 'pijama', label: 'Trendlar — Ayollar' },
  { element_key: 'seasonal_kids', destination_segment: 'kids', destination_category: 'futbolka', label: 'Mavsumiy banner (Bolalar)' },
  { element_key: 'masonry_hero', destination_segment: 'women', destination_category: 'xalat', label: 'Masonry — Asosiy' },
  { element_key: 'masonry_top', destination_segment: 'chegirma', label: 'Masonry — Yangi kelganlar' },
  { element_key: 'masonry_bottom', destination_segment: 'men', destination_category: 'ichki_kiyim', label: 'Masonry — Premium tanlov' },
  { element_key: 'staircase_men', destination_segment: 'men', label: 'Kolleksiya — Erkaklar' },
  { element_key: 'staircase_nightwear', destination_segment: 'women', destination_category: 'choyshablar', label: 'Kolleksiya — Tunggi kiyim' },
  { element_key: 'staircase_kids', destination_segment: 'kids', label: 'Kolleksiya — Bolalar' },
  { element_key: 'explore_all', destination_segment: 'all', label: 'Barcha mahsulotlar' },
];

export const [HomepageConfigProvider, useHomepageConfig] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<HomepageConfigItem[]>(DEFAULT_CONFIG);

  const configQuery = useQuery({
    queryKey: ['homepage_config'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HomepageConfigItem[];
        const merged = DEFAULT_CONFIG.map((def) => {
          const override = parsed.find((p) => p.element_key === def.element_key);
          return override ? { ...def, ...override } : def;
        });
        return merged;
      }
      return DEFAULT_CONFIG;
    },
  });

  useEffect(() => {
    if (configQuery.data) {
      setConfig(configQuery.data);
    }
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (updated: HomepageConfigItem[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setConfig(data);
      queryClient.invalidateQueries({ queryKey: ['homepage_config'] });
    },
  });

  const updateItem = useCallback((elementKey: string, segment: string, category?: string) => {
    const updated = config.map((item) =>
      item.element_key === elementKey
        ? { ...item, destination_segment: segment, destination_category: category }
        : item
    );
    setConfig(updated);
    saveMutation.mutate(updated);
  }, [config, saveMutation]);

  const saveAll = useCallback((items: HomepageConfigItem[]) => {
    setConfig(items);
    saveMutation.mutate(items);
  }, [saveMutation]);

  const getDestination = useCallback((elementKey: string) => {
    const item = config.find((c) => c.element_key === elementKey);
    return item ?? DEFAULT_CONFIG.find((c) => c.element_key === elementKey) ?? DEFAULT_CONFIG[0];
  }, [config]);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    saveMutation.mutate(DEFAULT_CONFIG);
  }, [saveMutation]);

  return useMemo(() => ({
    config,
    isLoading: configQuery.isLoading,
    isSaving: saveMutation.isPending,
    updateItem,
    saveAll,
    getDestination,
    resetToDefaults,
  }), [config, configQuery.isLoading, saveMutation.isPending, updateItem, saveAll, getDestination, resetToDefaults]);
});
