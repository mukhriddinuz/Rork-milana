import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Heart, ShoppingBag, Star } from 'lucide-react-native';
import ToteIcon from '@/components/icons/ToteIcon';
import * as Haptics from 'expo-haptics';
import { Product, Language, Category } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/contexts/AuthContext';
import { useLightbox } from '@/contexts/LightboxContext';
import { useDepartmentTheme } from '@/contexts/DepartmentThemeContext';

interface CatalogCardProps {
  product: Product;
  quantity: number;
  language: Language;
  categories: Category[];
  onImagePress: () => void;
  onAdd: () => void;
  onRemove: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isTrendingCard?: boolean;
  hideBadgeContext?: boolean;
  href?: string;
  imageWidth?: number;
  imageHeight?: number;
}

function CatalogCard({
  product,
  quantity,
  language,
  categories,
  onImagePress,
  onAdd,
  onRemove,
  isFavorite = false,
  onToggleFavorite,
  hideBadgeContext = false,
  href,
  imageWidth,
  imageHeight,
}: CatalogCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const { isMobile } = useResponsive();
  const { t } = useAuth();
  const { open: openLightbox } = useLightbox();
  const { activeDepartment } = useDepartmentTheme();
  const isMens = activeDepartment === 'men';
  const handleZoom = useCallback(
    (e?: any) => {
      e?.stopPropagation?.();
      void Haptics.selectionAsync();
      const highRes = product.image
        ? product.image.replace(/w=\d+/, 'w=1600').replace(/h=\d+/, 'h=1600')
        : product.image;
      openLightbox(highRes);
    },
    [openLightbox, product.image],
  );

  const categoryName =
    categories.find((c) => c.id === product.category)?.[language] ?? product.category ?? '';

  const handleFavorite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite?.();
  }, [onToggleFavorite]);

  const handleAdd = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd();
  }, [onAdd]);

  const webHoverProps = isWeb ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  const priceDisplay = product.price !== null ? `$${product.price.toFixed(0)}` : '\u2014';
  const hasOldPrice = product.oldPrice != null && product.price != null && product.oldPrice > product.price;

  const imageAlt = `${product.modelNumber ?? ''} | ${categoryName}`.trim();

  const inCart = quantity > 0;
  const showHeart = true;
  const showCartIcon = (isWeb && isHovered) || inCart;
  const showNewLabel = product.isNew === true && !hideBadgeContext;

  const hasSecondary = !!product.secondaryImage && product.secondaryImage !== product.image;
  const showSecondary = isWeb && isHovered && hasSecondary;

  const imageStack = (
    <>
      <Image
        source={{ uri: product.image }}
        style={[styles.image, imageWidth ? { width: imageWidth } : null, imageHeight ? { height: imageHeight } : null]}
        contentFit="cover"
        transition={0}
        alt={imageAlt}
        accessibilityLabel={imageAlt}
        accessible={true}
        accessibilityRole="image"
        {...(Platform.OS === 'web' ? ({ role: 'img' } as object) : {})}
      />
      {hasSecondary && (
        <Image
          source={{ uri: product.secondaryImage as string }}
          style={[
            styles.image,
            styles.imageOverlayLayer,
            imageWidth ? { width: imageWidth } : null,
            imageHeight ? { height: imageHeight } : null,
            { opacity: showSecondary ? 1 : 0 },
          ]}
          contentFit="cover"
          transition={0}
          alt={imageAlt}
          accessibilityLabel={imageAlt}
          accessible={false}
          accessibilityRole="image"
        />
      )}
    </>
  );

  const newBadgeLabel = language === 'uz' ? 'YANGI KELGAN' : language === 'ru' ? 'НОВИНКА' : (t('newArrival') ?? 'NEW ARRIVAL');

  const cardHeader = !isMens ? (
    <View style={styles.cardHeader}>
      {showNewLabel ? (
        <View style={styles.newBadge} pointerEvents="none" testID={`catalog-card-new-${product.id}`}>
          <Text style={styles.newBadgeText}>{newBadgeLabel}</Text>
          <View style={styles.newBadgeNotch} />
        </View>
      ) : (
        <View />
      )}
      <View style={styles.cardHeaderActions}>
        <Pressable
          onPress={(e) => {
            (e as any).stopPropagation?.();
            (e as any).preventDefault?.();
            handleAdd();
          }}
          style={[
            styles.favButton,
            {
              opacity: isWeb && isHovered ? 1 : 0,
              ...(Platform.OS === 'web' ? ({ transition: 'opacity 0.2s ease' } as any) : {}),
            },
          ]}
          hitSlop={8}
          testID={`catalog-card-bag-header-${product.id}`}
        >
          <ToteIcon
            size={20}
            color={inCart ? '#999999' : '#000000'}
            strokeWidth={1.2}
            fill={inCart ? '#999999' : 'none'}
          />
        </Pressable>
        {showHeart && (
          <Pressable
            onPress={(e) => {
              (e as any).stopPropagation?.();
              (e as any).preventDefault?.();
              handleFavorite();
            }}
            style={styles.favButton}
            hitSlop={8}
            testID={`catalog-card-heart-${product.id}`}
          >
            <Heart
              size={20}
              color={isFavorite ? '#999999' : '#000000'}
              fill={isFavorite ? '#999999' : 'transparent'}
              strokeWidth={1.5}
            />
          </Pressable>
        )}
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.card} {...webHoverProps}>
      {cardHeader}
      {isWeb && href ? (
        <Link
          href={href as any}
          asChild
          onPress={(e: any) => {
            if (e?.metaKey || e?.ctrlKey || e?.shiftKey || e?.button === 1) {
              return;
            }
            onImagePress();
            e?.preventDefault?.();
          }}
        >
          <Pressable
            onLongPress={() => handleZoom()}
            delayLongPress={280}
            testID={`catalog-card-image-${product.id}`}
            style={styles.imagePressable as any}
          >
            <View style={[styles.imageContainer, imageWidth ? { width: imageWidth, aspectRatio: undefined as unknown as number } : null, imageHeight ? { height: imageHeight, aspectRatio: undefined as unknown as number } : null, isMens && styles.imageContainerMens]}>
              {imageStack}
            </View>
          </Pressable>
        </Link>
      ) : (
        <Pressable
          onPress={onImagePress}
          onLongPress={() => handleZoom()}
          delayLongPress={280}
          testID={`catalog-card-image-${product.id}`}
          {...(isWeb ? ({ style: styles.imagePressable } as any) : {})}
        >
          <View style={[styles.imageContainer, imageWidth ? { width: imageWidth, aspectRatio: undefined as unknown as number } : null, imageHeight ? { height: imageHeight, aspectRatio: undefined as unknown as number } : null, isMens && styles.imageContainerMens]}>
            {imageStack}
          </View>
        </Pressable>
      )}

      {isMens ? (
        <View style={styles.infoMens}>
          <View style={styles.mensRowExact}>
            <Text style={[styles.brandName, styles.mensTextLeft]} numberOfLines={1}>
              {(categoryName ?? '').toUpperCase()}
            </Text>
            <Pressable
              onPress={(e) => {
                (e as any).stopPropagation?.();
                (e as any).preventDefault?.();
                handleFavorite();
              }}
              style={styles.mensActionBtn}
              hitSlop={8}
              testID={`catalog-card-star-${product.id}`}
            >
              <Star
                size={18}
                color={isFavorite ? '#999999' : '#000000'}
                strokeWidth={1}
                fill={isFavorite ? '#999999' : 'transparent'}
              />
            </Pressable>
          </View>

          <View style={styles.mensRowExact}>
            <View style={styles.mensPriceWrap}>
              <Text style={styles.price}>{priceDisplay}</Text>
              {hasOldPrice && (
                <Text style={styles.oldPrice}>
                  ${product.oldPrice!.toFixed(0)}
                </Text>
              )}
            </View>
            {showCartIcon ? (
              <Pressable
                onPress={(e) => {
                  (e as any).stopPropagation?.();
                  (e as any).preventDefault?.();
                  handleAdd();
                }}
                style={styles.mensActionBtn}
                hitSlop={8}
                testID={`catalog-card-bag-mens-${product.id}`}
              >
                <ToteIcon
                  size={20}
                  color={inCart ? '#999999' : '#000000'}
                  strokeWidth={1.2}
                  fill={inCart ? '#999999' : 'none'}
                />
              </Pressable>
            ) : (
              <View style={styles.mensActionBtn} />
            )}
          </View>
        </View>
      ) : (

      <View style={styles.info}>
        <Text style={styles.brandName} numberOfLines={1}>
          {(categoryName ?? '').toUpperCase()}
        </Text>
        <Text style={styles.productName} numberOfLines={1}>
          {product.modelNumber}
        </Text>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>{priceDisplay}</Text>
          {hasOldPrice && (
            <Text style={styles.oldPrice}>
              ${product.oldPrice!.toFixed(0)}
            </Text>
          )}
        </View>

        {isMobile && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.mobileAddBtn,
                pressed && styles.mobileAddBtnPressed,
              ]}
              testID={`catalog-card-add-mobile-${product.id}`}
            >
              <ShoppingBag
                size={14}
                color="#000000"
                strokeWidth={1.3}
                fill={inCart ? '#CCCCCC' : 'transparent'}
              />
            </Pressable>
          </View>
        )}
      </View>
      )}
    </View>
  );
}

export default React.memo(CatalogCard);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    aspectRatio: 326 / 369,
    width: '100%',
    backgroundColor: '#F5F5F5',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  imageContainerMens: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    overflow: 'hidden' as const,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    height: 32,
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  cardHeaderActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  favButton: {
    padding: 4,
    marginRight: -4,
    zIndex: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  actionIconBtn: {
    width: 26,
    height: 26,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'transparent',
    borderRadius: 13,
  },
  heartAbs: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'transparent',
    zIndex: 3,
  },
  cartOverlayAbs: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web'
      ? ({ transition: 'opacity 0.3s ease, background-color 0.3s ease' } as any)
      : {}),
  },
  cartAbs: {
    position: 'absolute' as const,
    bottom: 12,
    left: '50%' as const,
    marginLeft: -14,
    width: 28,
    height: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'transparent',
    zIndex: 3,
    ...(Platform.OS === 'web'
      ? ({ transition: 'opacity 0.3s ease' } as any)
      : {}),
  },
  newBadgeAbs: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 2,
  },
  newBadge: {
    position: 'relative' as const,
    paddingVertical: 4,
    paddingHorizontal: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D4D4D4',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: '#555555',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      default: 'sans-serif',
    }),
  },
  newBadgeNotch: {
    position: 'absolute' as const,
    bottom: -4,
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D4D4D4',
    transform: [{ rotate: '45deg' }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlayLayer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...(Platform.OS === 'web'
      ? ({ transition: 'opacity 0.4s ease' } as any)
      : {}),
  },
  imagePressable: {
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  topBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    minHeight: 28,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  topBarLeft: {
    flexShrink: 1,
  },
  topBarRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  iconBtn: {
    width: 22,
    height: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  newLabelWrap: {
    alignSelf: 'flex-start' as const,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#999999',
    paddingHorizontal: 2,
    position: 'relative' as const,
  },
  newLabelText: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: '#111111',
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    fontFamily: Platform.select({ ios: 'Futura-Medium', android: 'sans-serif-medium', default: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif' }),
  },
  newLabelNotch: {
    position: 'absolute' as const,
    bottom: -4,
    left: '50%' as const,
    marginLeft: -4,
    width: 7,
    height: 7,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#999999',
    transform: [{ rotate: '45deg' }],
  },
  info: {
    paddingTop: 12,
    paddingBottom: 16,
    gap: 3,
    alignItems: 'center' as const,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    fontFamily: Platform.select({ ios: 'Futura-Medium', android: 'sans-serif-medium', default: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif' }),
  },
  productName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 0.5,
    marginTop: 1,
    textAlign: 'center' as const,
    fontFamily: Platform.select({ ios: 'Futura-Medium', android: 'sans-serif-medium', default: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif' }),
  },
  priceWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginTop: 6,
  },
  price: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 0.4,
    textAlign: 'center' as const,
    fontFamily: Platform.select({ ios: 'Futura-Medium', android: 'sans-serif-medium', default: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif' }),
  },
  oldPrice: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#BBBBBB',
    textDecorationLine: 'line-through' as const,
  },
  actionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 8,
  },

  mobileAddBtn: {
    width: 30,
    height: 30,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mobileAddBtnPressed: {
    backgroundColor: '#F5F5F5',
  },
  infoMens: {
    paddingTop: 10,
    flexDirection: 'column' as const,
  },
  mensRowExact: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    height: 31,
    width: '100%' as const,
  },
  mensTextLeft: {
    textAlign: 'left' as const,
    flexShrink: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  mensPriceWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  mensActionBtn: {
    width: 28,
    height: 31,
    justifyContent: 'center' as const,
    alignItems: 'flex-end' as const,
  },
});
