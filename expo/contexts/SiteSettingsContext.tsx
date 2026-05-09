import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { SiteSettings, HeroBannerConfig, HeroDepartmentKey } from '@/types';

const STORAGE_KEY = 'site_settings';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  accentColor: '#1A1A1A',
  headerBgColor: '#FFFFFF',
  footerBgColor: '#F2F2F2',
  bodyBgColor: '#FFFFFF',
  textPrimaryColor: '#000000',
  textSecondaryColor: '#666666',
  heroOverlayOpacity: 0.32,
  heroTextAlignment: 'left',
  sectionSpacing: 72,
  contentMaxWidth: 1440,
  topBannerEnabled: false,
  topBannerText: 'BEPUL YETKAZIB BERISH — 500 000 SO\'MDAN YUQORI BUYURTMALARGA',
  topBannerBgColor: '#000000',
  topBannerTextColor: '#FFFFFF',
  ctaBorderRadius: 0,
  ctaBgColor: 'transparent',
  ctaTextColor: '#FFFFFF',
  philosophySectionVisible: true,
  newsletterSectionVisible: true,
  heroBanners: {
    all: {
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&h=1200&fit=crop&q=80',
      title: 'YANGI KOLLEKSIYA',
      subtitle: 'BAHOR-YOZ 2026',
      buttonText: "KOLLEKSIYANI KO'RISH",
      destinationUrl: '/catalog?segment=yangi',
    },
    men: {
      imageUrl: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=1800&h=1200&fit=crop&q=80',
      title: 'KLASSIK KOSTYUMLAR',
      subtitle: 'ERKAKLAR UCHUN',
      buttonText: "KOLLEKSIYANI KO'RISH",
      destinationUrl: '/catalog?segment=men',
    },
    women: {
      imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1800&h=1200&fit=crop&q=80',
      title: 'YANGI MAVSUM',
      subtitle: 'AYOLLAR UCHUN',
      buttonText: "KOLLEKSIYANI KO'RISH",
      destinationUrl: '/catalog?segment=women',
    },
    kids: {
      imageUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1800&h=1200&fit=crop&q=80',
      title: 'BOLALAR OLAMI',
      subtitle: 'BOLALAR UCHUN',
      buttonText: "KOLLEKSIYANI KO'RISH",
      destinationUrl: '/catalog?segment=kids',
    },
  },
};

export const [SiteSettingsProvider, useSiteSettings] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const settingsQuery = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SiteSettings>;
        const mergedBanners: Record<HeroDepartmentKey, HeroBannerConfig> = {
          ...DEFAULT_SITE_SETTINGS.heroBanners,
          ...(parsed.heroBanners ?? {}),
        };
        return { ...DEFAULT_SITE_SETTINGS, ...parsed, heroBanners: mergedBanners };
      }
      return DEFAULT_SITE_SETTINGS;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (updated: SiteSettings) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['site_settings'] });
    },
  });

  const updateSettings = useCallback((partial: Partial<SiteSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveMutation.mutate(updated);
    console.log('[SiteSettings] Updated:', Object.keys(partial).join(', '));
  }, [settings, saveMutation]);

  const updateSetting = useCallback(<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveMutation.mutate(updated);
    console.log('[SiteSettings] Updated:', key, '=', value);
  }, [settings, saveMutation]);

  const updateHeroBanner = useCallback((dept: HeroDepartmentKey, partial: Partial<HeroBannerConfig>) => {
    const current = settings.heroBanners[dept] ?? DEFAULT_SITE_SETTINGS.heroBanners[dept];
    const updated: SiteSettings = {
      ...settings,
      heroBanners: {
        ...settings.heroBanners,
        [dept]: { ...current, ...partial },
      },
    };
    setSettings(updated);
    saveMutation.mutate(updated);
    console.log('[SiteSettings] Hero banner updated:', dept, Object.keys(partial).join(','));
  }, [settings, saveMutation]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SITE_SETTINGS);
    saveMutation.mutate(DEFAULT_SITE_SETTINGS);
    console.log('[SiteSettings] Reset to defaults');
  }, [saveMutation]);

  return useMemo(() => ({
    settings,
    isLoading: settingsQuery.isLoading,
    isSaving: saveMutation.isPending,
    updateSettings,
    updateSetting,
    updateHeroBanner,
    resetToDefaults,
  }), [settings, settingsQuery.isLoading, saveMutation.isPending, updateSettings, updateSetting, updateHeroBanner, resetToDefaults]);
});
