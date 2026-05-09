import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import useEscapeKey from '@/hooks/useEscapeKey';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DollarSign,
  Users,
  FileText,
  ArrowLeft,
  LogOut,
  Layers,
  ChevronDown,
  Check,
  Save,
  RotateCcw,
  Tag,
  X,
  Search,
  Package,
  Palette,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Minus,
  Plus,
  UploadCloud,
  Link2,
  ImageIcon,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useHomepageConfig } from '@/contexts/HomepageConfigContext';
import { useSiteSettings, DEFAULT_SITE_SETTINGS } from '@/contexts/SiteSettingsContext';
import { HomepageConfigItem, Product, SiteSettings, HeroDepartmentKey, HeroBannerConfig, Category } from '@/types';
import WebHeader from '@/components/WebHeader';
import GlobalFooter from '@/components/GlobalFooter';

const TOTAL_HEADER_HEIGHT = 92;

const SEGMENTS = [
  { id: 'all', label: 'Hammasi' },
  { id: 'yangi', label: 'Yangi kelganlar' },
  { id: 'chegirma', label: 'Chegirmalar' },
  { id: 'men', label: 'Erkaklar' },
  { id: 'women', label: 'Ayollar' },
  { id: 'kids', label: 'Bolalar' },
];

interface DestinationOption {
  value: string;
  labelUz: string;
  labelRu: string;
  groupUz: string;
  groupRu: string;
}

const DESTINATION_OPTIONS: DestinationOption[] = [
  { value: '/catalog?segment=yangi', labelUz: 'Yangi kelganlar', labelRu: 'Новинки', groupUz: 'UMUMIY', groupRu: 'ОБЩЕЕ' },
  { value: '/catalog?segment=chegirma', labelUz: 'Chegirmalar', labelRu: 'Скидки', groupUz: 'UMUMIY', groupRu: 'ОБЩЕЕ' },
  { value: '/catalog?segment=all', labelUz: 'Barcha mahsulotlar', labelRu: 'Все товары', groupUz: 'UMUMIY', groupRu: 'ОБЩЕЕ' },

  { value: '/catalog?segment=men', labelUz: 'Erkaklar: Barchasi', labelRu: 'Мужчины: Все', groupUz: 'ERKAKLAR', groupRu: 'МУЖЧИНЫ' },
  { value: '/catalog?segment=men&filter=new', labelUz: 'Erkaklar: Yangi kolleksiya', labelRu: 'Мужчины: Новая коллекция', groupUz: 'ERKAKLAR', groupRu: 'МУЖЧИНЫ' },
  { value: '/catalog?segment=men&category=xalat', labelUz: 'Erkaklar: Xalat', labelRu: 'Мужчины: Халат', groupUz: 'ERKAKLAR', groupRu: 'МУЖЧИНЫ' },
  { value: '/catalog?segment=men&category=pijama', labelUz: 'Erkaklar: Pijama', labelRu: 'Мужчины: Пижама', groupUz: 'ERKAKLAR', groupRu: 'МУЖЧИНЫ' },
  { value: '/catalog?segment=men&category=koylak', labelUz: "Erkaklar: Ko'ylak", labelRu: 'Мужчины: Рубашка', groupUz: 'ERKAKLAR', groupRu: 'МУЖЧИНЫ' },
  { value: '/catalog?segment=men&category=futbolka', labelUz: 'Erkaklar: Futbolka', labelRu: 'Мужчины: Футболка', groupUz: 'ERKAKLAR', groupRu: 'МУЖЧИНЫ' },
  { value: '/catalog?segment=men&category=shim', labelUz: 'Erkaklar: Shim', labelRu: 'Мужчины: Брюки', groupUz: 'ERKAKLAR', groupRu: 'МУЖЧИНЫ' },

  { value: '/catalog?segment=women', labelUz: 'Ayollar: Barchasi', labelRu: 'Женщины: Все', groupUz: 'AYOLLAR', groupRu: 'ЖЕНЩИНЫ' },
  { value: '/catalog?segment=women&filter=new', labelUz: 'Ayollar: Yangi kolleksiya', labelRu: 'Женщины: Новая коллекция', groupUz: 'AYOLLAR', groupRu: 'ЖЕНЩИНЫ' },
  { value: '/catalog?segment=women&category=xalat', labelUz: 'Ayollar: Xalat', labelRu: 'Женщины: Халат', groupUz: 'AYOLLAR', groupRu: 'ЖЕНЩИНЫ' },
  { value: '/catalog?segment=women&category=pijama', labelUz: 'Ayollar: Pijama', labelRu: 'Женщины: Пижама', groupUz: 'AYOLLAR', groupRu: 'ЖЕНЩИНЫ' },
  { value: '/catalog?segment=women&category=koylak', labelUz: "Ayollar: Ko'ylak", labelRu: 'Женщины: Рубашка', groupUz: 'AYOLLAR', groupRu: 'ЖЕНЩИНЫ' },
  { value: '/catalog?segment=women&category=ichki_kiyim', labelUz: 'Ayollar: Ichki kiyim', labelRu: 'Женщины: Нижнее бельё', groupUz: 'AYOLLAR', groupRu: 'ЖЕНЩИНЫ' },

  { value: '/catalog?segment=kids', labelUz: 'Bolalar: Barchasi', labelRu: 'Дети: Все', groupUz: 'BOLALAR', groupRu: 'ДЕТИ' },
  { value: '/catalog?segment=kids&category=pijama', labelUz: 'Bolalar: Pijama', labelRu: 'Дети: Пижама', groupUz: 'BOLALAR', groupRu: 'ДЕТИ' },
  { value: '/catalog?segment=kids&category=futbolka', labelUz: 'Bolalar: Futbolka', labelRu: 'Дети: Футболка', groupUz: 'BOLALAR', groupRu: 'ДЕТИ' },

  { value: '/catalog?category=sochiq', labelUz: "Uy-ro'zg'or: Sochiq", labelRu: 'Для дома: Полотенце', groupUz: "UY-RO'ZG'OR", groupRu: 'ДЛЯ ДОМА' },
  { value: '/catalog?category=choyshablar', labelUz: "Uy-ro'zg'or: Choyshablar", labelRu: 'Для дома: Постельное бельё', groupUz: "UY-RO'ZG'OR", groupRu: 'ДЛЯ ДОМА' },
];

interface DestinationSelectProps {
  value: string;
  onChange: (v: string) => void;
  isUz: boolean;
  testID?: string;
}

function DestinationSelect({ value, onChange, isUz, testID }: DestinationSelectProps) {
  const [open, setOpen] = useState(false);
  useEscapeKey(open, () => setOpen(false));
  const selected = DESTINATION_OPTIONS.find((o) => o.value === value);
  const currentLabel = selected
    ? (isUz ? selected.labelUz : selected.labelRu)
    : (isUz ? 'Tanlang...' : 'Выберите...');

  const grouped = useMemo(() => {
    const g: Record<string, DestinationOption[]> = {};
    DESTINATION_OPTIONS.forEach((opt) => {
      const key = isUz ? opt.groupUz : opt.groupRu;
      if (!g[key]) g[key] = [];
      g[key].push(opt);
    });
    return g;
  }, [isUz]);

  return (
    <View>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); setOpen(true); }}
        style={styles.selectTrigger}
        testID={testID}
      >
        <Link2 size={14} color="#666" strokeWidth={1.5} />
        <Text style={styles.selectTriggerText} numberOfLines={1}>
          {currentLabel}
        </Text>
        <ChevronDown size={14} color="#999" strokeWidth={1.5} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.selectBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.selectSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.selectSheetHeader}>
              <Text style={styles.selectSheetTitle}>
                {isUz ? 'Yo\'nalishni tanlang' : 'Выберите направление'}
              </Text>
              <Pressable onPress={() => setOpen(false)} style={styles.selectSheetClose}>
                <X size={16} color="#666" strokeWidth={1.5} />
              </Pressable>
            </View>
            <ScrollView style={styles.selectSheetScroll} showsVerticalScrollIndicator={false}>
              {Object.entries(grouped).map(([groupName, opts]) => (
                <View key={groupName} style={styles.selectGroup}>
                  <Text style={styles.selectGroupTitle}>{groupName}</Text>
                  {opts.map((opt) => {
                    const active = opt.value === value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => {
                          Haptics.selectionAsync();
                          onChange(opt.value);
                          setOpen(false);
                        }}
                        style={[styles.selectOption, active && styles.selectOptionActive]}
                        testID={`${testID}-option-${opt.value}`}
                      >
                        <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>
                          {isUz ? opt.labelUz : opt.labelRu}
                        </Text>
                        {active && <Check size={14} color="#000" strokeWidth={2} />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface ImageDropzoneProps {
  value: string;
  onChange: (v: string) => void;
  isUz: boolean;
  testID?: string;
}

function ImageDropzone({ value, onChange, isUz, testID }: ImageDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { open: openLightbox } = useLightbox();

  const handlePick = useCallback(async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        base64: Platform.OS !== 'web',
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        let uri = asset.uri;
        if (Platform.OS !== 'web' && asset.base64) {
          uri = `data:image/jpeg;base64,${asset.base64}`;
        }
        onChange(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('[ImageDropzone] Image picked');
      }
    } catch (err) {
      console.log('[ImageDropzone] Pick error:', err);
      Alert.alert(isUz ? 'Xatolik' : 'Ошибка', isUz ? 'Rasmni yuklashda xatolik.' : 'Ошибка загрузки.');
    } finally {
      setUploading(false);
    }
  }, [onChange, isUz]);

  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    onChange('');
  }, [onChange]);

  const webDropHandlers = Platform.OS === 'web' ? {
    onDragOver: (e: any) => { e.preventDefault(); setDragOver(true); },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: any) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type?.startsWith('image/')) {
        setUploading(true);
        const reader = new FileReader();
        reader.onload = () => {
          onChange(reader.result as string);
          setUploading(false);
          console.log('[ImageDropzone] File dropped');
        };
        reader.onerror = () => setUploading(false);
        reader.readAsDataURL(file);
      }
    },
  } : {};

  return (
    <View style={styles.dropzoneWrap}>
      {value ? (
        <Pressable
          onPress={() => openLightbox(value)}
          style={styles.dropzonePreviewWrap}
          testID={`${testID}-preview`}
          {...(Platform.OS === 'web' ? ({ style: [styles.dropzonePreviewWrap, { cursor: 'zoom-in' as any }] } as any) : {})}
        >
          <Image source={{ uri: value }} style={styles.dropzonePreviewImg} resizeMode="cover" />
          <View style={styles.dropzoneActions}>
            <Pressable
              onPress={handlePick}
              style={styles.dropzoneActionBtn}
              disabled={uploading}
              testID={`${testID}-replace`}
            >
              <UploadCloud size={13} color="#FFF" strokeWidth={1.5} />
              <Text style={styles.dropzoneActionText}>
                {isUz ? 'Almashtirish' : 'Заменить'}
              </Text>
            </Pressable>
            <Pressable
              onPress={(e) => { (e as any).stopPropagation?.(); handleClear(); }}
              style={[styles.dropzoneActionBtn, styles.dropzoneActionBtnGhost]}
              testID={`${testID}-remove`}
            >
              <Trash2 size={13} color="#000" strokeWidth={1.5} />
            </Pressable>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={handlePick}
          style={[styles.dropzone, dragOver && styles.dropzoneDragOver]}
          disabled={uploading}
          testID={testID}
          {...(webDropHandlers as object)}
        >
          <View style={styles.dropzoneIconCircle}>
            <UploadCloud size={22} color="#666" strokeWidth={1.3} />
          </View>
          <Text style={styles.dropzoneTitle}>
            {uploading
              ? (isUz ? 'Yuklanmoqda...' : 'Загрузка...')
              : Platform.OS === 'web'
                ? (isUz ? "Rasmni shu yerga tashlang yoki bosing" : 'Перетащите изображение или нажмите')
                : (isUz ? 'Rasm tanlash uchun bosing' : 'Нажмите, чтобы выбрать')}
          </Text>
          <Text style={styles.dropzoneHint}>
            {isUz ? 'JPG, PNG, WEBP — tavsiya 1800×1200' : 'JPG, PNG, WEBP — реком. 1800×1200'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

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

type DashboardTab = 'overview' | 'showroom' | 'pricing' | 'design' | 'products';

type ProductFormState = {
  id: string | null;
  modelCode: string;
  modelName: string;
  variantNumber: string;
  description: string;
  image: string;
  price: string;
  oldPrice: string;
  targetAudience: 'erkaklar' | 'ayollar' | 'bolalar';
  category: string;
  isNew: boolean;
  status: 'published' | 'draft';
};

const EMPTY_PRODUCT_FORM: ProductFormState = {
  id: null,
  modelCode: '',
  modelName: '',
  variantNumber: '',
  description: '',
  image: '',
  price: '',
  oldPrice: '',
  targetAudience: 'ayollar',
  category: 'xalat',
  isNew: false,
  status: 'published',
};

function parseModelNumber(raw: string): { code: string; name: string } {
  if (!raw) return { code: '', name: '' };
  const splitters = [' — ', ' – ', ' - '];
  for (const s of splitters) {
    const idx = raw.indexOf(s);
    if (idx > -1) return { code: raw.slice(0, idx).trim(), name: raw.slice(idx + s.length).trim() };
  }
  if (/^[A-Za-z0-9_\-]+$/.test(raw.trim()) && raw.trim().length <= 12) return { code: raw.trim(), name: '' };
  return { code: '', name: raw };
}

function composeModelNumber(code: string, name: string): string {
  const c = code.trim();
  const n = name.trim();
  if (c && n) return `${c} — ${n}`;
  return c || n;
}

interface CategorySelectProps {
  value: string;
  onChange: (id: string) => void;
  categories: Category[];
  onAddCategory: (uz: string, ru: string) => Category;
  isUz: boolean;
  testID?: string;
}

function CategorySelect({ value, onChange, categories, onAddCategory, isUz, testID }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newUz, setNewUz] = useState('');
  const [newRu, setNewRu] = useState('');
  const handleCloseCategory = useCallback(() => {
    setOpen(false);
    setAdding(false);
    setNewUz('');
    setNewRu('');
  }, []);
  useEscapeKey(open, handleCloseCategory);

  const selected = categories.find((c) => c.id === value);
  const currentLabel = selected ? (isUz ? selected.uz : selected.ru) : (isUz ? 'Kategoriyani tanlang...' : 'Выберите категорию...');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.uz.toLowerCase().includes(q) || c.ru.toLowerCase().includes(q));
  }, [categories, search]);

  const resetCreator = useCallback(() => {
    setAdding(false);
    setNewUz('');
    setNewRu('');
  }, []);

  const handleCreate = useCallback(() => {
    const uz = newUz.trim();
    const ru = newRu.trim() || uz;
    if (!uz) return;
    const created = onAddCategory(uz, ru);
    onChange(created.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetCreator();
    setOpen(false);
  }, [newUz, newRu, onAddCategory, onChange, resetCreator]);

  return (
    <View>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); setOpen(true); }}
        style={styles.selectTrigger}
        testID={testID}
      >
        <Layers size={14} color="#666" strokeWidth={1.5} />
        <Text style={styles.selectTriggerText} numberOfLines={1}>{currentLabel}</Text>
        <ChevronDown size={14} color="#999" strokeWidth={1.5} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => { setOpen(false); resetCreator(); }}>
        <Pressable style={styles.selectBackdrop} onPress={() => { setOpen(false); resetCreator(); }}>
          <Pressable style={styles.selectSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.selectSheetHeader}>
              <Text style={styles.selectSheetTitle}>{isUz ? 'Kategoriya' : 'Категория'}</Text>
              <Pressable onPress={() => { setOpen(false); resetCreator(); }} style={styles.selectSheetClose}>
                <X size={16} color="#666" strokeWidth={1.5} />
              </Pressable>
            </View>
            <View style={styles.catSearchWrap}>
              <Search size={13} color="#AAA" strokeWidth={1.5} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={isUz ? 'Qidirish...' : 'Поиск...'}
                placeholderTextColor="#BBB"
                style={styles.catSearchInput}
                testID={`${testID}-search`}
              />
            </View>
            <ScrollView style={styles.selectSheetScroll} showsVerticalScrollIndicator={false}>
              {filtered.map((cat) => {
                const active = cat.id === value;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => { Haptics.selectionAsync(); onChange(cat.id); setOpen(false); setSearch(''); }}
                    style={[styles.selectOption, active && styles.selectOptionActive]}
                    testID={`${testID}-option-${cat.id}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>
                        {isUz ? cat.uz : cat.ru}
                      </Text>
                      <Text style={styles.catOptionSub}>
                        {isUz ? cat.ru : cat.uz}
                      </Text>
                    </View>
                    {active && <Check size={14} color="#000" strokeWidth={2} />}
                  </Pressable>
                );
              })}
              {filtered.length === 0 && (
                <View style={styles.catEmpty}>
                  <Text style={styles.catEmptyText}>
                    {isUz ? 'Natija topilmadi' : 'Ничего не найдено'}
                  </Text>
                </View>
              )}
              {!adding ? (
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setAdding(true); setNewUz(search); }}
                  style={styles.catAddRow}
                  testID={`${testID}-add-trigger`}
                >
                  <View style={styles.catAddIcon}>
                    <Plus size={12} color="#000" strokeWidth={2} />
                  </View>
                  <Text style={styles.catAddText}>
                    {isUz ? "Yangi qo'shish" : 'Добавить новую'}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.catCreator}>
                  <Text style={styles.catCreatorTitle}>
                    {isUz ? 'Yangi kategoriya' : 'Новая категория'}
                  </Text>
                  <TextInput
                    value={newUz}
                    onChangeText={setNewUz}
                    placeholder={isUz ? "O'zbekcha nomi" : 'Название (узб.)'}
                    placeholderTextColor="#CCC"
                    style={styles.designTextInput}
                    testID={`${testID}-new-uz`}
                  />
                  <TextInput
                    value={newRu}
                    onChangeText={setNewRu}
                    placeholder={isUz ? 'Ruscha nomi (ixtiyoriy)' : 'Название (русск.)'}
                    placeholderTextColor="#CCC"
                    style={styles.designTextInput}
                    testID={`${testID}-new-ru`}
                  />
                  <View style={styles.catCreatorActions}>
                    <Pressable onPress={resetCreator} style={styles.productSheetCancelBtn}>
                      <Text style={styles.productSheetCancelText}>
                        {isUz ? 'Bekor qilish' : 'Отмена'}
                      </Text>
                    </Pressable>
                    <Pressable onPress={handleCreate} style={styles.productSheetSaveBtn} testID={`${testID}-new-save`}>
                      <Plus size={12} color="#FFF" strokeWidth={2} />
                      <Text style={styles.productSheetSaveText}>
                        {isUz ? "Qo'shish" : 'Добавить'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const DEPT_OPTIONS: { key: 'erkaklar' | 'ayollar' | 'bolalar'; uz: string; ru: string }[] = [
  { key: 'erkaklar', uz: 'Erkaklar', ru: 'Мужчины' },
  { key: 'ayollar', uz: 'Ayollar', ru: 'Женщины' },
  { key: 'bolalar', uz: 'Bolalar', ru: 'Дети' },
];

function ColorPickerRow({
  value,
  onChange,
  presets,
  testID,
}: {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
  testID: string;
}) {
  const [customHex, setCustomHex] = useState(value);

  useEffect(() => {
    setCustomHex(value);
  }, [value]);

  const handleHexSubmit = useCallback(() => {
    const hex = customHex.trim();
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex) || hex === 'transparent') {
      onChange(hex);
    }
  }, [customHex, onChange]);

  const isLight = useCallback((color: string) => {
    if (color === 'transparent' || color === '#FFFFFF' || color === '#FFF') return true;
    if (!color.startsWith('#') || color.length < 7) return false;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }, []);

  return (
    <View style={styles.colorPickerRow}>
      {presets.map((color) => {
        const isActive = value === color;
        const isTransparent = color === 'transparent';
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            style={[
              styles.colorSwatch,
              isTransparent ? styles.colorSwatchTransparent : { backgroundColor: color },
              isActive && styles.colorSwatchActive,
            ]}
            testID={`${testID}-${color}`}
          >
            {isTransparent && (
              <View style={styles.colorSwatchTransparentLine}>
                <View style={{ position: 'absolute' as const, top: 0, left: 0, width: '141%', height: 1, backgroundColor: '#FF0000', transform: [{ rotate: '45deg' }], transformOrigin: 'top left' }} />
              </View>
            )}
            {isActive && (
              <View style={styles.colorSwatchCheck}>
                <Check size={14} color={isLight(color) ? '#000' : '#FFF'} strokeWidth={2} />
              </View>
            )}
          </Pressable>
        );
      })}
      <TextInput
        value={customHex}
        onChangeText={setCustomHex}
        onBlur={handleHexSubmit}
        onSubmitEditing={handleHexSubmit}
        style={styles.colorHexInput}
        placeholder="#000000"
        placeholderTextColor="#CCC"
        testID={`${testID}-hex`}
      />
    </View>
  );
}

export default function AccountantDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, logout, language } = useAuth();
  const { products, updateProduct, addProduct, deleteProduct } = useProducts();
  const adminLightbox = useLightbox();
  const { categories, addCategory } = useCategories();
  const { config, isSaving, saveAll, resetToDefaults } = useHomepageConfig();
  const { settings: siteSettings, updateSettings: updateSiteSettings, resetToDefaults: resetDesignDefaults, isSaving: isDesignSaving } = useSiteSettings();
  const [localDesign, setLocalDesign] = useState<SiteSettings>(siteSettings);
  const [hasDesignChanges, setHasDesignChanges] = useState(false);
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const isUz = language === 'uz';

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [localConfig, setLocalConfig] = useState<HomepageConfigItem[]>(config);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [hasConfigChanges, setHasConfigChanges] = useState(false);
  const [priceSearch, setPriceSearch] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editOldPrice, setEditOldPrice] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);

  useEscapeKey(productFormOpen, () => setProductFormOpen(false));

  const openCreateProduct = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductFormOpen(true);
  }, []);

  const openEditProduct = useCallback((p: Product) => {
    Haptics.selectionAsync();
    const parsed = parseModelNumber(p.modelNumber);
    setProductForm({
      id: p.id,
      modelCode: parsed.code,
      modelName: parsed.name,
      variantNumber: p.variantNumber,
      description: p.description ?? '',
      image: p.image,
      price: p.price !== null && p.price !== undefined ? String(p.price) : '',
      oldPrice: p.oldPrice !== null && p.oldPrice !== undefined ? String(p.oldPrice) : '',
      targetAudience: (p.targetAudience ?? 'ayollar') as 'erkaklar' | 'ayollar' | 'bolalar',
      category: p.category || 'xalat',
      isNew: !!p.isNew,
      status: p.status,
    });
    setProductFormOpen(true);
  }, []);

  const handleProductFormField = useCallback(<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setProductForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const persistProduct = useCallback((): boolean => {
    const composed = composeModelNumber(productForm.modelCode, productForm.modelName);
    if (!productForm.modelCode.trim()) {
      Alert.alert(isUz ? 'Model kodi' : 'Код модели', isUz ? 'Model kodini kiriting' : 'Укажите код модели');
      return false;
    }
    if (!composed) {
      Alert.alert(isUz ? 'Maydon' : 'Поле', isUz ? 'Model yoki nomini kiriting' : 'Укажите модель или название');
      return false;
    }
    const variantTrim = productForm.variantNumber.trim();
    if (!variantTrim) {
      Alert.alert(isUz ? 'Variant kodi' : 'Код варианта', isUz ? 'Unikal variant kodini kiriting' : 'Укажите уникальный код варианта');
      return false;
    }
    const vcLower = variantTrim.toLowerCase();
    const duplicate = products.some((p) => {
      if (productForm.id && p.id === productForm.id) return false;
      return p.variantNumber.trim().toLowerCase() === vcLower;
    });
    if (duplicate) {
      Alert.alert(
        isUz ? 'Takrorlangan kod' : 'Код занят',
        isUz ? `"${variantTrim}" variant kodi allaqachon mavjud` : `Код варианта "${variantTrim}" уже существует`,
      );
      return false;
    }
    if (!productForm.image) {
      Alert.alert(isUz ? 'Rasm' : 'Изображение', isUz ? 'Rasm yuklang' : 'Загрузите изображение');
      return false;
    }
    const priceNum = productForm.price.trim() ? parseFloat(productForm.price) : null;
    const oldPriceNum = productForm.oldPrice.trim() ? parseFloat(productForm.oldPrice) : null;

    if (productForm.id) {
      updateProduct(productForm.id, {
        modelNumber: composed,
        variantNumber: productForm.variantNumber.trim(),
        description: productForm.description.trim() || undefined,
        image: productForm.image,
        price: priceNum,
        oldPrice: oldPriceNum,
        targetAudience: productForm.targetAudience,
        category: productForm.category,
        isNew: productForm.isNew,
        status: productForm.status,
      });
    } else {
      addProduct({
        modelNumber: composed,
        variantNumber: productForm.variantNumber.trim() || 'A-STD',
        description: productForm.description.trim() || undefined,
        image: productForm.image,
        price: priceNum,
        oldPrice: oldPriceNum,
        targetAudience: productForm.targetAudience,
        category: productForm.category,
        isTrending: false,
        isNew: productForm.isNew,
        visibility: 'all',
        status: productForm.status,
        createdBy: 'accountant',
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('[AccountantDashboard] Product saved:', composed);
    return true;
  }, [productForm, addProduct, updateProduct, isUz]);

  const handleSaveProduct = useCallback(() => {
    if (!persistProduct()) return;
    setProductFormOpen(false);
    setProductForm(EMPTY_PRODUCT_FORM);
  }, [persistProduct]);

  const handleSaveAndNewVariant = useCallback(() => {
    if (!persistProduct()) return;
    setProductForm((prev) => ({
      ...EMPTY_PRODUCT_FORM,
      modelCode: prev.modelCode,
      modelName: prev.modelName,
      description: prev.description,
      targetAudience: prev.targetAudience,
      category: prev.category,
    }));
  }, [persistProduct]);

  const handleAddCategory = useCallback((uz: string, ru: string) => {
    return addCategory({ uz, ru });
  }, [addCategory]);

  const handleDeleteProduct = useCallback((p: Product) => {
    Alert.alert(
      isUz ? "O'chirish" : 'Удалить',
      isUz ? `"${p.modelNumber}" mahsuloti o'chirilsinmi?` : `Удалить товар "${p.modelNumber}"?`,
      [
        { text: isUz ? 'Bekor qilish' : 'Отмена', style: 'cancel' },
        {
          text: isUz ? "O'chirish" : 'Удалить',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteProduct(p.id);
          },
        },
      ],
    );
  }, [deleteProduct, isUz]);

  const modelIndex = useMemo(() => {
    const map = new Map<string, { modelNumber: string; modelName: string; category: string; targetAudience: 'erkaklar' | 'ayollar' | 'bolalar'; description?: string }>();
    products.forEach((p) => {
      const parsed = parseModelNumber(p.modelNumber);
      const key = parsed.code.trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          modelNumber: p.modelNumber,
          modelName: parsed.name,
          category: p.category,
          targetAudience: (p.targetAudience ?? 'ayollar') as 'erkaklar' | 'ayollar' | 'bolalar',
          description: p.description,
        });
      }
    });
    return map;
  }, [products]);

  const variantCodeSet = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.variantNumber) set.add(p.variantNumber.trim().toLowerCase());
    });
    return set;
  }, [products]);

  const modelMatch = useMemo(() => {
    const key = productForm.modelCode.trim().toLowerCase();
    if (!key) return null;
    return modelIndex.get(key) ?? null;
  }, [modelIndex, productForm.modelCode]);

  const modelLocked = !!modelMatch && !productForm.id;

  useEffect(() => {
    if (!productFormOpen) return;
    if (productForm.id) return;
    if (!modelMatch) return;
    setProductForm((prev) => {
      const shouldUpdate =
        prev.modelName !== modelMatch.modelName ||
        prev.category !== modelMatch.category ||
        prev.targetAudience !== modelMatch.targetAudience;
      if (!shouldUpdate) return prev;
      return {
        ...prev,
        modelName: modelMatch.modelName,
        category: modelMatch.category,
        targetAudience: modelMatch.targetAudience,
        description: prev.description || modelMatch.description || '',
      };
    });
  }, [modelMatch, productFormOpen, productForm.id]);

  const variantDuplicate = useMemo(() => {
    const vc = productForm.variantNumber.trim().toLowerCase();
    if (!vc) return false;
    if (productForm.id) {
      const current = products.find((p) => p.id === productForm.id);
      if (current && current.variantNumber.trim().toLowerCase() === vc) return false;
    }
    return variantCodeSet.has(vc);
  }, [productForm.variantNumber, productForm.id, variantCodeSet, products]);

  const productsTableData = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 100);
    const q = productSearch.toLowerCase().trim();
    return products.filter((p) =>
      p.modelNumber.toLowerCase().includes(q) ||
      p.variantNumber.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false)
    ).slice(0, 100);
  }, [products, productSearch]);

  const getDeptLabel = useCallback((audience?: string) => {
    const d = DEPT_OPTIONS.find((x) => x.key === audience);
    return d ? (isUz ? d.uz : d.ru) : '—';
  }, [isUz]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  const handleTabChange = useCallback((tab: DashboardTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  }, []);

  const stats = useMemo(() => [
    {
      icon: DollarSign,
      label: isUz ? 'Oylik tushum' : 'Месячный доход',
      value: '$48,200',
    },
    {
      icon: Users,
      label: isUz ? 'Faol mijozlar' : 'Активные клиенты',
      value: '156',
    },
    {
      icon: FileText,
      label: isUz ? 'Hisob-fakturalar' : 'Счета-фактуры',
      value: '34',
    },
    {
      icon: Package,
      label: isUz ? 'Mahsulotlar' : 'Продукты',
      value: String(products.length),
    },
  ], [isUz, products.length]);

  const handleSegmentChange = useCallback((elementKey: string, newSegment: string) => {
    Haptics.selectionAsync();
    setLocalConfig((prev) =>
      prev.map((item) =>
        item.element_key === elementKey
          ? { ...item, destination_segment: newSegment, destination_category: undefined }
          : item
      )
    );
    setHasConfigChanges(true);
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
    setHasConfigChanges(true);
  }, []);

  const handleConfigSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveAll(localConfig);
    setHasConfigChanges(false);
    console.log('[AccountantDashboard] Showroom config saved');
  }, [localConfig, saveAll]);

  const handleConfigReset = useCallback(() => {
    Alert.alert(
      isUz ? 'Qayta tiklash' : 'Сброс',
      isUz ? "Barcha sozlamalar boshlang'ich holatga qaytarilsinmi?" : 'Сбросить все настройки?',
      [
        { text: isUz ? 'Bekor qilish' : 'Отмена', style: 'cancel' },
        {
          text: isUz ? 'Qayta tiklash' : 'Сбросить',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetToDefaults();
            setLocalConfig(config);
            setHasConfigChanges(false);
          },
        },
      ]
    );
  }, [isUz, resetToDefaults, config]);

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
    if (!catId) return isUz ? 'Hammasi' : 'Все';
    return categories.find((c) => c.id === catId)?.[isUz ? 'uz' : 'ru'] ?? catId;
  }, [isUz]);

  const filteredProducts = useMemo(() => {
    if (!priceSearch.trim()) return products.slice(0, 50);
    const q = priceSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.modelNumber.toLowerCase().includes(q) ||
        p.variantNumber.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [products, priceSearch]);

  const handleStartEditPrice = useCallback((product: Product) => {
    setEditingProductId(product.id);
    setEditPrice(product.price !== null ? String(product.price) : '');
    setEditOldPrice(product.oldPrice !== null && product.oldPrice !== undefined ? String(product.oldPrice) : '');
  }, []);

  const handleSavePrice = useCallback((productId: string) => {
    const newPrice = editPrice.trim() ? parseFloat(editPrice) : null;
    const newOldPrice = editOldPrice.trim() ? parseFloat(editOldPrice) : null;
    updateProduct(productId, { price: newPrice, oldPrice: newOldPrice });
    setEditingProductId(null);
    setEditPrice('');
    setEditOldPrice('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('[AccountantDashboard] Price updated:', productId, newPrice, newOldPrice);
  }, [editPrice, editOldPrice, updateProduct]);

  const handleCancelEditPrice = useCallback(() => {
    setEditingProductId(null);
    setEditPrice('');
    setEditOldPrice('');
  }, []);

  useEffect(() => {
    setLocalDesign(siteSettings);
  }, [siteSettings]);

  const handleDesignChange = useCallback(<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setLocalDesign((prev) => ({ ...prev, [key]: value }));
    setHasDesignChanges(true);
  }, []);

  const handleHeroBannerChange = useCallback((dept: HeroDepartmentKey, field: keyof HeroBannerConfig, value: string) => {
    setLocalDesign((prev) => ({
      ...prev,
      heroBanners: {
        ...prev.heroBanners,
        [dept]: {
          ...prev.heroBanners[dept],
          [field]: value,
        },
      },
    }));
    setHasDesignChanges(true);
  }, []);

  const [activeHeroDept, setActiveHeroDept] = useState<HeroDepartmentKey>('all');

  const handleDesignSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateSiteSettings(localDesign);
    setHasDesignChanges(false);
    console.log('[AccountantDashboard] Design settings saved');
  }, [localDesign, updateSiteSettings]);

  const handleDesignReset = useCallback(() => {
    Alert.alert(
      isUz ? 'Qayta tiklash' : 'Сброс',
      isUz ? "Barcha dizayn sozlamalari boshlang'ich holatga qaytarilsinmi?" : 'Сбросить все настройки дизайна?',
      [
        { text: isUz ? 'Bekor qilish' : 'Отмена', style: 'cancel' },
        {
          text: isUz ? 'Qayta tiklash' : 'Сбросить',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetDesignDefaults();
            setLocalDesign(DEFAULT_SITE_SETTINGS);
            setHasDesignChanges(false);
          },
        },
      ]
    );
  }, [isUz, resetDesignDefaults]);

  const tabs: { key: DashboardTab; label: string; icon: typeof DollarSign }[] = useMemo(() => [
    { key: 'overview', label: isUz ? 'Umumiy' : 'Обзор', icon: FileText },
    { key: 'products', label: isUz ? 'Mahsulotlar' : 'Товары', icon: Package },
    { key: 'showroom', label: isUz ? 'Showroom' : 'Шоурум', icon: Layers },
    { key: 'pricing', label: isUz ? 'Narxlar' : 'Цены', icon: Tag },
    { key: 'design', label: isUz ? 'Dizayn' : 'Дизайн', icon: Palette },
  ], [isUz]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {isWeb && <WebHeader />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && { paddingTop: 24 },
          !isWeb && { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {!isWeb && (
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="accountant-back">
              <ArrowLeft size={18} color="#888" strokeWidth={1.5} />
              <Text style={styles.backText}>{t('mainPage')}</Text>
            </Pressable>
          )}

          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {isUz ? 'Xush kelibsiz!' : 'Добро пожаловать!'}
              </Text>
              <Text style={styles.pageTitle}>
                {isUz ? 'BUXGALTERIYA' : 'БУХГАЛТЕРИЯ'}
              </Text>
            </View>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
              testID="accountant-logout"
            >
              <LogOut size={16} color="#999" strokeWidth={1.5} />
            </Pressable>
          </View>

          <View style={styles.titleUnderline} />

          {/* TAB BAR */}
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const IconComp = tab.icon;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key)}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  testID={`tab-${tab.key}`}
                >
                  <IconComp size={14} color={isActive ? '#000' : '#AAA'} strokeWidth={1.5} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
                {stats.map((stat, i) => {
                  const IconComp = stat.icon;
                  return (
                    <View key={i} style={styles.statCard}>
                      <View style={styles.statIconWrap}>
                        <IconComp size={18} color="#000" strokeWidth={1.5} />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionLabel}>
                  {isUz ? 'TEZKOR HARAKATLAR' : 'БЫСТРЫЕ ДЕЙСТВИЯ'}
                </Text>
                <View style={styles.quickActionsGrid}>
                  <Pressable
                    onPress={() => handleTabChange('showroom')}
                    style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
                    testID="quick-showroom"
                  >
                    <Layers size={18} color="#000" strokeWidth={1.3} />
                    <Text style={styles.quickActionText}>
                      {isUz ? 'Showroom boshqaruvi' : 'Управление шоурумом'}
                    </Text>
                    <Text style={styles.quickActionDesc}>
                      {isUz ? 'Havolalar va segmentlarni sozlash' : 'Настройка ссылок и сегментов'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleTabChange('pricing')}
                    style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
                    testID="quick-pricing"
                  >
                    <Tag size={18} color="#000" strokeWidth={1.3} />
                    <Text style={styles.quickActionText}>
                      {isUz ? 'Narxlarni boshqarish' : 'Управление ценами'}
                    </Text>
                    <Text style={styles.quickActionDesc}>
                      {isUz ? 'Mahsulot narxlarini tahrirlash' : 'Редактирование цен продуктов'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/(tabs)/clients' as any)}
                    style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
                    testID="quick-clients"
                  >
                    <Users size={18} color="#000" strokeWidth={1.3} />
                    <Text style={styles.quickActionText}>
                      {isUz ? "Mijozlar ro'yxati" : 'Список клиентов'}
                    </Text>
                    <Text style={styles.quickActionDesc}>
                      {isUz ? "Barcha mijozlarni ko'rish" : 'Просмотр всех клиентов'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* SHOWROOM CMS TAB */}
          {activeTab === 'showroom' && (
            <View style={styles.tabContent}>
              <View style={styles.showroomHeader}>
                <View>
                  <Text style={styles.sectionLabel}>SHOWROOM BOSHQARUVI</Text>
                  <Text style={styles.showroomSubtitle}>
                    {isUz
                      ? 'Har bir element qayerga olib borishini sozlang'
                      : 'Настройте назначение каждого элемента'}
                  </Text>
                </View>
                <View style={styles.showroomActions}>
                  <Pressable
                    onPress={handleConfigReset}
                    style={styles.resetBtn}
                    testID="showroom-reset"
                  >
                    <RotateCcw size={14} color="#999" strokeWidth={1.5} />
                  </Pressable>
                  <Pressable
                    onPress={handleConfigSave}
                    style={[styles.saveBtn, !hasConfigChanges && styles.saveBtnDisabled]}
                    disabled={!hasConfigChanges || isSaving}
                    testID="showroom-save"
                  >
                    <Save size={13} color={hasConfigChanges ? '#FFF' : '#999'} strokeWidth={1.5} />
                    <Text style={[styles.saveBtnText, !hasConfigChanges && styles.saveBtnTextDisabled]}>
                      {isSaving
                        ? (isUz ? 'Saqlanmoqda...' : 'Сохранение...')
                        : (isUz ? 'Saqlash' : 'Сохранить')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {Object.entries(grouped).map(([sectionName, items]) => (
                <View key={sectionName} style={styles.configSection}>
                  <Text style={styles.configSectionTitle}>{sectionName}</Text>
                  {items.map((item) => {
                    const isExpanded = expandedKey === item.element_key;
                    return (
                      <View key={item.element_key} style={styles.configCard}>
                        <Pressable
                          onPress={() => toggleExpand(item.element_key)}
                          style={styles.configCardHeader}
                          testID={`config-${item.element_key}`}
                        >
                          <View style={styles.configCardInfo}>
                            <Text style={styles.configLabel}>{item.label}</Text>
                            <Text style={styles.configCurrent}>
                              {getSegmentLabel(item.destination_segment)}
                              {item.destination_category ? ` → ${getCategoryLabel(item.destination_category)}` : ''}
                            </Text>
                          </View>
                          <ChevronDown
                            size={15}
                            color="#AAA"
                            strokeWidth={1.5}
                            style={isExpanded ? { transform: [{ rotate: '180deg' }] } : undefined}
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
                                    testID={`seg-${item.element_key}-${seg.id}`}
                                  >
                                    {active && <Check size={10} color="#FFF" strokeWidth={2} />}
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                      {seg.label}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>

                            <Text style={[styles.pickerLabel, { marginTop: 14 }]}>
                              {isUz ? 'KATEGORIYA (ixtiyoriy)' : 'КАТЕГОРИЯ (необязательно)'}
                            </Text>
                            <View style={styles.chipRow}>
                              <Pressable
                                onPress={() => handleCategoryChange(item.element_key, undefined)}
                                style={[styles.chip, !item.destination_category && styles.chipActive]}
                              >
                                {!item.destination_category && <Check size={10} color="#FFF" strokeWidth={2} />}
                                <Text style={[styles.chipText, !item.destination_category && styles.chipTextActive]}>
                                  {isUz ? 'Hammasi' : 'Все'}
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
                                      {isUz ? cat.uz : cat.ru}
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
            </View>
          )}

          {/* DESIGN TAB */}
          {activeTab === 'design' && (
            <View style={styles.tabContent}>
              <View style={styles.showroomHeader}>
                <View>
                  <Text style={styles.sectionLabel}>DIZAYN SOZLAMALARI</Text>
                  <Text style={styles.showroomSubtitle}>
                    {isUz
                      ? 'Sayt ranglar, matnlar va komponentlarni boshqaring'
                      : 'Управление цветами, текстами и компонентами'}
                  </Text>
                </View>
                <View style={styles.showroomActions}>
                  <Pressable
                    onPress={handleDesignReset}
                    style={styles.resetBtn}
                    testID="design-reset"
                  >
                    <RotateCcw size={14} color="#999" strokeWidth={1.5} />
                  </Pressable>
                  <Pressable
                    onPress={handleDesignSave}
                    style={[styles.saveBtn, !hasDesignChanges && styles.saveBtnDisabled]}
                    disabled={!hasDesignChanges || isDesignSaving}
                    testID="design-save"
                  >
                    <Save size={13} color={hasDesignChanges ? '#FFF' : '#999'} strokeWidth={1.5} />
                    <Text style={[styles.saveBtnText, !hasDesignChanges && styles.saveBtnTextDisabled]}>
                      {isDesignSaving
                        ? (isUz ? 'Saqlanmoqda...' : 'Сохранение...')
                        : (isUz ? 'Saqlash' : 'Сохранить')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* TOP BANNER */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'YUQORI BANNER' : 'ВЕРХНИЙ БАННЕР'}
                </Text>
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Banner ko\'rsatilsinmi' : 'Показать баннер'}
                  </Text>
                  <Pressable
                    onPress={() => handleDesignChange('topBannerEnabled', !localDesign.topBannerEnabled)}
                    style={[styles.toggleBtn, localDesign.topBannerEnabled && styles.toggleBtnActive]}
                    testID="toggle-top-banner"
                  >
                    {localDesign.topBannerEnabled
                      ? <Eye size={14} color="#FFF" strokeWidth={1.5} />
                      : <EyeOff size={14} color="#999" strokeWidth={1.5} />}
                    <Text style={[styles.toggleText, localDesign.topBannerEnabled && styles.toggleTextActive]}>
                      {localDesign.topBannerEnabled ? (isUz ? 'Yoqilgan' : 'Вкл') : (isUz ? "O'chirilgan" : 'Выкл')}
                    </Text>
                  </Pressable>
                </View>
                {localDesign.topBannerEnabled && (
                  <>
                    <View style={styles.designRow}>
                      <Text style={styles.designLabel}>
                        {isUz ? 'Banner matni' : 'Текст баннера'}
                      </Text>
                    </View>
                    <TextInput
                      value={localDesign.topBannerText}
                      onChangeText={(v) => handleDesignChange('topBannerText', v)}
                      style={styles.designTextInput}
                      placeholder={isUz ? 'Banner matni...' : 'Текст баннера...'}
                      placeholderTextColor="#CCC"
                      testID="input-banner-text"
                    />
                    <View style={styles.designRow}>
                      <Text style={styles.designLabel}>
                        {isUz ? 'Banner fon rangi' : 'Цвет фона баннера'}
                      </Text>
                    </View>
                    <ColorPickerRow
                      value={localDesign.topBannerBgColor}
                      onChange={(v) => handleDesignChange('topBannerBgColor', v)}
                      presets={['#000000', '#1A1A1A', '#8B0000', '#003366', '#2D4A2D']}
                      testID="color-banner-bg"
                    />
                    <View style={styles.designRow}>
                      <Text style={styles.designLabel}>
                        {isUz ? 'Banner matn rangi' : 'Цвет текста баннера'}
                      </Text>
                    </View>
                    <ColorPickerRow
                      value={localDesign.topBannerTextColor}
                      onChange={(v) => handleDesignChange('topBannerTextColor', v)}
                      presets={['#FFFFFF', '#F5F5F5', '#FFD700', '#E0E0E0']}
                      testID="color-banner-text"
                    />
                  </>
                )}
              </View>

              {/* COLORS */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'RANGLAR' : 'ЦВЕТА'}
                </Text>
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Asosiy rang' : 'Основной цвет'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.primaryColor}
                  onChange={(v) => handleDesignChange('primaryColor', v)}
                  presets={['#000000', '#1A1A1A', '#8B0000', '#003366', '#2D4A2D', '#4A3728']}
                  testID="color-primary"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Ikkinchi darajali rang' : 'Вторичный цвет'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.secondaryColor}
                  onChange={(v) => handleDesignChange('secondaryColor', v)}
                  presets={['#FFFFFF', '#FAFAFA', '#F5F5F0', '#FFF8F0', '#F0F4F8']}
                  testID="color-secondary"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Aksent rang' : 'Акцентный цвет'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.accentColor}
                  onChange={(v) => handleDesignChange('accentColor', v)}
                  presets={['#1A1A1A', '#8B0000', '#C4A35A', '#003366', '#556B2F']}
                  testID="color-accent"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Sarlavha fon rangi' : 'Цвет фона шапки'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.headerBgColor}
                  onChange={(v) => handleDesignChange('headerBgColor', v)}
                  presets={['#FFFFFF', '#FAFAFA', '#F5F5F0', '#000000', '#1A1A1A']}
                  testID="color-header-bg"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Sayt fon rangi' : 'Цвет фона сайта'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.bodyBgColor}
                  onChange={(v) => handleDesignChange('bodyBgColor', v)}
                  presets={['#FFFFFF', '#FAFAFA', '#F5F5F0', '#FFF8F0', '#F0F4F8']}
                  testID="color-body-bg"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Footer fon rangi' : 'Цвет фона подвала'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.footerBgColor}
                  onChange={(v) => handleDesignChange('footerBgColor', v)}
                  presets={['#F2F2F2', '#F7F7F7', '#FAFAFA', '#1A1A1A', '#000000']}
                  testID="color-footer-bg"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Asosiy matn rangi' : 'Цвет основного текста'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.textPrimaryColor}
                  onChange={(v) => handleDesignChange('textPrimaryColor', v)}
                  presets={['#000000', '#1A1A1A', '#333333', '#FFFFFF']}
                  testID="color-text-primary"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Ikkinchi darajali matn' : 'Цвет вторичного текста'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.textSecondaryColor}
                  onChange={(v) => handleDesignChange('textSecondaryColor', v)}
                  presets={['#666666', '#888888', '#999999', '#AAAAAA']}
                  testID="color-text-secondary"
                />
              </View>

              {/* HERO BANNER — PER DEPARTMENT CMS */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'ASOSIY BANNER (HERO)' : 'ГЛАВНЫЙ БАННЕР (HERO)'}
                </Text>
                <Text style={styles.showroomSubtitle}>
                  {isUz
                    ? 'Har bir bo\'lim uchun banner rasmi, matn va havolani boshqaring'
                    : 'Управляйте изображением, текстом и ссылкой баннера для каждого отдела'}
                </Text>

                <View style={styles.heroDeptTabs}>
                  {([
                    { key: 'all' as HeroDepartmentKey, label: isUz ? 'Umumiy' : 'Общий' },
                    { key: 'men' as HeroDepartmentKey, label: isUz ? 'Erkaklar' : 'Мужчины' },
                    { key: 'women' as HeroDepartmentKey, label: isUz ? 'Ayollar' : 'Женщины' },
                    { key: 'kids' as HeroDepartmentKey, label: isUz ? 'Bolalar' : 'Дети' },
                  ]).map((dt) => {
                    const isActive = activeHeroDept === dt.key;
                    return (
                      <Pressable
                        key={dt.key}
                        onPress={() => { Haptics.selectionAsync(); setActiveHeroDept(dt.key); }}
                        style={[styles.heroDeptTab, isActive && styles.heroDeptTabActive]}
                        testID={`hero-dept-${dt.key}`}
                      >
                        <Text style={[styles.heroDeptTabText, isActive && styles.heroDeptTabTextActive]}>
                          {dt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {(() => {
                  const banner = localDesign.heroBanners[activeHeroDept];
                  return (
                    <View style={styles.heroEditorWrap}>
                      <Text style={styles.heroFieldLabel}>
                        {isUz ? 'Banner rasmi' : 'Изображение баннера'}
                      </Text>
                      <ImageDropzone
                        value={banner.imageUrl}
                        onChange={(v) => handleHeroBannerChange(activeHeroDept, 'imageUrl', v)}
                        isUz={isUz}
                        testID={`hero-image-${activeHeroDept}`}
                      />

                      <Text style={styles.heroFieldLabel}>
                        {isUz ? 'Sarlavha' : 'Заголовок'}
                      </Text>
                      <TextInput
                        value={banner.title}
                        onChangeText={(v) => handleHeroBannerChange(activeHeroDept, 'title', v)}
                        style={styles.designTextInput}
                        placeholder={isUz ? 'YANGI KOLLEKSIYA' : 'НОВАЯ КОЛЛЕКЦИЯ'}
                        placeholderTextColor="#CCC"
                        testID={`hero-title-${activeHeroDept}`}
                      />

                      <Text style={styles.heroFieldLabel}>
                        {isUz ? 'Qo\'shimcha matn' : 'Подзаголовок'}
                      </Text>
                      <TextInput
                        value={banner.subtitle}
                        onChangeText={(v) => handleHeroBannerChange(activeHeroDept, 'subtitle', v)}
                        style={styles.designTextInput}
                        placeholder={isUz ? 'BAHOR-YOZ 2026' : 'ВЕСНА-ЛЕТО 2026'}
                        placeholderTextColor="#CCC"
                        testID={`hero-subtitle-${activeHeroDept}`}
                      />

                      <Text style={styles.heroFieldLabel}>
                        {isUz ? 'Tugma matni' : 'Текст кнопки'}
                      </Text>
                      <TextInput
                        value={banner.buttonText}
                        onChangeText={(v) => handleHeroBannerChange(activeHeroDept, 'buttonText', v)}
                        style={styles.designTextInput}
                        placeholder={isUz ? "KOLLEKSIYANI KO'RISH" : 'СМОТРЕТЬ КОЛЛЕКЦИЮ'}
                        placeholderTextColor="#CCC"
                        testID={`hero-button-${activeHeroDept}`}
                      />

                      <Text style={styles.heroFieldLabel}>
                        {isUz ? "Bosilganda qayerga boradi" : 'Куда ведёт при нажатии'}
                      </Text>
                      <DestinationSelect
                        value={banner.destinationUrl}
                        onChange={(v) => handleHeroBannerChange(activeHeroDept, 'destinationUrl', v)}
                        isUz={isUz}
                        testID={`hero-url-${activeHeroDept}`}
                      />
                      <Text style={styles.heroHint}>
                        {isUz
                          ? "Ro'yxatdan tanlang — URL avtomatik saqlanadi"
                          : 'Выберите из списка — URL сохранится автоматически'}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* HERO STYLE SETTINGS */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'HERO USLUB SOZLAMALARI' : 'СТИЛЬ HERO БАННЕРА'}
                </Text>
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Qorong\'ulik darajasi' : 'Затемнение'}
                  </Text>
                  <Text style={styles.designValueLabel}>
                    {Math.round(localDesign.heroOverlayOpacity * 100)}%
                  </Text>
                </View>
                <View style={styles.sliderRow}>
                  <Pressable
                    onPress={() => handleDesignChange('heroOverlayOpacity', Math.max(0, localDesign.heroOverlayOpacity - 0.05))}
                    style={styles.sliderBtn}
                  >
                    <Minus size={14} color="#666" strokeWidth={1.5} />
                  </Pressable>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${localDesign.heroOverlayOpacity * 100}%` }]} />
                  </View>
                  <Pressable
                    onPress={() => handleDesignChange('heroOverlayOpacity', Math.min(0.8, localDesign.heroOverlayOpacity + 0.05))}
                    style={styles.sliderBtn}
                  >
                    <Plus size={14} color="#666" strokeWidth={1.5} />
                  </Pressable>
                </View>

                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Matn joylashuvi' : 'Выравнивание текста'}
                  </Text>
                </View>
                <View style={styles.alignmentRow}>
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const isActive = localDesign.heroTextAlignment === align;
                    const IconComp = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                    return (
                      <Pressable
                        key={align}
                        onPress={() => handleDesignChange('heroTextAlignment', align)}
                        style={[styles.alignBtn, isActive && styles.alignBtnActive]}
                        testID={`align-${align}`}
                      >
                        <IconComp size={16} color={isActive ? '#FFF' : '#666'} strokeWidth={1.5} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* SPACING & LAYOUT */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'MASOFA VA TARTIB' : 'ОТСТУПЫ И МАКЕТ'}
                </Text>
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Bo\'limlar orasidagi masofa' : 'Расстояние между секциями'}
                  </Text>
                  <Text style={styles.designValueLabel}>{localDesign.sectionSpacing}px</Text>
                </View>
                <View style={styles.sliderRow}>
                  <Pressable
                    onPress={() => handleDesignChange('sectionSpacing', Math.max(32, localDesign.sectionSpacing - 8))}
                    style={styles.sliderBtn}
                  >
                    <Minus size={14} color="#666" strokeWidth={1.5} />
                  </Pressable>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${((localDesign.sectionSpacing - 32) / (120 - 32)) * 100}%` }]} />
                  </View>
                  <Pressable
                    onPress={() => handleDesignChange('sectionSpacing', Math.min(120, localDesign.sectionSpacing + 8))}
                    style={styles.sliderBtn}
                  >
                    <Plus size={14} color="#666" strokeWidth={1.5} />
                  </Pressable>
                </View>

                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'CTA tugmasi radiusi' : 'Радиус кнопки CTA'}
                  </Text>
                  <Text style={styles.designValueLabel}>{localDesign.ctaBorderRadius}px</Text>
                </View>
                <View style={styles.sliderRow}>
                  <Pressable
                    onPress={() => handleDesignChange('ctaBorderRadius', Math.max(0, localDesign.ctaBorderRadius - 2))}
                    style={styles.sliderBtn}
                  >
                    <Minus size={14} color="#666" strokeWidth={1.5} />
                  </Pressable>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${(localDesign.ctaBorderRadius / 24) * 100}%` }]} />
                  </View>
                  <Pressable
                    onPress={() => handleDesignChange('ctaBorderRadius', Math.min(24, localDesign.ctaBorderRadius + 2))}
                    style={styles.sliderBtn}
                  >
                    <Plus size={14} color="#666" strokeWidth={1.5} />
                  </Pressable>
                </View>
              </View>

              {/* CTA COLORS */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'CTA TUGMALARI' : 'КНОПКИ CTA'}
                </Text>
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Tugma fon rangi' : 'Цвет фона кнопки'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.ctaBgColor}
                  onChange={(v) => handleDesignChange('ctaBgColor', v)}
                  presets={['transparent', '#000000', '#FFFFFF', '#8B0000', '#003366', '#C4A35A']}
                  testID="color-cta-bg"
                />
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Tugma matn rangi' : 'Цвет текста кнопки'}
                  </Text>
                </View>
                <ColorPickerRow
                  value={localDesign.ctaTextColor}
                  onChange={(v) => handleDesignChange('ctaTextColor', v)}
                  presets={['#FFFFFF', '#000000', '#C4A35A', '#FFD700']}
                  testID="color-cta-text"
                />
              </View>

              {/* VISIBILITY TOGGLES */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'SEKSIYALAR KO\'RINISHI' : 'ВИДИМОСТЬ СЕКЦИЙ'}
                </Text>
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Falsafa bo\'limi' : 'Секция философии'}
                  </Text>
                  <Pressable
                    onPress={() => handleDesignChange('philosophySectionVisible', !localDesign.philosophySectionVisible)}
                    style={[styles.toggleBtn, localDesign.philosophySectionVisible && styles.toggleBtnActive]}
                    testID="toggle-philosophy"
                  >
                    {localDesign.philosophySectionVisible
                      ? <Eye size={14} color="#FFF" strokeWidth={1.5} />
                      : <EyeOff size={14} color="#999" strokeWidth={1.5} />}
                    <Text style={[styles.toggleText, localDesign.philosophySectionVisible && styles.toggleTextActive]}>
                      {localDesign.philosophySectionVisible ? (isUz ? 'Yoqilgan' : 'Вкл') : (isUz ? "O'chirilgan" : 'Выкл')}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.designRow}>
                  <Text style={styles.designLabel}>
                    {isUz ? 'Newsletter bo\'limi' : 'Секция рассылки'}
                  </Text>
                  <Pressable
                    onPress={() => handleDesignChange('newsletterSectionVisible', !localDesign.newsletterSectionVisible)}
                    style={[styles.toggleBtn, localDesign.newsletterSectionVisible && styles.toggleBtnActive]}
                    testID="toggle-newsletter"
                  >
                    {localDesign.newsletterSectionVisible
                      ? <Eye size={14} color="#FFF" strokeWidth={1.5} />
                      : <EyeOff size={14} color="#999" strokeWidth={1.5} />}
                    <Text style={[styles.toggleText, localDesign.newsletterSectionVisible && styles.toggleTextActive]}>
                      {localDesign.newsletterSectionVisible ? (isUz ? 'Yoqilgan' : 'Вкл') : (isUz ? "O'chirilgan" : 'Выкл')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* LIVE PREVIEW */}
              <View style={styles.designSection}>
                <Text style={styles.designSectionTitle}>
                  {isUz ? 'OLDINDAN KO\'RISH' : 'ПРЕДПРОСМОТР'}
                </Text>
                <View style={[styles.previewCard, { backgroundColor: localDesign.bodyBgColor }]}>
                  {localDesign.topBannerEnabled && (
                    <View style={[styles.previewBanner, { backgroundColor: localDesign.topBannerBgColor }]}>
                      <Text style={[styles.previewBannerText, { color: localDesign.topBannerTextColor }]} numberOfLines={1}>
                        {localDesign.topBannerText}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.previewHeader, { backgroundColor: localDesign.headerBgColor }]}>
                    <Text style={[styles.previewLogo, { color: localDesign.textPrimaryColor }]}>MILANA PREMIUM</Text>
                  </View>
                  <View style={styles.previewHero}>
                    <View style={[styles.previewHeroOverlay, { opacity: localDesign.heroOverlayOpacity }]} />
                    <View style={[
                      styles.previewHeroText,
                      localDesign.heroTextAlignment === 'center' && styles.previewHeroTextCenter,
                      localDesign.heroTextAlignment === 'right' && styles.previewHeroTextRight,
                    ]}>
                      <Text style={styles.previewHeroTitle}>KOLLEKSIYA</Text>
                      <View style={[
                        styles.previewCTA,
                        { borderRadius: localDesign.ctaBorderRadius, backgroundColor: localDesign.ctaBgColor === 'transparent' ? 'transparent' : localDesign.ctaBgColor },
                      ]}>
                        <Text style={[styles.previewCTAText, { color: localDesign.ctaTextColor }]}>KO'RISH</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.previewFooter, { backgroundColor: localDesign.footerBgColor }]}>
                    <Text style={[styles.previewFooterText, { color: localDesign.textSecondaryColor }]}>FOOTER</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <View style={styles.tabContent}>
              <View style={styles.showroomHeader}>
                <View>
                  <Text style={styles.sectionLabel}>
                    {isUz ? 'MAHSULOTLAR' : 'ТОВАРЫ'}
                  </Text>
                  <Text style={styles.showroomSubtitle}>
                    {isUz
                      ? 'Katalogga mahsulotlarni qo‘shish va boshqarish'
                      : 'Добавление и управление товарами'}
                  </Text>
                </View>
                <Pressable
                  onPress={openCreateProduct}
                  style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.primaryActionBtnPressed]}
                  testID="product-create-btn"
                >
                  <Plus size={14} color="#FFF" strokeWidth={2} />
                  <Text style={styles.primaryActionText}>
                    {isUz ? "YANGI MAHSULOT QO‘SHISH" : 'ДОБАВИТЬ ТОВАР'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <Search size={14} color="#999" strokeWidth={1.5} />
                  <TextInput
                    value={productSearch}
                    onChangeText={setProductSearch}
                    placeholder={isUz ? 'Qidirish...' : 'Поиск...'}
                    placeholderTextColor="#BBB"
                    style={styles.searchInput}
                    testID="product-search"
                  />
                  {productSearch.length > 0 && (
                    <Pressable onPress={() => setProductSearch('')} style={styles.searchClear}>
                      <X size={14} color="#999" strokeWidth={1.5} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.productsTableHeader}>
                <Text style={[styles.productsHeaderText, { width: 56 }]}>{isUz ? 'RASM' : 'ФОТО'}</Text>
                <Text style={[styles.productsHeaderText, { flex: 1.4 }]}>{isUz ? 'NOMI' : 'НАЗВАНИЕ'}</Text>
                <Text style={[styles.productsHeaderText, { flex: 0.9 }]}>{isUz ? "BO‘LIM" : 'ОТДЕЛ'}</Text>
                <Text style={[styles.productsHeaderText, { flex: 1 }]}>{isUz ? 'KATEGORIYA' : 'КАТЕГОРИЯ'}</Text>
                <Text style={[styles.productsHeaderText, { flex: 0.7, textAlign: 'right' as const }]}>{isUz ? 'NARX' : 'ЦЕНА'}</Text>
                <Text style={[styles.productsHeaderText, { flex: 0.7, textAlign: 'center' as const }]}>{isUz ? 'HOLAT' : 'СТАТУС'}</Text>
                <Text style={[styles.productsHeaderText, { width: 80, textAlign: 'right' as const }]}> </Text>
              </View>

              {productsTableData.map((product) => {
                const catLabel = categories.find((c) => c.id === product.category)?.[isUz ? 'uz' : 'ru'] ?? product.category;
                const isDraft = product.status === 'draft';
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => openEditProduct(product)}
                    style={({ pressed }) => [styles.productsRow, pressed && styles.productsRowPressed]}
                    testID={`product-row-${product.id}`}
                  >
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); adminLightbox.open(product.image); }}
                      style={{ width: 56 }}
                      testID={`product-thumb-${product.id}`}
                      {...(Platform.OS === 'web' ? ({ style: [{ width: 56, cursor: 'zoom-in' as any }] } as any) : {})}
                    >
                      <Image source={{ uri: product.image }} style={styles.productsThumb} resizeMode="cover" />
                      {product.isNew && <View style={styles.productsNewDot} />}
                    </Pressable>
                    <View style={{ flex: 1.4, paddingRight: 8 }}>
                      <Text style={styles.productsRowTitle} numberOfLines={1}>{product.modelNumber}</Text>
                      <Text style={styles.productsRowSub} numberOfLines={1}>{product.variantNumber}</Text>
                    </View>
                    <Text style={[styles.productsRowText, { flex: 0.9 }]} numberOfLines={1}>
                      {getDeptLabel(product.targetAudience)}
                    </Text>
                    <Text style={[styles.productsRowText, { flex: 1 }]} numberOfLines={1}>{catLabel}</Text>
                    <Text style={[styles.productsRowPrice, { flex: 0.7, textAlign: 'right' as const }]}>
                      {product.price !== null ? `${product.price.toFixed(2)}` : '—'}
                    </Text>
                    <View style={{ flex: 0.7, alignItems: 'center' as const }}>
                      <View style={[styles.statusPill, isDraft ? styles.statusPillDraft : styles.statusPillLive]}>
                        <Text style={[styles.statusPillText, isDraft ? styles.statusPillTextDraft : styles.statusPillTextLive]}>
                          {isDraft ? (isUz ? 'Qoralama' : 'Черновик') : (isUz ? 'Faol' : 'Актив')}
                        </Text>
                      </View>
                    </View>
                    <View style={{ width: 80, flexDirection: 'row' as const, justifyContent: 'flex-end' as const, gap: 6 }}>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); openEditProduct(product); }}
                        style={styles.iconActionBtn}
                        testID={`product-edit-${product.id}`}
                      >
                        <Type size={12} color="#666" strokeWidth={1.5} />
                      </Pressable>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); handleDeleteProduct(product); }}
                        style={styles.iconActionBtn}
                        testID={`product-delete-${product.id}`}
                      >
                        <Trash2 size={12} color="#B00" strokeWidth={1.5} />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}

              {productsTableData.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {isUz ? 'Mahsulot topilmadi' : 'Товары не найдены'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionLabel}>
                {isUz ? 'NARXLARNI BOSHQARISH' : 'УПРАВЛЕНИЕ ЦЕНАМИ'}
              </Text>

              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <Search size={14} color="#999" strokeWidth={1.5} />
                  <TextInput
                    value={priceSearch}
                    onChangeText={setPriceSearch}
                    placeholder={isUz ? 'Model raqami, kategoriya...' : 'Номер модели, категория...'}
                    placeholderTextColor="#BBB"
                    style={styles.searchInput}
                    testID="price-search"
                  />
                  {priceSearch.length > 0 && (
                    <Pressable onPress={() => setPriceSearch('')} style={styles.searchClear}>
                      <X size={14} color="#999" strokeWidth={1.5} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.priceTableHeader}>
                <Text style={[styles.priceTableHeaderText, { flex: 1.2 }]}>
                  {isUz ? 'MODEL' : 'МОДЕЛЬ'}
                </Text>
                <Text style={[styles.priceTableHeaderText, { flex: 1 }]}>
                  {isUz ? 'KATEGORIYA' : 'КАТЕГОРИЯ'}
                </Text>
                <Text style={[styles.priceTableHeaderText, { flex: 0.8, textAlign: 'right' as const }]}>
                  {isUz ? 'NARX ($)' : 'ЦЕНА ($)'}
                </Text>
                <Text style={[styles.priceTableHeaderText, { flex: 0.8, textAlign: 'right' as const }]}>
                  {isUz ? 'ESKI NARX' : 'СТАРАЯ ЦЕНА'}
                </Text>
                <Text style={[styles.priceTableHeaderText, { flex: 0.6, textAlign: 'center' as const }]}>
                  {isUz ? 'HARAKAT' : 'ДЕЙСТВИЕ'}
                </Text>
              </View>

              {filteredProducts.map((product) => {
                const isEditing = editingProductId === product.id;
                const catLabel = categories.find((c) => c.id === product.category)?.[isUz ? 'uz' : 'ru'] ?? product.category;

                return (
                  <View key={product.id} style={styles.priceRow}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.priceModelText}>{product.modelNumber}</Text>
                      <Text style={styles.priceVariantText}>{product.variantNumber}</Text>
                    </View>
                    <Text style={[styles.priceCatText, { flex: 1 }]}>{catLabel}</Text>

                    {isEditing ? (
                      <>
                        <View style={{ flex: 0.8 }}>
                          <TextInput
                            value={editPrice}
                            onChangeText={setEditPrice}
                            style={styles.priceEditInput}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#CCC"
                            testID={`edit-price-${product.id}`}
                          />
                        </View>
                        <View style={{ flex: 0.8 }}>
                          <TextInput
                            value={editOldPrice}
                            onChangeText={setEditOldPrice}
                            style={styles.priceEditInput}
                            keyboardType="decimal-pad"
                            placeholder="—"
                            placeholderTextColor="#CCC"
                            testID={`edit-old-price-${product.id}`}
                          />
                        </View>
                        <View style={[styles.priceActionRow, { flex: 0.6 }]}>
                          <Pressable
                            onPress={() => handleSavePrice(product.id)}
                            style={styles.priceActionSave}
                            testID={`save-price-${product.id}`}
                          >
                            <Check size={12} color="#FFF" strokeWidth={2} />
                          </Pressable>
                          <Pressable
                            onPress={handleCancelEditPrice}
                            style={styles.priceActionCancel}
                          >
                            <X size={12} color="#999" strokeWidth={2} />
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.priceValueText, { flex: 0.8, textAlign: 'right' as const }]}>
                          {product.price !== null ? `$${product.price.toFixed(2)}` : '—'}
                        </Text>
                        <Text style={[styles.priceOldValueText, { flex: 0.8, textAlign: 'right' as const }]}>
                          {product.oldPrice ? `$${product.oldPrice.toFixed(2)}` : '—'}
                        </Text>
                        <View style={{ flex: 0.6, alignItems: 'center' as const }}>
                          <Pressable
                            onPress={() => handleStartEditPrice(product)}
                            style={({ pressed }) => [styles.editPriceBtn, pressed && styles.editPriceBtnPressed]}
                            testID={`edit-btn-${product.id}`}
                          >
                            <Text style={styles.editPriceBtnText}>
                              {isUz ? 'Tahrirlash' : 'Изменить'}
                            </Text>
                          </Pressable>
                        </View>
                      </>
                    )}
                  </View>
                );
              })}

              {filteredProducts.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {isUz ? 'Mahsulot topilmadi' : 'Продукты не найдены'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {isWeb && <GlobalFooter />}
      </ScrollView>

      {/* PRODUCT FORM MODAL */}
      <Modal
        visible={productFormOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProductFormOpen(false)}
      >
        <Pressable style={styles.selectBackdrop} onPress={() => setProductFormOpen(false)}>
          <Pressable style={styles.productSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.selectSheetHeader}>
              <Text style={styles.selectSheetTitle}>
                {productForm.id
                  ? (isUz ? 'MAHSULOTNI TAHRIRLASH' : 'РЕДАКТИРОВАТЬ ТОВАР')
                  : (isUz ? "YANGI MAHSULOT" : 'НОВЫЙ ТОВАР')}
              </Text>
              <Pressable onPress={() => setProductFormOpen(false)} style={styles.selectSheetClose}>
                <X size={16} color="#666" strokeWidth={1.5} />
              </Pressable>
            </View>

            <ScrollView style={styles.productSheetScroll} contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
              {/* PARENT / MODEL SECTION */}
              <View style={styles.formGroup}>
                <View style={styles.formGroupHeader}>
                  <View style={styles.formGroupDot} />
                  <Text style={styles.formGroupTitle}>
                    {isUz ? "UMUMIY MA'LUMOTLAR" : 'ОБЩАЯ ИНФОРМАЦИЯ'}
                  </Text>
                  <View style={styles.formGroupLine} />
                </View>
                <Text style={styles.formGroupSubtitle}>
                  {isUz ? 'Model va kategoriya — barcha variantlarda bir xil' : 'Модель и категория — одинаковы для всех вариантов'}
                </Text>

                {modelLocked && (
                  <View style={styles.modelMatchBanner} testID="model-match-banner">
                    <CheckCircle2 size={13} color="#0A7A3B" strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modelMatchTitle}>
                        {isUz ? 'Mavjud modelga variant qo‘shilmoqda' : 'Добавление варианта к существующей модели'}
                      </Text>
                      <Text style={styles.modelMatchSub} numberOfLines={1}>
                        {modelMatch?.modelNumber}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.productFormRow}>
                  <View style={styles.productFormColSmall}>
                    <Text style={styles.heroFieldLabel}>{isUz ? 'Model kodi' : 'Код модели'}</Text>
                    <TextInput
                      value={productForm.modelCode}
                      onChangeText={(v) => handleProductFormField('modelCode', v)}
                      style={styles.designTextInput}
                      placeholder="xj3044"
                      placeholderTextColor="#CCC"
                      autoCapitalize="none"
                      testID="product-model-code"
                    />
                  </View>
                  <View style={styles.productFormColLarge}>
                    <View style={styles.labelRow}>
                      <Text style={styles.heroFieldLabel}>{isUz ? 'Nomi' : 'Название'}</Text>
                      {modelLocked && <Lock size={10} color="#999" strokeWidth={2} />}
                    </View>
                    <TextInput
                      value={productForm.modelName}
                      onChangeText={(v) => handleProductFormField('modelName', v)}
                      style={[styles.designTextInput, modelLocked && styles.inputLocked]}
                      placeholder={isUz ? 'xalat katta tugma' : 'халат большая пуговица'}
                      placeholderTextColor="#CCC"
                      editable={!modelLocked}
                      testID="product-model-name"
                    />
                  </View>
                </View>

                <View style={styles.labelRow}>
                  <Text style={styles.heroFieldLabel}>{isUz ? 'Kategoriya' : 'Категория'}</Text>
                  {modelLocked && <Lock size={10} color="#999" strokeWidth={2} />}
                </View>
                {modelLocked ? (
                  <View style={[styles.selectTrigger, styles.inputLocked]}>
                    <Layers size={14} color="#999" strokeWidth={1.5} />
                    <Text style={[styles.selectTriggerText, { color: '#888' }]} numberOfLines={1}>
                      {(() => {
                        const cat = categories.find((c) => c.id === productForm.category);
                        return cat ? (isUz ? cat.uz : cat.ru) : productForm.category;
                      })()}
                    </Text>
                    <Lock size={12} color="#BBB" strokeWidth={1.5} />
                  </View>
                ) : (
                  <CategorySelect
                    value={productForm.category}
                    onChange={(id) => handleProductFormField('category', id)}
                    categories={categories}
                    onAddCategory={handleAddCategory}
                    isUz={isUz}
                    testID="product-category"
                  />
                )}

                <View style={[styles.labelRow, { marginTop: 14 }]}>
                  <Text style={styles.heroFieldLabel}>{isUz ? "Bo‘lim" : 'Отдел'}</Text>
                  {modelLocked && <Lock size={10} color="#999" strokeWidth={2} />}
                </View>
                <View style={styles.chipRow}>
                  {DEPT_OPTIONS.map((d) => {
                    const active = productForm.targetAudience === d.key;
                    return (
                      <Pressable
                        key={d.key}
                        onPress={() => {
                          if (modelLocked) return;
                          Haptics.selectionAsync();
                          handleProductFormField('targetAudience', d.key);
                        }}
                        style={[
                          styles.chip,
                          active && styles.chipActive,
                          modelLocked && !active && styles.chipDisabled,
                        ]}
                        testID={`product-dept-${d.key}`}
                      >
                        {active && <Check size={10} color="#FFF" strokeWidth={2} />}
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {isUz ? d.uz : d.ru}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.heroFieldLabel, { marginTop: 14 }]}>{isUz ? "Ta'rifi" : 'Описание'}</Text>
                <TextInput
                  value={productForm.description}
                  onChangeText={(v) => handleProductFormField('description', v)}
                  style={[styles.designTextInput, styles.productTextarea]}
                  placeholder={isUz ? 'Mahsulot haqida qisqacha...' : 'Краткое описание...'}
                  placeholderTextColor="#CCC"
                  multiline
                  numberOfLines={3}
                  testID="product-description"
                />
              </View>

              {/* VARIANT / CHILD SECTION */}
              <View style={[styles.formGroup, styles.formGroupVariant]}>
                <View style={styles.formGroupHeader}>
                  <View style={[styles.formGroupDot, styles.formGroupDotAccent]} />
                  <Text style={styles.formGroupTitle}>
                    {isUz ? "VARIANT MA'LUMOTLARI" : 'ВАРИАНТ'}
                  </Text>
                  <View style={styles.formGroupLine} />
                </View>
                <Text style={styles.formGroupSubtitle}>
                  {isUz ? 'Ushbu variantga xos: rasm, kod, narx' : 'Уникально для варианта: фото, код, цена'}
                </Text>

                <Text style={styles.heroFieldLabel}>{isUz ? 'Variant rasmi' : 'Изображение'}</Text>
                <ImageDropzone
                  value={productForm.image}
                  onChange={(v) => handleProductFormField('image', v)}
                  isUz={isUz}
                  testID="product-image"
                />

                <View style={styles.labelRow}>
                  <Text style={styles.heroFieldLabel}>{isUz ? 'Variant kodi' : 'Код варианта'}</Text>
                  <Text style={styles.labelRequired}>*</Text>
                </View>
                <TextInput
                  value={productForm.variantNumber}
                  onChangeText={(v) => handleProductFormField('variantNumber', v)}
                  style={[
                    styles.designTextInput,
                    variantDuplicate && styles.inputError,
                  ]}
                  placeholder="v-2985"
                  placeholderTextColor="#CCC"
                  autoCapitalize="none"
                  testID="product-variant"
                />
                {variantDuplicate && (
                  <View style={styles.inputErrorRow}>
                    <AlertCircle size={11} color="#C0392B" strokeWidth={2} />
                    <Text style={styles.inputErrorText}>
                      {isUz ? 'Bu variant kodi band. Unikal kod kiriting.' : 'Этот код варианта уже занят. Введите уникальный.'}
                    </Text>
                  </View>
                )}

                <View style={styles.productFormRow}>
                  <View style={styles.productFormCol}>
                    <Text style={styles.heroFieldLabel}>{isUz ? 'Narx ($)' : 'Цена ($)'}</Text>
                    <TextInput
                      value={productForm.price}
                      onChangeText={(v) => handleProductFormField('price', v)}
                      style={styles.designTextInput}
                      placeholder="19.90"
                      placeholderTextColor="#CCC"
                      keyboardType="decimal-pad"
                      testID="product-price"
                    />
                  </View>
                  <View style={styles.productFormCol}>
                    <Text style={styles.heroFieldLabel}>{isUz ? 'Chegirma narx ($)' : 'Скидочная ($)'}</Text>
                    <TextInput
                      value={productForm.oldPrice}
                      onChangeText={(v) => handleProductFormField('oldPrice', v)}
                      style={styles.designTextInput}
                      placeholder="—"
                      placeholderTextColor="#CCC"
                      keyboardType="decimal-pad"
                      testID="product-old-price"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.productToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productToggleLabel}>{isUz ? 'Yangi kelgan' : 'Новинка'}</Text>
                  <Text style={styles.productToggleHint}>{isUz ? "Yangi kelganlar ro‘yxatida ko‘rsatiladi" : 'Показывать в новинках'}</Text>
                </View>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); handleProductFormField('isNew', !productForm.isNew); }}
                  style={[styles.toggleBtn, productForm.isNew && styles.toggleBtnActive]}
                  testID="product-is-new"
                >
                  {productForm.isNew
                    ? <Eye size={14} color="#FFF" strokeWidth={1.5} />
                    : <EyeOff size={14} color="#999" strokeWidth={1.5} />}
                  <Text style={[styles.toggleText, productForm.isNew && styles.toggleTextActive]}>
                    {productForm.isNew ? (isUz ? 'Ha' : 'Да') : (isUz ? "Yo‘q" : 'Нет')}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.productToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productToggleLabel}>{isUz ? 'Faol' : 'Актив'}</Text>
                  <Text style={styles.productToggleHint}>{isUz ? "Katalogda ko‘rinadi" : 'Показывать в каталоге'}</Text>
                </View>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); handleProductFormField('status', productForm.status === 'published' ? 'draft' : 'published'); }}
                  style={[styles.toggleBtn, productForm.status === 'published' && styles.toggleBtnActive]}
                  testID="product-is-active"
                >
                  {productForm.status === 'published'
                    ? <Eye size={14} color="#FFF" strokeWidth={1.5} />
                    : <EyeOff size={14} color="#999" strokeWidth={1.5} />}
                  <Text style={[styles.toggleText, productForm.status === 'published' && styles.toggleTextActive]}>
                    {productForm.status === 'published' ? (isUz ? 'Faol' : 'Актив') : (isUz ? 'Qoralama' : 'Черновик')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.productSheetFooter}>
              {productForm.id && (
                <Pressable
                  onPress={() => {
                    const p = products.find((x) => x.id === productForm.id);
                    if (p) {
                      setProductFormOpen(false);
                      setTimeout(() => handleDeleteProduct(p), 80);
                    }
                  }}
                  style={styles.productSheetDeleteBtn}
                  testID="product-modal-delete"
                >
                  <Trash2 size={13} color="#B00" strokeWidth={1.5} />
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => setProductFormOpen(false)}
                style={styles.productSheetCancelBtn}
                testID="product-modal-cancel"
              >
                <Text style={styles.productSheetCancelText}>
                  {isUz ? 'Bekor qilish' : 'Отмена'}
                </Text>
              </Pressable>
              {!productForm.id && (
                <Pressable
                  onPress={handleSaveAndNewVariant}
                  style={styles.productSheetSaveGhostBtn}
                  testID="product-modal-save-variant"
                >
                  <Plus size={13} color="#000" strokeWidth={1.5} />
                  <Text style={styles.productSheetSaveGhostText}>
                    {isUz ? '+ Variant' : '+ Вариант'}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleSaveProduct}
                style={styles.productSheetSaveBtn}
                testID="product-modal-save"
              >
                <Save size={13} color="#FFF" strokeWidth={1.5} />
                <Text style={styles.productSheetSaveText}>
                  {isUz ? 'Saqlash' : 'Сохранить'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    flex: 1,
  },
  containerDesktop: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 60,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  backText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 13,
    color: '#AAA',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: '#000',
    letterSpacing: 6,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  logoutBtnPressed: {
    backgroundColor: '#F5F5F5',
  },
  titleUnderline: {
    width: 40,
    height: 2,
    backgroundColor: '#000',
    marginTop: 12,
    marginBottom: 28,
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    marginBottom: 24,
    gap: 0,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#AAA',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600' as const,
  },
  tabContent: {
    flex: 1,
  },
  heroDeptTabs: {
    flexDirection: 'row' as const,
    gap: 6,
    marginTop: 14,
    marginBottom: 16,
    flexWrap: 'wrap' as const,
  },
  heroDeptTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  heroDeptTabActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  heroDeptTabText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#888',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  heroDeptTabTextActive: {
    color: '#FFF',
  },
  heroEditorWrap: {
    gap: 4,
  },
  heroPreview: {
    marginBottom: 12,
  },
  heroPreviewImageWrap: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAEAEA',
  },
  heroPreviewUrlHint: {
    fontSize: 11,
    color: '#888',
    letterSpacing: 0.2,
  },
  heroFieldLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#AAA',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  heroHint: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  dropzoneWrap: {
    marginBottom: 4,
  },
  dropzone: {
    borderWidth: 1.5,
    borderColor: '#DADADA',
    borderStyle: 'dashed' as const,
    backgroundColor: '#FAFAFA',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  dropzoneDragOver: {
    borderColor: '#000',
    backgroundColor: '#F0F0F0',
  },
  dropzoneIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  dropzoneTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#333',
    letterSpacing: 0.2,
    textAlign: 'center' as const,
  },
  dropzoneHint: {
    fontSize: 11,
    color: '#AAA',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
  },
  dropzonePreviewWrap: {
    position: 'relative' as const,
    backgroundColor: '#F5F5F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
    overflow: 'hidden' as const,
  },
  dropzonePreviewImg: {
    width: '100%' as const,
    height: 200,
  },
  dropzoneActions: {
    position: 'absolute' as const,
    bottom: 10,
    right: 10,
    flexDirection: 'row' as const,
    gap: 6,
  },
  dropzoneActionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#000',
  },
  dropzoneActionBtnGhost: {
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
  },
  dropzoneActionText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  selectTrigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectTriggerText: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  selectBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  selectSheet: {
    width: '100%' as const,
    maxWidth: 480,
    maxHeight: '80%' as const,
    backgroundColor: '#FFF',
    overflow: 'hidden' as const,
  },
  selectSheetHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  selectSheetTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#000',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  selectSheetClose: {
    width: 28,
    height: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectSheetScroll: {
    maxHeight: 500,
  },
  selectGroup: {
    paddingBottom: 8,
  },
  selectGroupTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#AAA',
    letterSpacing: 2,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  selectOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  selectOptionActive: {
    backgroundColor: '#F5F5F5',
  },
  selectOptionText: {
    fontSize: 13,
    color: '#333',
    letterSpacing: 0.2,
  },
  selectOptionTextActive: {
    color: '#000',
    fontWeight: '600' as const,
  },

  statsGrid: {
    gap: 10,
    marginBottom: 28,
  },
  statsGridDesktop: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 0,
    padding: 20,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E8E8',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '300' as const,
    color: '#000',
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  quickActionsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#AAA',
    letterSpacing: 2.5,
    marginBottom: 14,
  },
  quickActionsGrid: {
    gap: 8,
  },
  quickAction: {
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E8E8',
    padding: 18,
    gap: 6,
  },
  quickActionPressed: {
    backgroundColor: '#F8F8F8',
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000',
    letterSpacing: 0.3,
  },
  quickActionDesc: {
    fontSize: 12,
    color: '#AAA',
    letterSpacing: 0.2,
  },

  showroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  showroomSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  showroomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetBtn: {
    width: 34,
    height: 34,
    borderRadius: 0,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#000',
  },
  saveBtnDisabled: {
    backgroundColor: '#E8E8E8',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFF',
    letterSpacing: 0.8,
  },
  saveBtnTextDisabled: {
    color: '#999',
  },

  configSection: {
    marginBottom: 22,
  },
  configSectionTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#BBB',
    letterSpacing: 2,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  configCard: {
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
    marginBottom: 6,
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
    gap: 2,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  configCurrent: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#AAA',
    letterSpacing: 0.3,
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
    color: '#BBB',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  chipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
  },

  searchRow: {
    marginBottom: 16,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    letterSpacing: 0.3,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  searchClear: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 0,
  },
  priceTableHeaderText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#999',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  priceModelText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  priceVariantText: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  priceCatText: {
    fontSize: 12,
    color: '#777',
    letterSpacing: 0.3,
  },
  priceValueText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000',
    letterSpacing: 0.3,
  },
  priceOldValueText: {
    fontSize: 12,
    color: '#BBB',
    textDecorationLine: 'line-through',
    letterSpacing: 0.3,
  },
  priceEditInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    fontSize: 13,
    color: '#000',
    paddingVertical: 4,
    paddingHorizontal: 6,
    textAlign: 'right' as const,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  priceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  priceActionSave: {
    width: 26,
    height: 26,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceActionCancel: {
    width: 26,
    height: 26,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPriceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD',
  },
  editPriceBtnPressed: {
    backgroundColor: '#F5F5F5',
  },
  editPriceBtnText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#666',
    letterSpacing: 0.5,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#BBB',
    letterSpacing: 0.5,
  },

  designSection: {
    backgroundColor: '#FFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
    padding: 18,
    marginBottom: 14,
  },
  designSectionTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#BBB',
    letterSpacing: 2,
    marginBottom: 14,
  },
  designRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
  },
  designLabel: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#333',
    letterSpacing: 0.2,
  },
  designValueLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#000',
    letterSpacing: 0.5,
    minWidth: 44,
    textAlign: 'right' as const,
  },
  designTextInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: 13,
    color: '#000',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 10,
    letterSpacing: 0.3,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleBtnActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#999',
    letterSpacing: 0.5,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  sliderBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  sliderFill: {
    height: 4,
    backgroundColor: '#1A1A1A',
  },
  alignmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  alignBtn: {
    width: 44,
    height: 36,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  alignBtnActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  colorPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: '#000',
  },
  colorSwatchTransparent: {
    backgroundColor: '#FFFFFF',
  },
  colorSwatchTransparentLine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 0,
  },
  colorHexInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: 12,
    color: '#000',
    paddingVertical: 4,
    paddingHorizontal: 4,
    width: 80,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  colorSwatchCheck: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginTop: 8,
  },
  previewBanner: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  previewBannerText: {
    fontSize: 8,
    fontWeight: '500' as const,
    letterSpacing: 1.5,
  },
  previewHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  previewLogo: {
    fontSize: 12,
    fontWeight: '300' as const,
    letterSpacing: 3,
  },
  previewHero: {
    height: 120,
    backgroundColor: '#8B7D6B',
    position: 'relative' as const,
    justifyContent: 'flex-end',
  },
  previewHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  previewHeroText: {
    padding: 12,
  },
  previewHeroTextCenter: {
    alignItems: 'center' as const,
  },
  previewHeroTextRight: {
    alignItems: 'flex-end' as const,
  },
  previewHeroTitle: {
    fontSize: 14,
    fontWeight: '200' as const,
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 8,
  },
  previewCTA: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  previewCTAText: {
    fontSize: 8,
    fontWeight: '400' as const,
    letterSpacing: 1.5,
  },
  previewFooter: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewFooterText: {
    fontSize: 9,
    fontWeight: '400' as const,
    letterSpacing: 1,
  },

  primaryActionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#000',
  },
  primaryActionBtnPressed: {
    backgroundColor: '#222',
  },
  primaryActionText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 1.5,
  },
  productsTableHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    gap: 10,
  },
  productsHeaderText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#999',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  productsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
    gap: 10,
  },
  productsRowPressed: {
    backgroundColor: '#FAFAFA',
  },
  productsThumb: {
    width: 42,
    height: 54,
    backgroundColor: '#F2F2F2',
  },
  productsNewDot: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },
  productsRowTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  productsRowSub: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  productsRowText: {
    fontSize: 12,
    color: '#555',
    letterSpacing: 0.2,
  },
  productsRowPrice: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#000',
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillLive: {
    backgroundColor: '#000',
  },
  statusPillDraft: {
    backgroundColor: '#F0F0F0',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  statusPillTextLive: {
    color: '#FFF',
  },
  statusPillTextDraft: {
    color: '#888',
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  productSheet: {
    width: '100%' as const,
    maxWidth: 560,
    maxHeight: '92%' as const,
    backgroundColor: '#FFF',
    overflow: 'hidden' as const,
  },
  productSheetScroll: {
    maxHeight: 560,
  },
  productTextarea: {
    minHeight: 60,
    textAlignVertical: 'top' as const,
    paddingTop: 8,
  },
  productFormRow: {
    flexDirection: 'row' as const,
    gap: 14,
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 6,
  },
  labelRequired: {
    fontSize: 11,
    color: '#C0392B',
    fontWeight: '700' as const,
  },
  inputLocked: {
    backgroundColor: '#F6F6F6',
    color: '#888',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  inputError: {
    borderColor: '#C0392B',
  },
  inputErrorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 6,
  },
  inputErrorText: {
    fontSize: 11,
    color: '#C0392B',
    letterSpacing: 0.2,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  modelMatchBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: '#EDF7EE',
    borderLeftWidth: 3,
    borderLeftColor: '#0A7A3B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  modelMatchTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#0A7A3B',
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  modelMatchSub: {
    fontSize: 12,
    color: '#1A1A1A',
    marginTop: 2,
  },
  productFormCol: {
    flex: 1,
  },
  productToggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    marginTop: 6,
    gap: 14,
  },
  productToggleLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  productToggleHint: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  productSheetFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEE',
  },
  productSheetDeleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F3D0D0',
    backgroundColor: '#FFF7F7',
  },
  productSheetCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F4F4F4',
  },
  productSheetCancelText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    letterSpacing: 0.5,
  },
  productSheetSaveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#000',
  },
  productSheetSaveText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFF',
    letterSpacing: 1,
  },
  productSheetSaveGhostBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
  },
  productSheetSaveGhostText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#000',
    letterSpacing: 1,
  },
  productFormColSmall: {
    flex: 0.8,
  },
  productFormColLarge: {
    flex: 1.6,
  },
  formGroup: {
    marginBottom: 8,
    paddingBottom: 14,
  },
  formGroupVariant: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    paddingTop: 18,
    marginTop: 14,
  },
  formGroupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  formGroupDot: {
    width: 6,
    height: 6,
    backgroundColor: '#1A1A1A',
  },
  formGroupDotAccent: {
    backgroundColor: '#B89268',
  },
  formGroupTitle: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  formGroupLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
  },
  formGroupSubtitle: {
    fontSize: 11,
    color: '#AAA',
    letterSpacing: 0.2,
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  catSearchWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  catSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  catOptionSub: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  catEmpty: {
    paddingVertical: 24,
    alignItems: 'center' as const,
  },
  catEmptyText: {
    fontSize: 12,
    color: '#BBB',
    letterSpacing: 0.3,
  },
  catAddRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  catAddIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  catAddText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#000',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  catCreator: {
    padding: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    gap: 2,
  },
  catCreatorTitle: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#000',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  catCreatorActions: {
    flexDirection: 'row' as const,
    gap: 8,
    justifyContent: 'flex-end' as const,
    marginTop: 4,
  },
});
