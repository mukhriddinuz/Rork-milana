import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  RotateCcw,
  Package,
  Check,
  Plus as PlusIcon,
  Minus as MinusIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import WebHeader, { TOTAL_HEADER_HEIGHT } from '@/components/WebHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import { useLightbox } from '@/contexts/LightboxContext';

const MOCK_COLORS = [
  { id: 'wht', name: 'Oq', nameRu: 'Белый', hex: '#F5F5F0' },
  { id: 'blk', name: 'Qora', nameRu: 'Чёрный', hex: '#1A1A1A' },
  { id: 'nvy', name: 'Ko\'k', nameRu: 'Синий', hex: '#223C63' },
  { id: 'pnk', name: 'Pushti', nameRu: 'Розовый', hex: '#E8B4B8' },
];

const MOCK_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const MOCK_GALLERY = [
  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=1000&fit=crop',
];

type AccordionKey = 'description' | 'properties' | 'delivery';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { getProductById } = useProducts();
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { categories } = useCategories();
  const { t, language } = useAuth();
  const { search, setSearch } = useWebHeader();
  const { open: openLightbox } = useLightbox();

  const product = getProductById(id ?? '');
  const quantity = getQuantity(id ?? '');
  const favorite = isFavorite(id ?? '');

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(MOCK_COLORS[0].id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<AccordionKey, boolean>>({
    description: true,
    properties: false,
    delivery: false,
  });

  const toggleSection = useCallback((key: AccordionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    void Haptics.selectionAsync();
  }, []);

  const addBtnScale = useRef(new Animated.Value(1)).current;

  const isWide = width >= 768;
  const isDesktop = width >= 1024;

  const galleryImages = useMemo(() => {
    if (!product) return MOCK_GALLERY;
    return [product.image, ...MOCK_GALLERY.slice(1)];
  }, [product]);

  const categoryName = useMemo(() => {
    if (!product) return '';
    return categories.find((c) => c.id === product.category)?.[language] ?? product.category;
  }, [product, categories, language]);

  const selectedColorObj = MOCK_COLORS.find((c) => c.id === selectedColor);

  const handleAdd = useCallback(() => {
    if (!id) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(addBtnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(addBtnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    addToCart(id);
    console.log('[ProductDetail] Added to cart:', id);
  }, [id, addToCart, addBtnScale]);

  const handleRemove = useCallback(() => {
    if (!id) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFromCart(id);
    console.log('[ProductDetail] Removed from cart:', id);
  }, [id, removeFromCart]);

  const handleToggleFavorite = useCallback(() => {
    if (!id) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(id);
  }, [id, toggleFavorite]);

  const handleGoToCart = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/cart' as any);
  }, [router]);

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasOldPrice = product.oldPrice != null && product.price != null && product.oldPrice > product.price;
  const priceDisplay = product.price !== null ? `${product.price.toFixed(2)} $` : '—';
  const oldPriceDisplay = hasOldPrice ? `${product.oldPrice!.toFixed(2)} $` : null;
  const discountPercent = hasOldPrice
    ? Math.round(((product.oldPrice! - product.price!) / product.oldPrice!) * 100)
    : 0;

  const renderBreadcrumbs = () => (
    <View style={styles.breadcrumbs}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.breadcrumbLink}>{t('mainPage')}</Text>
      </Pressable>
      <ChevronRight size={12} color="#AAAAAA" />
      <Pressable onPress={() => router.back()}>
        <Text style={styles.breadcrumbLink}>{t('catalog')}</Text>
      </Pressable>
      <ChevronRight size={12} color="#AAAAAA" />
      <Text style={styles.breadcrumbLink}>{categoryName}</Text>
      <ChevronRight size={12} color="#AAAAAA" />
      <Text style={styles.breadcrumbCurrent}>{product.modelNumber}</Text>
    </View>
  );

  const renderImageGallery = () => (
    <View style={[styles.galleryContainer, isWide && styles.galleryContainerWide]}>
      <Pressable
        onPress={() => {
          const src = galleryImages[selectedImage];
          if (src) {
            const hires = src.replace(/w=\d+/, 'w=1800').replace(/h=\d+/, 'h=1800');
            openLightbox(hires);
          }
        }}
        style={styles.mainImageWrap}
        testID="product-detail-main-image-zoom"
        {...(Platform.OS === 'web' ? ({ style: [styles.mainImageWrap, { cursor: 'zoom-in' as any }] } as any) : {})}
      >
        <Image
          source={{ uri: galleryImages[selectedImage] }}
          style={styles.mainImage}
          contentFit="cover"
          transition={200}
          testID="product-detail-main-image"
        />
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
          </View>
        )}
        {product.isTrending && (
          <View style={styles.trendBadge}>
            <Text style={styles.trendBadgeText}>TREND</Text>
          </View>
        )}
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailRow}
        contentContainerStyle={styles.thumbnailContent}
      >
        {galleryImages.map((img, idx) => (
          <Pressable
            key={idx}
            onPress={() => setSelectedImage(idx)}
            style={[
              styles.thumbnailWrap,
              selectedImage === idx && styles.thumbnailActive,
            ]}
            testID={`product-thumbnail-${idx}`}
          >
            <Image
              source={{ uri: img }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorLabel}>
        {t('colorLabel')}:{' '}
        <Text style={styles.selectorValue}>
          {language === 'uz' ? selectedColorObj?.name : selectedColorObj?.nameRu}
        </Text>
      </Text>
      <View style={styles.colorRow}>
        {MOCK_COLORS.map((color) => (
          <Pressable
            key={color.id}
            onPress={() => {
              setSelectedColor(color.id);
              void Haptics.selectionAsync();
            }}
            style={[
              styles.colorSwatch,
              { backgroundColor: color.hex },
              selectedColor === color.id && styles.colorSwatchActive,
            ]}
            testID={`color-swatch-${color.id}`}
          >
            {selectedColor === color.id && (
              <Check size={14} color={color.hex === '#1A1A1A' ? '#FFF' : '#1A1A1A'} strokeWidth={3} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderSizeSelector = () => (
    <View style={styles.selectorSection}>
      <View style={styles.sizeLabelRow}>
        <Text style={styles.selectorLabel}>{t('sizeLabel')}:</Text>
        <Pressable>
          <Text style={styles.sizeGuideLink}>{t('sizeGuide')}</Text>
        </Pressable>
      </View>
      <View style={styles.sizeRow}>
        {MOCK_SIZES.map((size) => (
          <Pressable
            key={size}
            onPress={() => {
              setSelectedSize(size);
              void Haptics.selectionAsync();
            }}
            style={[
              styles.sizeBox,
              selectedSize === size && styles.sizeBoxActive,
            ]}
            testID={`size-box-${size}`}
          >
            <Text
              style={[
                styles.sizeBoxText,
                selectedSize === size && styles.sizeBoxTextActive,
              ]}
            >
              {size}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderActionArea = () => (
    <View style={styles.actionArea}>
      {quantity > 0 ? (
        <View style={styles.actionRow}>
          <View style={styles.qtyControlLarge}>
            <Pressable
              onPress={handleRemove}
              style={styles.qtyBtnLarge}
              testID="product-detail-qty-minus"
            >
              <Minus size={18} color="#1A1A1A" strokeWidth={2} />
            </Pressable>
            <Text style={styles.qtyTextLarge}>{quantity}</Text>
            <Pressable
              onPress={handleAdd}
              style={styles.qtyBtnLarge}
              testID="product-detail-qty-plus"
            >
              <Plus size={18} color="#1A1A1A" strokeWidth={2} />
            </Pressable>
          </View>
          <Animated.View style={[styles.addBtnWrap, { transform: [{ scale: addBtnScale }] }]}>
            <Pressable
              onPress={handleGoToCart}
              style={styles.goToCartBtn}
              testID="product-detail-goto-cart"
            >
              <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.goToCartBtnText}>
                {t('goToCart')} ({quantity})
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : (
        <Animated.View style={[styles.addBtnWrap, { flex: 1, transform: [{ scale: addBtnScale }] }]}>
          <Pressable
            onPress={handleAdd}
            style={styles.addToCartBtn}
            testID="product-detail-add-to-cart"
          >
            <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.addToCartBtnText}>{t('addToCartFull')}</Text>
          </Pressable>
        </Animated.View>
      )}
      <Pressable
        onPress={handleToggleFavorite}
        style={[styles.favBtn, favorite && styles.favBtnActive]}
        testID="product-detail-favorite"
      >
        <Heart
          size={22}
          color={favorite ? '#8B0000' : '#888'}
          fill={favorite ? '#8B0000' : 'transparent'}
          strokeWidth={1.8}
        />
      </Pressable>
    </View>
  );

  const renderAccordionItem = (
    key: AccordionKey,
    label: string,
    content: React.ReactNode,
  ) => {
    const isOpen = openSections[key];
    return (
      <View style={styles.accordionItem} key={key}>
        <Pressable
          onPress={() => toggleSection(key)}
          style={styles.accordionHeader}
          testID={`product-accordion-${key}`}
        >
          <Text style={styles.accordionLabel}>{label}</Text>
          {isOpen ? (
            <MinusIcon size={16} color="#1A1A1A" strokeWidth={1.5} />
          ) : (
            <PlusIcon size={16} color="#1A1A1A" strokeWidth={1.5} />
          )}
        </Pressable>
        {isOpen && <View style={styles.accordionBody}>{content}</View>}
      </View>
    );
  };

  const renderAccordion = () => (
    <View style={styles.accordionContainer}>
      {renderAccordionItem(
        'description',
        t('description').toUpperCase(),
        <Text style={styles.accordionBodyText}>{t('descriptionText')}</Text>,
      )}
      {renderAccordionItem(
        'properties',
        t('properties').toUpperCase(),
        <View style={styles.propsGrid}>
          <View style={styles.propRow}>
            <Text style={styles.propLabel}>{t('style')}</Text>
            <Text style={styles.propValue}>{t('propertiesStyle')}</Text>
          </View>
          <View style={styles.propRow}>
            <Text style={styles.propLabel}>{t('season')}</Text>
            <Text style={styles.propValue}>{t('propertiesSeason')}</Text>
          </View>
          <View style={styles.propRow}>
            <Text style={styles.propLabel}>{t('material')}</Text>
            <Text style={styles.propValue}>{t('propertiesMaterial')}</Text>
          </View>
          <View style={styles.propRow}>
            <Text style={styles.propLabel}>{t('composition')}</Text>
            <Text style={styles.propValue}>{t('propertiesComposition')}</Text>
          </View>
          <View style={styles.propRow}>
            <Text style={styles.propLabel}>{t('category')}</Text>
            <Text style={styles.propValue}>{categoryName}</Text>
          </View>
        </View>,
      )}
      {renderAccordionItem(
        'delivery',
        t('deliveryInfo').toUpperCase(),
        <View style={styles.deliveryContent}>
          <View style={styles.deliveryRow}>
            <Truck size={18} color="#1A1A1A" strokeWidth={1.5} />
            <View style={styles.deliveryTextWrap}>
              <Text style={styles.deliveryTitle}>{t('deliveryFree')}</Text>
              <Text style={styles.deliverySubtext}>{t('deliveryTime')}</Text>
            </View>
          </View>
          <View style={styles.deliveryRow}>
            <RotateCcw size={18} color="#1A1A1A" strokeWidth={1.5} />
            <View style={styles.deliveryTextWrap}>
              <Text style={styles.deliveryTitle}>{t('deliveryReturn')}</Text>
            </View>
          </View>
          <View style={styles.deliveryRow}>
            <Package size={18} color="#1A1A1A" strokeWidth={1.5} />
            <View style={styles.deliveryTextWrap}>
              <Text style={styles.deliveryTitle}>{t('deliveryText')}</Text>
            </View>
          </View>
        </View>,
      )}
    </View>
  );

  const renderProductInfo = () => (
    <View style={[styles.infoContainer, isWide && styles.infoContainerWide]}>
      <View style={styles.headerSection}>
        <Text style={styles.brandEyebrow}>{categoryName.toUpperCase()}</Text>
        <Text style={styles.productTitle} testID="product-detail-title">
          {product.modelNumber}
        </Text>
        <Text style={styles.skuText}>
          {t('sku')} {product.variantNumber}
        </Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.priceMain} testID="product-detail-price">
          {priceDisplay}
        </Text>
        {oldPriceDisplay && (
          <Text style={styles.priceOld}>{oldPriceDisplay}</Text>
        )}
        {discountPercent > 0 && (
          <Text style={styles.discountInline}>-{discountPercent}%</Text>
        )}
      </View>

      {renderColorSelector()}
      {renderSizeSelector()}
      {renderActionArea()}
      {renderAccordion()}
    </View>
  );

  return (
    <View style={styles.screen}>
      <WebHeader
        search={search}
        onSearchChange={setSearch}
        onNavigateHome={() => router.push('/(tabs)/catalog' as any)}
        onMenuPress={() => {}}
        onCartPress={() => router.push('/(tabs)/cart' as any)}
        onOrdersPress={() => router.push('/(tabs)/orders' as any)}
        onProfilePress={() => router.push('/(tabs)/settings' as any)}
        onFavoritesPress={() => router.push('/(tabs)/favorites' as any)}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="product-detail-scroll"
      >
        <View style={[styles.pageContainer, isDesktop && styles.pageContainerDesktop]}>
          {isWide && renderBreadcrumbs()}
          <View style={[styles.mainLayout, isWide && styles.mainLayoutWide]}>
            {renderImageGallery()}
            {renderProductInfo()}
          </View>
        </View>
        <GlobalFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContainerDesktop: {
    maxWidth: 1440,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '400' as const,
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  mainLayout: {
    flex: 1,
  },
  mainLayoutWide: {
    flexDirection: 'row',
    gap: 40,
  },
  galleryContainer: {
    width: '100%',
  },
  galleryContainerWide: {
    flex: 1,
    maxWidth: '50%',
  },
  mainImageWrap: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: '#F5F5F5',
    position: 'relative' as const,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E53935',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  trendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F52A57',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  thumbnailRow: {
    marginTop: 12,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  thumbnailWrap: {
    width: 68,
    height: 86,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#1A1A1A',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 28,
  },
  infoContainerWide: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 8,
    gap: 32,
  },
  headerSection: {
    gap: 10,
  },
  brandEyebrow: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '400' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '300' as const,
    color: '#1A1A1A',
    letterSpacing: 1,
    lineHeight: 32,
    ...Platform.select({
      web: { fontFamily: 'Futura, "Futura-Medium", "Futura PT", "Trebuchet MS", "Century Gothic", "Avenir Next", Arial, sans-serif' as any },
      ios: { fontFamily: 'Futura' },
      android: { fontFamily: 'sans-serif' },
      default: {},
    }),
  },
  skuText: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '400' as const,
    letterSpacing: 1,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  priceMain: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  priceOld: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
    letterSpacing: 0.3,
  },
  discountInline: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#B22222',
    letterSpacing: 0.5,
  },
  selectorSection: {
    gap: 14,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
  selectorValue: {
    fontWeight: '400' as const,
    color: '#888888',
    letterSpacing: 0.5,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  sizeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeGuideLink: {
    fontSize: 11,
    color: '#1A1A1A',
    fontWeight: '400' as const,
    textDecorationLine: 'underline',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sizeBox: {
    minWidth: 52,
    height: 44,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  sizeBoxActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  sizeBoxText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  sizeBoxTextActive: {
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  actionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  actionRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyControlLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
  },
  qtyBtnLarge: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyTextLarge: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    paddingHorizontal: 12,
    minWidth: 36,
    textAlign: 'center',
  },
  addBtnWrap: {
    flex: 1,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 0,
    height: 44,
    gap: 10,
  },
  addToCartBtnText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  goToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 0,
    height: 44,
    gap: 10,
    paddingHorizontal: 20,
  },
  goToCartBtnText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  favBtn: {
    width: 44,
    height: 44,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  favBtnActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },

  accordionContainer: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  accordionLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    letterSpacing: 2,
  },
  accordionBody: {
    paddingBottom: 22,
    paddingTop: 2,
  },
  accordionBodyText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#555555',
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  propsGrid: {
    gap: 0,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  propLabel: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  propValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '400' as const,
    textAlign: 'right' as const,
    maxWidth: '60%',
    letterSpacing: 0.3,
  },
  deliveryContent: {
    gap: 18,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  deliveryTextWrap: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  deliverySubtext: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
});
