import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, RotateCcw, ChevronDown, Check, Layers } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHomepageConfig } from '@/contexts/HomepageConfigContext';
import { HomepageConfigItem } from '@/types';
import { categories } from '@/constants/categories';

const SEGMENTS = [
  { id: 'all', label: 'Hammasi' },
  { id: 'yangi', label: 'Yangi kelganlar' },
  { id: 'chegirma', label: 'Chegirmalar' },
  { id: 'men', label: 'Erkaklar' },
  { id: 'women', label: 'Ayollar' },
  { id: 'kids', label: 'Bolalar' },
];

const SECTION_LABELS: Record<string, string> = {
  hero_banner: 'BOSH BANNER',
  editorial_men: 'TRENDLAR',
  editorial_women: 'TRENDLAR',
  seasonal_kids: 'MAVSUMIY BANNER',
  masonry_hero: 'MAVSUM TANLOVI',
  masonry_top: 'MAVSUM TANLOVI',
  masonry_bottom: 'MAVSUM TANLOVI',
  staircase_men: 'KOLLEKSIYALAR',
  staircase_nightwear: 'KOLLEKSIYALAR',
  staircase_kids: 'KOLLEKSIYALAR',
  explore_all: 'UMUMIY',
};

export default function ShowroomAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config, isSaving, saveAll, resetToDefaults } = useHomepageConfig();

  const [localConfig, setLocalConfig] = useState<HomepageConfigItem[]>(config);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleGoBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Saqlanmagan o\'zgarishlar',
        'Chiqishdan oldin saqlaysizmi?',
        [
          { text: 'Bekor qilish', style: 'cancel' },
          { text: 'Saqlash', onPress: () => { saveAll(localConfig); router.back(); } },
          { text: 'Chiqish', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [hasChanges, localConfig, saveAll, router]);

  const handleSegmentChange = useCallback((elementKey: string, newSegment: string) => {
    Haptics.selectionAsync();
    setLocalConfig((prev) =>
      prev.map((item) =>
        item.element_key === elementKey
          ? { ...item, destination_segment: newSegment, destination_category: undefined }
          : item
      )
    );
    setHasChanges(true);
  }, []);

  const handleCategoryChange = useCallback((elementKey: string, newCategory: string | undefined) => {
    Haptics.selectionAsync();
    setLocalConfig((prev) =>
      prev.map((item) =>
        item.element_key === elementKey
          ? { ...item, destination_category: newCategory }
          : item
      )
    );
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveAll(localConfig);
    setHasChanges(false);
    console.log('[ShowroomAdmin] Config saved:', localConfig);
  }, [localConfig, saveAll]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Qayta tiklash',
      'Barcha sozlamalar boshlang\'ich holatga qaytarilsinmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Qayta tiklash',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetToDefaults();
            setLocalConfig(config);
            setHasChanges(false);
          },
        },
      ]
    );
  }, [resetToDefaults, config]);

  const toggleExpand = useCallback((key: string) => {
    Haptics.selectionAsync();
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, HomepageConfigItem[]> = {};
    localConfig.forEach((item) => {
      const section = SECTION_LABELS[item.element_key] ?? 'BOSHQA';
      if (!groups[section]) groups[section] = [];
      groups[section].push(item);
    });
    return groups;
  }, [localConfig]);

  const getSegmentLabel = useCallback((segmentId: string) => {
    return SEGMENTS.find((s) => s.id === segmentId)?.label ?? segmentId;
  }, []);

  const getCategoryLabel = useCallback((catId?: string) => {
    if (!catId) return 'Hammasi';
    return categories.find((c) => c.id === catId)?.uz ?? catId;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={handleGoBack} style={styles.backBtn} testID="showroom-admin-back">
          <ArrowLeft size={18} color="#1A1A1A" strokeWidth={1.5} />
          <Text style={styles.backText}>Orqaga</Text>
        </Pressable>
        <View style={styles.topBarActions}>
          <Pressable onPress={handleReset} style={styles.resetBtn} testID="showroom-admin-reset">
            <RotateCcw size={15} color="#999" strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
            disabled={!hasChanges || isSaving}
            testID="showroom-admin-save"
          >
            <Save size={14} color={hasChanges ? '#FFF' : '#999'} strokeWidth={1.5} />
            <Text style={[styles.saveBtnText, !hasChanges && styles.saveBtnTextDisabled]}>
              {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Layers size={18} color="#1A1A1A" strokeWidth={1.5} />
        <Text style={styles.pageTitle}>SHOWROOM BOSHQARUVI</Text>
      </View>
      <Text style={styles.pageSubtitle}>
        Har bir element qayerga olib borishini sozlang
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(grouped).map(([sectionName, items]) => (
          <View key={sectionName} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{sectionName}</Text>
            {items.map((item) => {
              const isExpanded = expandedKey === item.element_key;
              return (
                <View key={item.element_key} style={styles.configCard}>
                  <Pressable
                    onPress={() => toggleExpand(item.element_key)}
                    style={styles.configCardHeader}
                    testID={`config-card-${item.element_key}`}
                  >
                    <View style={styles.configCardInfo}>
                      <Text style={styles.configLabel}>{item.label}</Text>
                      <Text style={styles.configCurrent}>
                        {getSegmentLabel(item.destination_segment)}
                        {item.destination_category ? ` → ${getCategoryLabel(item.destination_category)}` : ''}
                      </Text>
                    </View>
                    <ChevronDown
                      size={16}
                      color="#999"
                      strokeWidth={1.5}
                      style={isExpanded ? styles.chevronUp : undefined}
                    />
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.configCardBody}>
                      <Text style={styles.pickerLabel}>SEGMENT</Text>
                      <View style={styles.chipRow}>
                        {SEGMENTS.map((seg) => {
                          const active = item.destination_segment === seg.id;
                          return (
                            <Pressable
                              key={seg.id}
                              onPress={() => handleSegmentChange(item.element_key, seg.id)}
                              style={[styles.chip, active && styles.chipActive]}
                              testID={`segment-${item.element_key}-${seg.id}`}
                            >
                              {active && <Check size={10} color="#FFF" strokeWidth={2} />}
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {seg.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <Text style={[styles.pickerLabel, { marginTop: 16 }]}>KATEGORIYA (ixtiyoriy)</Text>
                      <View style={styles.chipRow}>
                        <Pressable
                          onPress={() => handleCategoryChange(item.element_key, undefined)}
                          style={[styles.chip, !item.destination_category && styles.chipActive]}
                        >
                          {!item.destination_category && <Check size={10} color="#FFF" strokeWidth={2} />}
                          <Text style={[styles.chipText, !item.destination_category && styles.chipTextActive]}>
                            Hammasi
                          </Text>
                        </Pressable>
                        {categories.map((cat) => {
                          const active = item.destination_category === cat.id;
                          return (
                            <Pressable
                              key={cat.id}
                              onPress={() => handleCategoryChange(item.element_key, cat.id)}
                              style={[styles.chip, active && styles.chipActive]}
                              testID={`cat-${item.element_key}-${cat.id}`}
                            >
                              {active && <Check size={10} color="#FFF" strokeWidth={2} />}
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {cat.uz}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  saveBtnDisabled: {
    backgroundColor: '#E8E8E8',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  saveBtnTextDisabled: {
    color: '#999999',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    letterSpacing: 3,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#888',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#AAAAAA',
    letterSpacing: 2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
    marginBottom: 8,
    overflow: 'hidden',
  },
  configCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  configCardInfo: {
    flex: 1,
    gap: 3,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  configCurrent: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#888888',
    letterSpacing: 0.3,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  configCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    paddingTop: 14,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#AAAAAA',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#555555',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
