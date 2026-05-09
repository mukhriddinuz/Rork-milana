import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useDepartmentTheme } from '@/contexts/DepartmentThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { MAX_WIDTH } from '@/components/BoxedContainer';
import CatalogCard from '@/components/CatalogCard';
import { Product, TargetAudience } from '@/types';

const DEPT_TO_AUDIENCE: Record<string, TargetAudience | undefined> = {
  men: 'erkaklar',
  women: 'ayollar',
  kids: 'bolalar',
};

const SIDE_PADDING = 24;
const GAP = 24;
const MAX_ITEMS = 8;

interface NewArrivalsCarouselProps {
  hideTitle?: boolean;
  strictBounds?: boolean;
  imageWidth?: number;
  imageHeight?: number;
}

export default function NewArrivalsCarousel({ hideTitle = false, strictBounds = false, imageWidth, imageHeight }: NewArrivalsCarouselProps = {}) {
  const { t, language } = useAuth();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { activeDepartment, theme: dt } = useDepartmentTheme();
  const responsive = useResponsive();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const isDesktop = responsive.isDesktop && responsive.isWeb;
  const isMobile = responsive.isMobile;
  const visibleCount = isDesktop ? 4 : isMobile ? 1 : 2;

  const horizontalPadding = strictBounds ? 0 : SIDE_PADDING;
  const boundsWidth = strictBounds ? screenWidth : Math.min(screenWidth, MAX_WIDTH);
  const availableWidth = Math.max(
    240,
    boundsWidth - horizontalPadding * 2,
  );

  const cardWidth = useMemo(() => {
    if (typeof imageWidth === 'number' && imageWidth > 0) return imageWidth;
    const totalGap = GAP * (visibleCount - 1);
    return Math.max(140, Math.floor((availableWidth - totalGap) / visibleCount));
  }, [availableWidth, visibleCount, imageWidth]);

  const trackWidth = cardWidth * visibleCount + GAP * (visibleCount - 1);
  const arrowTop = useMemo(() => {
    const h = typeof imageHeight === 'number' && imageHeight > 0 ? imageHeight : 301.52;
    return Math.max(0, h / 2 - 41.59 / 2);
  }, [imageHeight]);

  const items: Product[] = useMemo(() => {
    const published = products.filter(
      (p) => p.status === 'published' && p.price !== null && p.image && p.isNew === true,
    );
    const audience = DEPT_TO_AUDIENCE[activeDepartment];
    const scoped = audience
      ? published.filter((p) => p.targetAudience === audience)
      : published;
    const source = scoped.length > 0 ? scoped : published;
    const sorted = [...source].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });
    return sorted.slice(0, MAX_ITEMS);
  }, [products, activeDepartment]);

  const totalPages = Math.max(1, Math.ceil(items.length / visibleCount));
  const [page, setPage] = useState<number>(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  useEffect(() => {
    const pageWidth = trackWidth + GAP;
    Animated.timing(translateX, {
      toValue: -page * pageWidth,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [page, trackWidth, translateX]);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const handlePrev = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);
  const handleNext = useCallback(() => {
    setPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const handleImagePress = useCallback(
    (product: Product) => {
      router.push(`/product/${product.id}` as any);
    },
    [router],
  );

  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: 'transparent' },
        strictBounds && styles.sectionStrict,
      ]}
    >
      {!hideTitle && (
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/catalog?segment=yangi' as any)}
          accessibilityRole="link"
          accessibilityLabel={t('sectionNewArrivals')}
          style={styles.headerLink}
          testID="new-arrivals-header-link"
          {...(Platform.OS === 'web' ? ({ href: '/catalog?segment=yangi' } as any) : {})}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: dt.textPrimary,
              },
            ]}
          >
            {t('sectionNewArrivals')}
          </Text>
        </Pressable>
      </View>
      )}

      <View
        style={[
          styles.carouselWrap,
          { paddingHorizontal: horizontalPadding },
        ]}
      >
        {isDesktop && (
          <Pressable
            onPress={handlePrev}
            disabled={!canPrev}
            style={[
              styles.arrow,
              styles.arrowLeft,
              { top: arrowTop, opacity: canPrev ? 1 : 0.2 },
            ]}
            testID="new-arrivals-prev"
          >
            <ChevronLeft size={30} color="#000000" strokeWidth={1} />
          </Pressable>
        )}

        <View style={[styles.viewport, { width: trackWidth }]}>
          <Animated.View
            style={[
              styles.track,
              {
                width: trackWidth * totalPages + GAP * (totalPages - 1),
                transform: [{ translateX }],
              },
            ]}
          >
            {items.map((product, idx) => (
              <View
                key={product.id}
                style={[
                  styles.cardSlot,
                  {
                    width: cardWidth,
                    marginRight: idx === items.length - 1 ? 0 : GAP,
                  },
                ]}
              >
                <CatalogCard
                  product={product}
                  quantity={getQuantity(product.id)}
                  language={language}
                  categories={categories}
                  onImagePress={() => handleImagePress(product)}
                  onAdd={() => addToCart(product.id)}
                  onRemove={() => removeFromCart(product.id)}
                  isFavorite={isFavorite(product.id)}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                  hideBadgeContext={true}
                  href={`/product/${product.id}`}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                />
              </View>
            ))}
          </Animated.View>
        </View>

        {isDesktop && (
          <Pressable
            onPress={handleNext}
            disabled={!canNext}
            style={[
              styles.arrow,
              styles.arrowRight,
              { top: arrowTop, opacity: canNext ? 1 : 0.2 },
            ]}
            testID="new-arrivals-next"
          >
            <ChevronRight size={30} color="#000000" strokeWidth={1} />
          </Pressable>
        )}
      </View>

      {totalPages > 1 && (
        <View style={styles.dotsRow} testID="new-arrivals-dots">
          {Array.from({ length: totalPages }).map((_, i) => {
            const active = i === page;
            return (
              <Pressable
                key={`dot-${i}`}
                onPress={() => setPage(i)}
                style={styles.dotHit}
                testID={`new-arrivals-dot-${i}`}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active ? dt.textPrimary : 'transparent',
                      borderColor: dt.textPrimary,
                      opacity: active ? 1 : 0.35,
                      width: active ? 18 : 6,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    marginVertical: 40,
    backgroundColor: 'transparent',
  },
  sectionStrict: {
    maxWidth: undefined as unknown as number,
    marginVertical: 0,
  },
  header: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    paddingHorizontal: SIDE_PADDING,
  },
  headerLink: {
    alignSelf: 'center' as const,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', textDecorationLine: 'none' } as any) : {}),
  },
  headerLine: {
    flex: 1,
    maxWidth: 80,
    height: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    textAlign: 'center' as const,
    color: '#000000',
    fontFamily: Platform.select({
      web: 'Futura, "Futura PT", "Trebuchet MS", "Helvetica Neue", Helvetica, Arial, sans-serif',
      ios: 'Futura',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  carouselWrap: {
    position: 'relative' as const,
    width: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  },
  viewport: {
    overflow: 'hidden' as const,
    alignSelf: 'center' as const,
  },
  track: {
    flexDirection: 'row' as const,
  },
  cardSlot: {
    flexShrink: 0,
  },
  arrow: {
    position: 'absolute' as const,
    zIndex: 5,
    width: 29.95,
    height: 41.59,
    backgroundColor: 'transparent' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...(Platform.OS === 'web'
      ? ({ transition: 'opacity 0.2s ease' } as any)
      : {}),
  },
  arrowLeft: {
    left: -24,
  },
  arrowRight: {
    right: -24,
  },
  dotsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 28,
    gap: 6,
  },
  dotHit: {
    padding: 6,
  },
  dot: {
    height: 2,
    borderWidth: 0,
    ...(Platform.OS === 'web'
      ? ({ transition: 'width 0.3s ease, opacity 0.3s ease' } as any)
      : {}),
  },
});
