import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, X, Plus, Minus, ShoppingBag, Layers } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Product, Language, Category } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import useEscapeKey from '@/hooks/useEscapeKey';

const SIZES = ['44', '46', '48', '50', '52', '54', '56'];

const VARIANT_COLORS: { label: string; color: string; imageQuery: string }[] = [
  { label: 'Oq', color: '#F5F0EB', imageQuery: 'white+fabric+textile' },
  { label: 'Kok', color: '#4A6FA5', imageQuery: 'blue+fabric+textile' },
  { label: 'Pushti', color: '#E8A0BF', imageQuery: 'pink+fabric+textile' },
  { label: 'Qora', color: '#2C2C2C', imageQuery: 'black+fabric+textile' },
  { label: 'Kulrang', color: '#9E9E9E', imageQuery: 'gray+fabric+textile' },
];

interface QuickViewModalProps {
  visible: boolean;
  product: Product | null;
  language: Language;
  categories: Category[];
  quantity: number;
  isFavorite: boolean;
  onClose: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onToggleFavorite: () => void;
  onSimilar: (categoryId: string) => void;
}

function QuickViewModal({
  visible,
  product,
  language,
  categories,
  quantity,
  isFavorite,
  onClose,
  onAdd,
  onRemove,
  onToggleFavorite,
  onSimilar,
}: QuickViewModalProps) {
  const { width, height } = useWindowDimensions();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const [internalVisible, setInternalVisible] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [activeImage, setActiveImage] = useState<string>('');
  const [hoveredVariant, setHoveredVariant] = useState<number | null>(null);

  const { t } = useAuth();

  const isDesktop = Platform.OS === 'web' && width >= 540;
  const isLargeDesktop = Platform.OS === 'web' && width >= 1100;

  const modalWidth = isLargeDesktop
    ? Math.min(920, width * 0.72)
    : isDesktop
    ? Math.min(760, width * 0.92)
    : width - 24;

  const modalMaxHeight = Math.min(height * 0.88, 720);

  const variantImages = useMemo(() => {
    if (!product) return [];
    const baseUrl = product.image.split('?')[0];
    return VARIANT_COLORS.map((v, i) => {
      if (i === 0) return product.image;
      return `${baseUrl}?w=400&h=400&fit=crop&sat=-${i * 10}&hue=${i * 40}`;
    });
  }, [product]);

  useEffect(() => {
    if (visible && product) {
      setActiveImage(product.image);
      setSelectedVariant(0);
      setInternalVisible(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, product, backdropOpacity, modalScale, modalOpacity]);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.92,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      onClose();
    });
  }, [backdropOpacity, modalScale, modalOpacity, onClose]);

  const handleAdd = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd();
  }, [onAdd]);

  const handleRemove = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove();
  }, [onRemove]);

  const handleFavorite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleFavorite();
  }, [onToggleFavorite]);

  const handleSimilar = useCallback(() => {
    if (product) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateClose();
      setTimeout(() => {
        onSimilar(product.category);
      }, 200);
    }
  }, [product, onSimilar, animateClose]);

  const handleVariantClick = useCallback((index: number) => {
    setSelectedVariant(index);
    setActiveImage(variantImages[index] ?? '');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [variantImages]);

  useEscapeKey(internalVisible, animateClose);



  if (!internalVisible || !product) return null;

  const categoryName =
    categories.find((c) => c.id === product.category)?.[language] ?? product.category;

  const hasOldPrice =
    product.oldPrice != null &&
    product.price != null &&
    product.oldPrice > product.price;

  const discountPercent = hasOldPrice
    ? Math.round(((product.oldPrice! - product.price!) / product.oldPrice!) * 100)
    : 0;

  const displayImage = activeImage || product.image;
  const highResImage = displayImage
    .replace(/w=\d+/, 'w=1200')
    .replace(/h=\d+/, 'h=1200');

  const renderImageSection = () => (
    <View style={[styles.imageSection, isDesktop && styles.imageSectionDesktop]}>
      <Image
        source={{ uri: highResImage }}
        style={[
          styles.productImage,
          isDesktop && styles.productImageDesktop,
        ]}
        contentFit="cover"
        transition={200}
      />
      {product.isTrending && (
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingText}>TREND</Text>
        </View>
      )}
      {product.visibility === 'vip' && (
        <View style={styles.vipBadge}>
          <Text style={styles.vipText}>VIP</Text>
        </View>
      )}
      {hasOldPrice && (
        <View style={styles.imageSaleBadge}>
          <Text style={styles.imageSaleText}>-{discountPercent}%</Text>
        </View>
      )}
      <Pressable
        onPress={handleSimilar}
        style={styles.similarBtn}
        testID="quick-view-similar"
      >
        <Layers size={14} color="#FFFFFF" strokeWidth={2.2} />
        <Text style={styles.similarText}>{t('similar')}</Text>
      </Pressable>
    </View>
  );

  const renderVariantThumbnails = () => (
    <View style={styles.variantsSection}>
      <Text style={styles.sectionLabel}>
        {t('colorLabel')}: <Text style={styles.sectionLabelValue}>{VARIANT_COLORS[selectedVariant]?.label}</Text>
      </Text>
      <View style={styles.variantsRow}>
        {VARIANT_COLORS.map((variant, index) => {
          const isSelected = selectedVariant === index;
          const isHovered = hoveredVariant === index;
          return (
            <View key={variant.label} style={styles.variantWrapper}>
              <Pressable
                onPress={() => handleVariantClick(index)}
                onHoverIn={Platform.OS === 'web' ? () => setHoveredVariant(index) : undefined}
                onHoverOut={Platform.OS === 'web' ? () => setHoveredVariant(null) : undefined}
                style={[
                  styles.variantThumb,
                  isSelected && styles.variantThumbSelected,
                ]}
                testID={`variant-thumb-${index}`}
              >
                <View style={[styles.variantColorDot, { backgroundColor: variant.color }]} />
                <Image
                  source={{ uri: variantImages[index] }}
                  style={styles.variantThumbImage}
                  contentFit="cover"
                />
              </Pressable>
              {isHovered && Platform.OS === 'web' && (
                <View style={styles.variantTooltip}>
                  <Image
                    source={{ uri: variantImages[index] }}
                    style={styles.tooltipImage}
                    contentFit="cover"
                  />
                  <Text style={styles.tooltipPrice}>
                    {product.price !== null ? `${product.price.toFixed(2)} $` : '—'}
                  </Text>
                  <Text style={styles.tooltipLabel}>{variant.label}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderSizeSelector = () => (
    <View style={styles.sizeSection}>
      <View style={styles.sizeLabelRow}>
        <Text style={styles.sectionLabel}>
          {t('sizeLabel')}
        </Text>
      </View>
      <View style={styles.sizeGrid}>
        {SIZES.map((size) => (
          <View
            key={size}
            style={styles.sizeBox}
            testID={`size-${size}`}
          >
            <Text style={styles.sizeText}>
              {size}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDetailsSection = () => (
    <View style={[styles.detailsSection, isDesktop && styles.detailsSectionDesktop]}>
      <View style={styles.detailsTopRow}>
        <Pressable onPress={handleSimilar} style={styles.categoryTag} testID="quick-view-category">
          <Text style={styles.categoryTagText}>{categoryName}</Text>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable
            onPress={handleFavorite}
            style={styles.favBtn}
            testID="quick-view-favorite"
          >
            <Heart
              size={30}
              color={isFavorite ? '#E91E63' : '#1A1A2E'}
              fill={isFavorite ? '#E91E63' : 'transparent'}
              strokeWidth={2}
            />
          </Pressable>
          <Pressable
            onPress={animateClose}
            style={styles.headerCloseBtn}
            testID="quick-view-close-inner"
          >
            <X size={18} color="#666" strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.brandName}>MILANA TEXTILE</Text>
      <Text style={styles.productTitle} numberOfLines={3}>
        {product.modelNumber} / {t('variantLabel')} {product.variantNumber}
      </Text>

      <View style={styles.ratingRow}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Text key={star} style={[styles.starIcon, star <= 4 ? styles.starFilled : styles.starEmpty]}>★</Text>
          ))}
        </View>
        <Text style={styles.reviewCount}>128 {t('reviews')}</Text>
      </View>

      <View style={styles.priceBlock}>
        <View style={styles.priceRow}>
          <Text style={styles.priceMain}>
            {product.price !== null ? `${product.price.toFixed(2)} $` : '—'}
          </Text>
          {hasOldPrice && (
            <>
              <Text style={styles.priceOld}>{product.oldPrice!.toFixed(2)} $</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            </>
          )}
        </View>

      </View>

      <View style={styles.thinDivider} />

      {renderVariantThumbnails()}

      <View style={styles.thinDivider} />

      {renderSizeSelector()}

      <View style={styles.thinDivider} />

      <View style={styles.cartSection}>
        {quantity > 0 ? (
          <View style={styles.capsule}>
            <Pressable
              onPress={handleAdd}
              style={styles.capsuleLeft}
              testID="quick-view-add-cart"
            >
              <Text style={styles.capsuleLeftText}>
                {t('addToCartFull')}
              </Text>
              <ShoppingBag size={17} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
            <View style={styles.capsuleRight}>
              <Pressable
                onPress={handleRemove}
                style={styles.capsuleStepperBtn}
                testID="quick-view-minus"
              >
                <Minus size={16} color="#000000" strokeWidth={2.5} />
              </Pressable>
              <Text style={styles.capsuleQtyText}>{quantity}</Text>
              <Pressable
                onPress={handleAdd}
                style={styles.capsuleStepperBtn}
                testID="quick-view-plus"
              >
                <Plus size={16} color="#000000" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={handleAdd}
            style={styles.addToCartBtn}
            testID="quick-view-add-cart"
          >
            <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.addToCartText}>
              {t('addToCartFull')}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.deliveryRow}>
        <View style={styles.deliveryDot} />
        <Text style={styles.deliveryText} selectable={false}>{t('delivery')}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      transparent
      visible={internalVisible}
      animationType="none"
      onRequestClose={animateClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={animateClose}
            testID="quick-view-backdrop"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: modalWidth,
              maxHeight: modalMaxHeight,
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            },
          ]}
        >
          {isDesktop ? (
            <View style={styles.desktopLayout}>
              <View style={styles.imageColumnDesktop}>
                {renderImageSection()}
              </View>
              <ScrollView
                style={styles.detailsScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailsScrollContent}
              >
                {renderDetailsSection()}
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mobileScrollContent}
              bounces={false}
            >
              {renderImageSection()}
              {renderDetailsSection()}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

export default React.memo(QuickViewModal);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 24,
  },
  desktopLayout: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    flex: 1,
    height: '100%',
  },
  imageColumnDesktop: {
    width: '50%',
    flexShrink: 0,
    backgroundColor: '#E5E5E5',
  },
  mobileScrollContent: {
    paddingBottom: 24,
  },
  imageSection: {
    aspectRatio: 0.85,
    backgroundColor: '#F5F5F7',
    position: 'relative' as const,
  },
  imageSectionDesktop: {
    flex: 1,
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImageDesktop: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  trendingBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendingText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  vipBadge: {
    position: 'absolute',
    top: 14,
    left: 80,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vipText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  imageSaleBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#C62828',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageSaleText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  similarBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  similarText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  detailsSection: {
    padding: 18,
    gap: 8,
  },
  detailsSectionDesktop: {
    flex: 1,
    padding: 24,
    gap: 10,
  },
  detailsScroll: {
    width: '50%',
    flexShrink: 0,
    height: '100%',
  },
  detailsScrollContent: {
    flexGrow: 1,
  },
  detailsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#F3F3F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS !== 'web' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    } : {}),
  },
  headerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#999',
    letterSpacing: 1,
    marginTop: 2,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  starIcon: {
    fontSize: 14,
  },
  starFilled: {
    color: '#FFB800',
  },
  starEmpty: {
    color: '#DDD',
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400' as const,
  },
  priceBlock: {
    marginTop: 4,
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceMain: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  priceOld: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#C62828',
  },
  thinDivider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginVertical: 4,
  },
  variantsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#777',
  },
  sectionLabelValue: {
    fontWeight: '600' as const,
    color: '#333',
  },
  variantsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  variantWrapper: {
    position: 'relative' as const,
  },
  variantThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  variantThumbSelected: {
    borderColor: '#1A1A2E',
    borderWidth: 2,
  },
  variantColorDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    zIndex: 2,
  },
  variantThumbImage: {
    width: '100%',
    height: '100%',
  },
  variantTooltip: {
    position: 'absolute',
    bottom: 60,
    left: -20,
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tooltipImage: {
    width: 92,
    height: 92,
    borderRadius: 6,
  },
  tooltipPrice: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1A1A2E',
    marginTop: 4,
  },
  tooltipLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500' as const,
    marginTop: 1,
  },
  sizeSection: {
    gap: 8,
  },
  sizeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeGuideLink: {
    fontSize: 12,
    color: '#CB11AB',
    fontWeight: '500' as const,
    textDecorationLine: 'underline',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sizeBox: {
    minWidth: 48,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },

  sizeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#444',
  },

  cartSection: {
    marginTop: 4,
  },
  capsule: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  capsuleLeft: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    gap: 8,
    paddingHorizontal: 10,
  },
  capsuleLeftText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  capsuleRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 8,
  },
  capsuleStepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleQtyText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#000000',
    textAlign: 'center' as const,
    minWidth: 20,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    height: 48,
    gap: 10,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F8FFF8',
    borderRadius: 8,
  },
  deliveryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  deliveryText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500' as const,
  },

});
