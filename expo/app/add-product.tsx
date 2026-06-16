import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, Upload, ImagePlus, Lock, Sparkles, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { BREAKPOINTS } from '@/hooks/useResponsive';

const DESKTOP_BREAKPOINT = BREAKPOINTS.mobile;

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useAuth();
  const { addProduct, updateProduct, getProductById, products } = useProducts();
  const { categories } = useCategories();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  const isEditing = !!editId;
  const existingProduct = editId ? getProductById(editId) : null;

  const [imageUri, setImageUri] = useState<string | null>(existingProduct?.image ?? null);
  const [secondaryImageUri, setSecondaryImageUri] = useState<string | null>(existingProduct?.secondaryImage ?? null);
  const [modelNumber, setModelNumber] = useState(existingProduct?.modelNumber ?? '');
  const [variantNumber, setVariantNumber] = useState(existingProduct?.variantNumber ?? '');
  const [selectedCategory, setSelectedCategory] = useState(existingProduct?.category ?? '');

  const existingModel = useMemo(() => {
    const code = modelNumber.trim().toLowerCase();
    if (!code) return null;
    const match = products.find(
      (p) => p.modelNumber.trim().toLowerCase() === code && (!editId || p.id !== editId),
    );
    return match ?? null;
  }, [products, modelNumber, editId]);

  const isNewModel = !existingModel;
  const isParentLocked = !!existingModel && !isEditing;

  useEffect(() => {
    if (existingModel && !isEditing) {
      setSelectedCategory(existingModel.category);
      console.log('[AddProduct] Inherited parent model data from:', existingModel.modelNumber);
    }
  }, [existingModel, isEditing]);
  const [isTrending, setIsTrending] = useState(existingProduct?.isTrending ?? false);
  const [isNew, setIsNew] = useState(existingProduct?.isNew ?? false);
  const [visibility, setVisibility] = useState<'all' | 'vip'>(existingProduct?.visibility ?? 'all');
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<View>(null);

  const [pasteTarget, setPasteTarget] = useState<'primary' | 'secondary'>('primary');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handlePaste = (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (pasteTarget === 'secondary') {
                setSecondaryImageUri(dataUrl);
                console.log('[AddProduct] Secondary image pasted from clipboard');
              } else {
                setImageUri(dataUrl);
                console.log('[AddProduct] Primary image pasted from clipboard');
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [pasteTarget]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !dropRef.current) return;
    const element = dropRef.current as unknown as HTMLElement;
    if (!element?.addEventListener) return;
    const handleDragOver = (e: Event) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => { setIsDragging(false); };
    const handleDrop = (e: Event) => {
      e.preventDefault(); setIsDragging(false);
      const dragEvent = e as DragEvent;
      const file = dragEvent.dataTransfer?.files?.[0];
      if (file?.type?.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => { setImageUri(event.target?.result as string); console.log('[AddProduct] Image dropped'); };
        reader.readAsDataURL(file);
      }
    };
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
    };
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      console.log('[AddProduct] Primary image picked from gallery');
    }
  }, []);

  const pickSecondaryImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSecondaryImageUri(result.assets[0].uri);
      console.log('[AddProduct] Secondary image picked from gallery');
    }
  }, []);

  const removeSecondaryImage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecondaryImageUri(null);
    console.log('[AddProduct] Secondary image removed');
  }, []);

  const handleSave = useCallback(() => {
    if (!imageUri) { Alert.alert(t('chooseImage')); return; }
    if (!modelNumber.trim()) { Alert.alert(t('modelNumber')); return; }
    if (!variantNumber.trim()) { Alert.alert(t('variantNumber')); return; }
    if (!selectedCategory) { Alert.alert(t('selectCategory')); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEditing && editId) {
      updateProduct(editId, {
        modelNumber: modelNumber.trim(), variantNumber: variantNumber.trim(),
        category: selectedCategory, image: imageUri,
        secondaryImage: secondaryImageUri ?? undefined,
        isTrending, isNew, visibility,
      });
      console.log('[AddProduct] Updated product:', editId);
    } else {
      addProduct({
        modelNumber: modelNumber.trim(), variantNumber: variantNumber.trim(),
        category: selectedCategory, image: imageUri,
        secondaryImage: secondaryImageUri ?? undefined,
        price: null, status: 'draft',
        isTrending, isNew, visibility, createdBy: 'accountant',
      });
    }
    router.back();
  }, [imageUri, secondaryImageUri, modelNumber, variantNumber, selectedCategory, isTrending, isNew, visibility, addProduct, updateProduct, isEditing, editId, router, t]);

  const renderImageSection = () => (
    <View style={isDesktop ? styles.desktopImageColumn : undefined}>
      <Text style={styles.imageSlotLabel}>{t('primaryImage')}</Text>
      <Text style={styles.imageSlotHint}>{t('primaryImageHint')}</Text>
      <Pressable
        onPress={pickImage}
        onFocus={() => setPasteTarget('primary')}
        onHoverIn={() => setPasteTarget('primary')}
        style={[styles.imageUpload, isDesktop && styles.desktopImageUpload, isDragging && styles.imageUploadDrag]}
        ref={dropRef}
        testID="image-upload"
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="contain" />
        ) : (
          <View style={styles.uploadPlaceholder}>
            {Platform.OS === 'web' ? <Upload size={28} color={Colors.textTertiary} /> : <Camera size={28} color={Colors.textTertiary} />}
            <Text style={styles.uploadText}>{t('uploadImage')}</Text>
            {Platform.OS === 'web' && <Text style={styles.uploadHint}>{t('pasteHint')}</Text>}
          </View>
        )}
      </Pressable>
      {imageUri && (
        <Pressable onPress={pickImage} style={styles.changeImageBtn} testID="change-image-btn">
          <ImagePlus size={16} color={Colors.white} />
          <Text style={styles.changeImageText}>{t('changeImage')}</Text>
        </Pressable>
      )}

      <View style={styles.secondarySlotDivider} />
      <Text style={styles.imageSlotLabel}>{t('secondaryImage')}</Text>
      <Text style={styles.imageSlotHint}>{t('secondaryImageHint')}</Text>
      <Pressable
        onPress={pickSecondaryImage}
        onFocus={() => setPasteTarget('secondary')}
        onHoverIn={() => setPasteTarget('secondary')}
        style={[styles.imageUpload, styles.secondaryImageUpload, isDesktop && styles.desktopImageUpload]}
        testID="secondary-image-upload"
      >
        {secondaryImageUri ? (
          <Image source={{ uri: secondaryImageUri }} style={styles.previewImage} contentFit="contain" />
        ) : (
          <View style={styles.uploadPlaceholder}>
            {Platform.OS === 'web' ? <Upload size={24} color={Colors.textTertiary} /> : <Camera size={24} color={Colors.textTertiary} />}
            <Text style={styles.uploadText}>{t('uploadImage')}</Text>
            {Platform.OS === 'web' && <Text style={styles.uploadHint}>{t('pasteHint')}</Text>}
          </View>
        )}
      </Pressable>
      {secondaryImageUri && (
        <View style={styles.secondaryActionRow}>
          <Pressable onPress={pickSecondaryImage} style={[styles.changeImageBtn, styles.secondaryActionBtn]} testID="change-secondary-btn">
            <ImagePlus size={16} color={Colors.white} />
            <Text style={styles.changeImageText}>{t('changeImage')}</Text>
          </Pressable>
          <Pressable onPress={removeSecondaryImage} style={styles.removeImageBtn} testID="remove-secondary-btn">
            <Trash2 size={16} color={Colors.text} />
            <Text style={styles.removeImageText}>{t('removeImage')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderFields = () => (
    <View style={isDesktop ? styles.desktopFieldsColumn : undefined}>
      <View style={styles.parentGroup}>
        <View style={styles.parentGroupHeader}>
          <Text style={styles.parentGroupTitle}>{language === 'uz' ? "UMUMIY MA'LUMOTLAR" : 'ОБЩАЯ ИНФОРМАЦИЯ'}</Text>
          {modelNumber.trim().length > 0 && (
            <View style={[styles.modelStatusBadge, isParentLocked ? styles.modelStatusLocked : styles.modelStatusNew]}>
              {isParentLocked ? <Lock size={10} color={Colors.white} /> : <Sparkles size={10} color={Colors.white} />}
              <Text style={styles.modelStatusText}>
                {isParentLocked
                  ? (language === 'uz' ? 'Mavjud model' : 'Существующая')
                  : (language === 'uz' ? 'Yangi model' : 'Новая')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t('modelNumber')}</Text>
          <TextInput style={[styles.input, isDesktop && styles.desktopInput]} value={modelNumber} onChangeText={setModelNumber} placeholder="TX-XXX" placeholderTextColor={Colors.textTertiary} testID="model-input" />
          {isParentLocked && (
            <Text style={styles.inheritHint}>
              {language === 'uz'
                ? 'Mavjud modelga yangi variant qo\'shilmoqda. Kategoriya avtomatik yuklandi.'
                : 'Добавляется новый вариант к существующей модели. Категория унаследована.'}
            </Text>
          )}
        </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t('variantNumber')}</Text>
        <TextInput style={[styles.input, isDesktop && styles.desktopInput]} value={variantNumber} onChangeText={setVariantNumber} placeholder="A-WHT" placeholderTextColor={Colors.textTertiary} testID="variant-input" />
      </View>
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('category')}</Text>
            {isParentLocked && <Lock size={11} color={Colors.textTertiary} />}
          </View>
          <View style={[styles.categoryGrid, isParentLocked && styles.disabledGrid]} pointerEvents={isParentLocked ? 'none' : 'auto'}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                    isParentLocked && !isActive && styles.categoryChipHidden,
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      if (isParentLocked) return;
                      Haptics.selectionAsync();
                      setSelectedCategory(cat.id);
                    }}
                    style={styles.categoryChipInner}
                  >
                    <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>{cat[language]}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.variantGroupLabel}>
        <View style={styles.variantDivider} />
        <Text style={styles.variantGroupLabelText}>{language === 'uz' ? "VARIANT MA'LUMOTLARI" : 'ИНФОРМАЦИЯ О ВАРИАНТЕ'}</Text>
        <View style={styles.variantDivider} />
      </View>
      <View style={styles.trendingField}>
        <Text style={styles.trendingLabel}>{t('trendingToggle')}</Text>
        <Switch
          value={isTrending}
          onValueChange={(val) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsTrending(val); }}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      </View>
      <View style={styles.trendingField}>
        <Text style={styles.trendingLabel}>{t('newProductToggle')}</Text>
        <Switch
          value={isNew}
          onValueChange={(val) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsNew(val); }}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.white}
          testID="is-new-switch"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t('productVisibility')}</Text>
        <View style={styles.visibilityRow}>
          <Pressable onPress={() => { Haptics.selectionAsync(); setVisibility('all'); }} style={[styles.visibilityChip, visibility === 'all' && styles.visibilityChipActive]}>
            <Text style={[styles.visibilityChipText, visibility === 'all' && styles.visibilityChipTextActive]}>{t('visibilityAll')}</Text>
          </Pressable>
          <Pressable onPress={() => { Haptics.selectionAsync(); setVisibility('vip'); }} style={[styles.visibilityChip, visibility === 'vip' && styles.visibilityChipActive]}>
            <Text style={[styles.visibilityChipText, visibility === 'vip' && styles.visibilityChipTextActive]}>{t('visibilityVip')}</Text>
          </Pressable>
        </View>
      </View>
      {isDesktop && (
        <View style={styles.desktopButtonRow}>
          <Pressable onPress={() => router.back()} style={styles.cancelBtnDesktop}>
            <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={styles.saveBtnDesktop} testID="save-product-desktop">
            <Text style={styles.saveBtnDesktopText}>{isEditing ? t('update') : t('save')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>{isEditing ? t('editProduct') : t('addProduct')}</Text>
        {!isDesktop ? (
          <Pressable onPress={handleSave} style={styles.saveBtn} testID="save-product">
            <Text style={styles.saveBtnText}>{isEditing ? t('update') : t('save')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>
      <ScrollView
        contentContainerStyle={[styles.form, isDesktop && styles.desktopForm]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isDesktop ? (
          <View style={styles.desktopSplitContainer}>
            {renderImageSection()}
            {renderFields()}
          </View>
        ) : (
          <>
            {renderImageSection()}
            {renderFields()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  closeBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.white },
  form: { padding: 16, gap: 16, paddingBottom: 30 },
  desktopForm: { paddingHorizontal: 32, paddingVertical: 24, maxWidth: 900, alignSelf: 'center', width: '100%' },
  desktopSplitContainer: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  desktopImageColumn: { width: '40%', flexShrink: 0 },
  desktopFieldsColumn: { flex: 1, gap: 16, maxWidth: 480 },
  imageSlotLabel: { fontSize: 11, fontWeight: '700' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  imageSlotHint: { fontSize: 11, color: Colors.textTertiary, marginBottom: 8 },
  secondarySlotDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 18 },
  secondaryImageUpload: { borderColor: Colors.borderLight },
  secondaryActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondaryActionBtn: { flex: 1, marginTop: 0 },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  removeImageText: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  imageUpload: { aspectRatio: 1, maxHeight: 260, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', overflow: 'hidden', backgroundColor: Colors.background },
  desktopImageUpload: { maxHeight: 340, width: '100%', borderRadius: 10 },
  imageUploadDrag: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  previewImage: { width: '100%', height: '100%' },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadText: { fontSize: 14, fontWeight: '500' as const, color: Colors.textSecondary },
  uploadHint: { fontSize: 11, color: Colors.textTertiary },
  changeImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  changeImageText: { fontSize: 13, fontWeight: '600' as const, color: Colors.white },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: Colors.text, backgroundColor: Colors.background },
  desktopInput: { maxWidth: 400 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  categoryChipTextActive: { color: Colors.white, fontWeight: '600' as const },
  trendingField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, padding: 14, borderRadius: 10 },
  trendingLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  visibilityRow: { flexDirection: 'row', gap: 8 },
  visibilityChip: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  visibilityChipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  visibilityChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  visibilityChipTextActive: { color: Colors.white, fontWeight: '600' as const },
  desktopButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelBtnDesktop: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.background },
  cancelBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  saveBtnDesktop: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.primary },
  saveBtnDesktopText: { fontSize: 13, fontWeight: '600' as const, color: Colors.white },
  parentGroup: { gap: 14, padding: 14, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.borderLight },
  parentGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  parentGroupTitle: { fontSize: 10, fontWeight: '700' as const, color: Colors.textSecondary, letterSpacing: 1 },
  modelStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modelStatusLocked: { backgroundColor: Colors.text },
  modelStatusNew: { backgroundColor: Colors.primary },
  modelStatusText: { fontSize: 9, fontWeight: '700' as const, color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inheritHint: { fontSize: 11, color: Colors.textTertiary, fontStyle: 'italic', marginTop: 2 },
  disabledGrid: { opacity: 0.75 },
  categoryChipInner: { paddingHorizontal: 14, paddingVertical: 8 },
  categoryChipHidden: { opacity: 0.4 },
  variantGroupLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: -4 },
  variantDivider: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  variantGroupLabelText: { fontSize: 10, fontWeight: '700' as const, color: Colors.textSecondary, letterSpacing: 1 },
});
