import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';

import { LayoutGrid, ChevronDown, ChevronRight } from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useClients } from '@/contexts/ClientsContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useDepartmentTheme } from '@/contexts/DepartmentThemeContext';
import CatalogCard from '@/components/CatalogCard';
import EmptyState from '@/components/EmptyState';
import QuickViewModal from '@/components/QuickViewModal';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import WebHeader, { TOTAL_HEADER_HEIGHT } from '@/components/WebHeader';
import GlobalFooter from '@/components/GlobalFooter';
import BrandPreFooter from '@/components/BrandPreFooter';
import MobileHeader from '@/components/MobileHeader';

import EditorialShowroom from '@/components/EditorialShowroom';
import MensEditorialShowroom from '@/components/MensEditorialShowroom';
import KidsEditorialShowroom from '@/components/KidsEditorialShowroom';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { Product } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';

const BATCH_SIZE = 40;
const CATALOG_CONTENT_WIDTH = 1440;

const VISUAL_SUB_IMAGES: Record<string, string> = {
  xalat: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=600&h=450&fit=crop&q=80',
  pijama: 'https://images.unsplash.com/photo-1573612664822-d7d347da7b80?w=600&h=450&fit=crop&q=80',
  koylak: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&h=450&fit=crop&q=80',
  futbolka: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=450&fit=crop&q=80',
  shim: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=450&fit=crop&q=80',
  ichki_kiyim: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=450&fit=crop&q=80',
  sochiq: 'https://images.unsplash.com/photo-1620912189865-8f3c5a4b2f0a?w=600&h=450&fit=crop&q=80',
  choyshablar: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=450&fit=crop&q=80',
  all: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=450&fit=crop&q=80',
};

export default function CatalogScreen() {
  const responsive = useResponsive();
  const { language, t } = useAuth();
  const { products } = useProducts();
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { categories } = useCategories();
  const { getClientById } = useClients();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { activeDepartment } = useDepartmentTheme();

  const clientProfile = user?.role === 'client' && user ? getClientById(user.id) : null;
  const clientStatus = clientProfile?.clientStatus ?? 'standard';

  const { search, setSearch, selectedCategory, setSelectedCategory, selectedTopCategory, setSelectedTopCategory, showCatalog, goHome, enterCatalog, exitCatalog } = useWebHeader();
  const router = useRouter();
  const params = useLocalSearchParams();

  React.useEffect(() => {
    let shouldOpenGrid = false;

    // 1. Sync Department (Segment) - drives activeDepartment via selectedTopCategory
    if (params.segment && typeof params.segment === 'string') {
      setSelectedTopCategory(params.segment);
    } else {
      setSelectedTopCategory('women');
    }

    // 2. Sync Category & triggers for the Grid
    if (params.category && typeof params.category === 'string') {
      setSelectedCategory(params.category);
      shouldOpenGrid = true;
    } else {
      setSelectedCategory('all');
    }

    if (params.sort || params.collection || params.q) {
      shouldOpenGrid = true;
    }

    // 3. Route accordingly
    if (shouldOpenGrid) {
      enterCatalog();
    } else {
      exitCatalog(); // Show Editorial Showroom (preserve segment)
    }
  }, [params.category, params.segment, params.sort, params.collection, params.q, setSelectedCategory, setSelectedTopCategory, enterCatalog, exitCatalog]);
  const [localSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);

  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [activeSort, setActiveSort] = useState<string>('new');

  const publishedProductsForOptions = useMemo(
    () => products.filter((p) => {
      if (p.status !== 'published' || p.price === null) return false;
      if (user?.role === 'client' && p.visibility === 'vip' && clientStatus !== 'vip') return false;
      return true;
    }),
    [products, user?.role, clientStatus],
  );

  const getFilterOptions = useCallback((filterId: string): string[] => {
    switch (filterId) {
      case 'cat': {
        const activeCatIds = Array.from(new Set(publishedProductsForOptions.map((p) => p.category)));
        const activeCats = activeCatIds.map((id) => {
          const c = categories.find((cat: any) => cat.id === id);
          return c ? ((c as any)[language] || (c as any).label || (c as any).name || id) : id;
        });
        return Array.from(new Set(activeCats)).filter(Boolean).sort() as string[];
      }
      case 'designer': {
        const designers = Array.from(
          new Set(publishedProductsForOptions.map((p) => (p as any).brand || (p as any).designer)),
        ).filter(Boolean) as string[];
        return designers.length > 0 ? designers.sort() : ['Milana Premium'];
      }
      case 'size': {
        const allSizes = publishedProductsForOptions.flatMap((p) =>
          (p as any).variants ? ((p as any).variants as any[]).map((v) => v.size) : [],
        );
        return Array.from(new Set(allSizes)).filter(Boolean).sort() as string[];
      }
      case 'color': {
        const allColors = publishedProductsForOptions.flatMap((p) =>
          (p as any).variants ? ((p as any).variants as any[]).map((v) => v.color) : [],
        );
        return Array.from(new Set(allColors)).filter(Boolean).sort() as string[];
      }
      default: return [];
    }
  }, [publishedProductsForOptions, categories, language]);

  const toggleFilterOption = useCallback((filterId: string, option: string) => {
    setSelectedFilters((prev) => {
      const current = prev[filterId] || [];
      if (current.includes(option)) return { ...prev, [filterId]: current.filter((o) => o !== option) };
      return { ...prev, [filterId]: [...current, option] };
    });
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;

  const isDesktop = responsive.isDesktop && responsive.isWeb;
  const isMobile = responsive.isMobile;
  const numColumns = responsive.numColumns;

  const publishedProducts = useMemo(
    () => products.filter((p) => {
      if (p.status !== 'published' || p.price === null) return false;
      if (user?.role === 'client' && p.visibility === 'vip' && clientStatus !== 'vip') return false;
      return true;
    }),
    [products, user?.role, clientStatus],
  );

  const filteredProducts = useMemo(() => {
    let result = publishedProducts;

    if (selectedTopCategory === 'yangi') {
      result = result.filter((p) => p.isTrending);
    } else if (selectedTopCategory === 'chegirma') {
      result = result.filter((p) => p.oldPrice != null && p.oldPrice > (p.price ?? 0));
    } else if (selectedTopCategory !== 'all') {
      result = result.filter((p) => p.targetAudience === selectedTopCategory);
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if ((isDesktop ? search : localSearch).trim()) {
      const q = (isDesktop ? search : localSearch).toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.modelNumber.toLowerCase().includes(q) ||
          p.variantNumber.toLowerCase().includes(q),
      );
    }

    if ((selectedFilters['cat']?.length ?? 0) > 0) {
      result = result.filter((p) => {
        const c = categories.find((cat: any) => cat.id === p.category);
        const label = c ? ((c as any)[language] || (c as any).label || (c as any).name || p.category) : p.category;
        return selectedFilters['cat'].includes(label);
      });
    }
    if ((selectedFilters['designer']?.length ?? 0) > 0) {
      result = result.filter((p) =>
        selectedFilters['designer'].includes((p as any).brand || (p as any).designer || 'Milana Premium'),
      );
    }
    if ((selectedFilters['size']?.length ?? 0) > 0) {
      result = result.filter((p) => {
        const variants = (p as any).variants as any[] | undefined;
        return !!variants && variants.some((v) => selectedFilters['size'].includes(v.size));
      });
    }
    if ((selectedFilters['color']?.length ?? 0) > 0) {
      result = result.filter((p) => {
        const variants = (p as any).variants as any[] | undefined;
        return !!variants && variants.some((v) => selectedFilters['color'].includes(v.color));
      });
    }

    const sortedResult = [...result];
    if (activeSort === 'price_asc') {
      sortedResult.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (activeSort === 'price_desc') {
      sortedResult.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else {
      sortedResult.sort((a, b) => (b.isNew === true ? 1 : 0) - (a.isNew === true ? 1 : 0));
    }

    return sortedResult;
  }, [publishedProducts, selectedCategory, selectedTopCategory, search, localSearch, isDesktop, selectedFilters, categories, language, activeSort]);

  React.useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedCategory, selectedTopCategory, search, localSearch]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );

  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredProducts.length));
  }, [filteredProducts.length]);

  const paddedProducts = useMemo(() => {
    const data: (Product | null)[] = [...visibleProducts];
    const remainder = data.length % numColumns;
    if (remainder !== 0) {
      for (let i = 0; i < numColumns - remainder; i++) {
        data.push(null);
      }
    }
    return data;
  }, [visibleProducts, numColumns]);

  const handleImagePress = useCallback(
    (product: Product) => {
      router.push(`/product/${product.id}` as any);
    },
    [router],
  );

  const handleQuickViewClose = useCallback(() => {
    setQuickViewVisible(false);
    setQuickViewProduct(null);
  }, []);

  const handleSimilar = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
    },
    [setSelectedCategory],
  );

  const handleNavigateHome = useCallback(() => {
    goHome();
  }, [goHome]);

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return (t('navCatalog') ?? 'KATALOG').toUpperCase();
    const c = categories.find((cat: any) => cat.id === selectedCategory);
    if (!c) return selectedCategory.toUpperCase();

    const fallback = (c as any)[language] || (c as any).label || (c as any).name || selectedCategory;
    return String(fallback).toUpperCase();
  }, [selectedCategory, categories, language, t]);

  const departmentLabel = useMemo(() => {
    if (selectedTopCategory === 'erkaklar' || activeDepartment === 'men') return t('navMen');
    if (selectedTopCategory === 'ayollar' || activeDepartment === 'women') return t('navWomen');
    if (selectedTopCategory === 'bolalar' || activeDepartment === 'kids') return t('navKids');
    return '';
  }, [selectedTopCategory, activeDepartment, t]);

  const visualSubItems = useMemo(() => {
    if (selectedCategory === 'all') {
      const topLevel = categories.filter((c) => !(c as unknown as { parentId?: string }).parentId);
      return (topLevel.length > 0 ? topLevel : categories).slice(0, 4);
    }
    const subCats = categories.filter(
      (c) => (c as unknown as { parentId?: string }).parentId === selectedCategory,
    );
    return subCats.slice(0, 4);
  }, [categories, selectedCategory]);

  const renderItem = useCallback(
    ({ item }: { item: Product | null }) => {
      if (!item) {
        return <View style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop, isMobile && styles.cardWrapperMobile]} />;
      }
      return (
        <View style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop, isMobile && styles.cardWrapperMobile]}>
          <CatalogCard
            product={item}
            quantity={getQuantity(item.id)}
            language={language}
            categories={categories}
            onImagePress={() => handleImagePress(item)}
            onAdd={() => addToCart(item.id)}
            onRemove={() => removeFromCart(item.id)}
            isFavorite={isFavorite(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            href={`/product/${item.id}`}
          />
        </View>
      );
    },
    [language, categories, getQuantity, handleImagePress, addToCart, removeFromCart, isDesktop, isMobile, isFavorite, toggleFavorite],
  );

  const keyExtractor = useCallback(
    (item: Product | null, index: number) => item?.id ?? `spacer-${index}`,
    [],
  );

  const catalogListHeader = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <View style={{ width: '100%', maxWidth: CATALOG_CONTENT_WIDTH, alignSelf: 'center' }}>
        {/* Breadcrumbs */}
        <View style={styles.breadcrumbs}>
          <Pressable onPress={handleNavigateHome} testID="breadcrumb-home">
            <Text style={styles.crumbLink}>{t('breadcrumbHome') ?? 'Bosh sahifa'}</Text>
          </Pressable>
          {departmentLabel ? (
            <>
              <ChevronRight size={11} color="#BBBBBB" strokeWidth={1.3} />
              <Text style={styles.crumbLink}>{departmentLabel}</Text>
            </>
          ) : null}
          <ChevronRight size={11} color="#BBBBBB" strokeWidth={1.3} />
          <Text style={styles.crumbActive}>{activeCategoryLabel}</Text>
        </View>

        {/* Main title */}
        <View style={styles.titleBlock}>
          <Text style={[styles.mainTitle, isMobile && styles.mainTitleMobile]}>
            {activeCategoryLabel}
          </Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* Visual sub-category navigation (Women only) */}
        {activeDepartment === 'women' && visualSubItems.length > 0 && (
          <View style={styles.visualNavContainer}>
            <ScrollView
              horizontal={isMobile}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.visualNavRow,
                isMobile && styles.visualNavRowMobile,
              ]}
            >
              {visualSubItems.map((cat, idx) => {
                const isActive = selectedCategory === cat.id;
                const displayLabel = (cat as any)[language] || (cat as any).label || (cat as any).name || cat.id;
                return (
                  <Link
                    key={`visual-${cat.id}-${idx}`}
                    href={{ pathname: '/(tabs)/catalog', params: { segment: activeDepartment, category: cat.id } } as any}
                    asChild
                  >
                    <Pressable
                      style={StyleSheet.flatten([styles.visualNavItem, isMobile && styles.visualNavItemMobile])}
                      testID={`visual-nav-${cat.id}`}
                      accessibilityRole="link"
                    >
                      <View style={StyleSheet.flatten([styles.visualImageBox, isActive && styles.visualImageBoxActive])}>
                        <Image
                          source={{ uri: VISUAL_SUB_IMAGES[cat.id] ?? VISUAL_SUB_IMAGES.all }}
                          style={styles.visualImage}
                          contentFit="cover"
                          transition={0}
                          accessibilityRole="image"
                          alt={displayLabel}
                        />
                      </View>
                      <Text style={StyleSheet.flatten([styles.visualNavLabel, isActive && styles.visualNavLabelActive])}>
                        {displayLabel}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </ScrollView>
          </View>
        )}
        </View>

        {/* Filter & Sort Toolbar (100% Width Background/Borders) */}
        <View style={[styles.toolbar, { zIndex: 100, elevation: 10 }]}>
          {openFilter !== null && (
            <Pressable
              style={styles.dropdownOverlay}
              onPress={() => setOpenFilter(null)}
              testID="dropdown-overlay"
            />
          )}
          <View style={[styles.toolbarScroll, { width: '100%', maxWidth: 1440, alignSelf: 'center', paddingHorizontal: isDesktop ? 30 : 16, position: 'relative', zIndex: 100 }]}>
            <View style={styles.toolbarLeft}>
              {[
                { id: 'cat', label: t('filterCategory') ?? 'Categories' },
                { id: 'designer', label: t('filterDesigner') ?? 'Designer' },
                { id: 'size', label: t('filterSize') ?? 'Size' },
                { id: 'color', label: t('filterColor') ?? 'Color' },
              ].map((f) => {
                const isOpen = openFilter === f.id;
                return (
                  <View key={f.id} style={{ position: 'relative', zIndex: isOpen ? 100 : 1 }}>
                    <Pressable
                      onPress={() => setOpenFilter(isOpen ? null : f.id)}
                      style={StyleSheet.flatten([styles.filterDropdown, isOpen && styles.filterDropdownOpen])}
                      testID={`filter-${f.id}`}
                    >
                      <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                        <ChevronDown
                          size={14}
                          color={isOpen ? '#000000' : '#757575'}
                          strokeWidth={1.5}
                        />
                      </View>
                      <Text style={StyleSheet.flatten([styles.filterDropdownText, isOpen && styles.filterDropdownTextOpen])}>{f.label}</Text>
                    </Pressable>

                    {isOpen && (
                      <View style={styles.dropdownPanel}>
                        {getFilterOptions(f.id).map((opt, i) => {
                          const isSelected = (selectedFilters[f.id] || []).includes(opt);
                          return (
                            <Pressable key={i} style={styles.dropdownOption} onPress={() => toggleFilterOption(f.id, opt)} testID={`filter-${f.id}-opt-${i}`}>
                              <View style={StyleSheet.flatten([styles.dropdownCheckbox, isSelected && styles.dropdownCheckboxActive])}>
                                {isSelected && <View style={styles.dropdownCheckboxInner} />}
                              </View>
                              <Text style={styles.dropdownOptionText}>{opt}</Text>
                            </Pressable>
                          );
                        })}
                        <View style={styles.dropdownActions}>
                          <Pressable style={styles.applyBtn} onPress={() => setOpenFilter(null)}>
                            <Text style={styles.applyBtnText}>{(t('apply') ?? 'APPLY').toUpperCase()}</Text>
                          </Pressable>
                          <Pressable
                            style={StyleSheet.flatten([styles.applyBtn, { backgroundColor: '#F5F5F5', marginTop: 8 }])}
                            onPress={() => setSelectedFilters((prev) => ({ ...prev, [f.id]: [] }))}
                          >
                            <Text style={StyleSheet.flatten([styles.applyBtnText, { color: '#000000' }])}>{(t('clear') ?? 'CLEAR').toUpperCase()}</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            <View style={styles.toolbarRight}>
              <Text style={styles.productCountText}>
                {filteredProducts.length} {t('productCountSuffix') ?? 'Products'}
              </Text>
              <View style={{ position: 'relative', zIndex: openFilter === 'sort' ? 100 : 1 }}>
                <Pressable
                  onPress={() => setOpenFilter(openFilter === 'sort' ? null : 'sort')}
                  style={StyleSheet.flatten([styles.sortDropdown, openFilter === 'sort' && styles.filterDropdownOpen])}
                  testID="filter-sort"
                >
                  <View style={{ transform: [{ rotate: openFilter === 'sort' ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={14} color={openFilter === 'sort' ? '#000000' : '#757575'} strokeWidth={1.5} />
                  </View>
                  <Text style={StyleSheet.flatten([styles.sortDropdownText, openFilter === 'sort' && styles.filterDropdownTextOpen])}>
                    {t('sortLabel') ?? 'Sort by'}
                  </Text>
                </Pressable>

                {openFilter === 'sort' && (
                  <View style={styles.sortDropdownPanel}>
                    {[
                      { id: 'new', label: t('sortNewest') ?? 'New arrivals' },
                      { id: 'price_asc', label: t('sortPriceAsc') ?? 'Price (low-high)' },
                      { id: 'price_desc', label: t('sortPriceDesc') ?? 'Price (high-low)' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.id}
                        style={styles.sortOption}
                        onPress={() => {
                          setActiveSort(opt.id);
                          setOpenFilter(null);
                        }}
                        testID={`sort-opt-${opt.id}`}
                      >
                        <Text style={StyleSheet.flatten([
                          styles.sortOptionText,
                          activeSort === opt.id && styles.sortOptionTextActive,
                        ])}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
    [
      activeCategoryLabel,
      activeDepartment,
      departmentLabel,
      filteredProducts.length,
      handleNavigateHome,
      isMobile,
      language,
      selectedCategory,
      setSelectedCategory,
      t,
      visualSubItems,
      openFilter,
      selectedFilters,
      getFilterOptions,
      toggleFilterOption,
      activeSort,
    ],
  );

  return (
    <View style={styles.container}>
      <WebHeader
        scrollY={scrollY}
        search={search}
        onSearchChange={(text) => { setSearch(text); enterCatalog(); }}
        onNavigateHome={handleNavigateHome}
        onLogoPress={handleNavigateHome}
        onMenuPress={() => {}}
        onCartPress={() => router.push('/(tabs)/cart')}
        onOrdersPress={() => router.push('/(tabs)/orders')}
        onProfilePress={() => router.push('/(tabs)/settings')}
        onFavoritesPress={() => router.push('/(tabs)/favorites')}
      />
      <MobileHeader />
      {!showCatalog ? (
        activeDepartment === 'men' ? (
          <MensEditorialShowroom headerOffset={Platform.OS === 'web' ? TOTAL_HEADER_HEIGHT : 0} />
        ) : activeDepartment === 'kids' ? (
          <KidsEditorialShowroom headerOffset={Platform.OS === 'web' ? TOTAL_HEADER_HEIGHT : 0} />
        ) : (
          <EditorialShowroom headerOffset={Platform.OS === 'web' ? TOTAL_HEADER_HEIGHT : 0} />
        )
      ) : (
        <Animated.FlatList
          data={paddedProducts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          key={`grid-${numColumns}`}
          columnWrapperStyle={numColumns > 1 ? { width: '100%', maxWidth: CATALOG_CONTENT_WIDTH, alignSelf: 'center', paddingHorizontal: 15 } : undefined}
          ListHeaderComponent={catalogListHeader}
          ListHeaderComponentStyle={{ zIndex: 9999, elevation: 1000 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          contentContainerStyle={styles.listContent}
          scrollEventThrottle={16}
          style={{ flex: 1, width: '100%' }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={12}
          windowSize={5}
          initialNumToRender={numColumns * 5}
          updateCellsBatchingPeriod={50}
          getItemLayout={undefined}
          ListEmptyComponent={
            <EmptyState
              icon={<LayoutGrid size={48} color="#CCCCCC" />}
              title={t('noProducts')}
            />
          }
          ListFooterComponent={
            <View>
              {hasMore && (
                <View style={styles.loadMoreContainer}>
                  <Text style={styles.loadMoreCount}>
                    {visibleProducts.length} / {filteredProducts.length}
                  </Text>
                  <Pressable
                    onPress={handleLoadMore}
                    style={({ pressed }) => [
                      styles.loadMoreBtn,
                      pressed && styles.loadMoreBtnPressed,
                    ]}
                    testID="catalog-load-more"
                  >
                    <Text style={styles.loadMoreText}>LOAD MORE</Text>
                  </Pressable>
                </View>
              )}
              {!hasMore && filteredProducts.length > 0 && (
                <View style={styles.endOfListContainer}>
                  <Text style={styles.endOfListText}>
                    {filteredProducts.length} {t('products').toLowerCase()}
                  </Text>
                </View>
              )}
              <BrandPreFooter />
              <GlobalFooter />
            </View>
          }
        />
      )}
      <QuickViewModal
        visible={quickViewVisible}
        product={quickViewProduct}
        language={language}
        categories={categories}
        quantity={quickViewProduct ? getQuantity(quickViewProduct.id) : 0}
        isFavorite={quickViewProduct ? isFavorite(quickViewProduct.id) : false}
        onClose={handleQuickViewClose}
        onAdd={() => quickViewProduct && addToCart(quickViewProduct.id)}
        onRemove={() => quickViewProduct && removeFromCart(quickViewProduct.id)}
        onToggleFavorite={() => quickViewProduct && toggleFavorite(quickViewProduct.id)}
        onSimilar={handleSimilar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    width: '100%',
    paddingTop: Platform.OS === 'web' ? TOTAL_HEADER_HEIGHT : 0,
    paddingBottom: 0,
    overflow: 'visible' as any,
    flexGrow: 1,
  },
  headerWrap: {
    width: '100%',
    zIndex: 100,
    elevation: 10,
  },

  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 30,
    paddingTop: 32,
    paddingBottom: 8,
  },
  crumbLink: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  crumbActive: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },

  titleBlock: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 48,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '300' as const,
    color: '#000000',
    letterSpacing: 8,
    textAlign: 'center',
    textTransform: 'uppercase' as const,
  },
  mainTitleMobile: {
    fontSize: 26,
    letterSpacing: 5,
  },
  titleUnderline: {
    width: 32,
    height: 1,
    backgroundColor: '#000000',
    marginTop: 20,
  },

  visualNavContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 48,
  },
  visualNavRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  visualNavRowMobile: {
    paddingRight: 24,
    gap: 12,
  },
  visualNavItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  visualNavItemMobile: {
    flex: 0,
    width: 150,
  },
  visualImageBox: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden' as const,
    marginBottom: 12,
  },
  visualImageBoxActive: {},
  visualImage: {
    width: '100%',
    height: '100%',
  },
  visualNavLabel: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#555555',
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase' as const,
  },
  visualNavLabelActive: {
    color: '#000000',
    fontWeight: '600' as const,
  },

  toolbar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    elevation: 10,
    ...(Platform.OS === 'web' ? {
      position: 'sticky' as any,
      top: 108,
    } : {}),
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flex: 1,
    height: 50,
    paddingHorizontal: 0,
    overflow: 'visible' as any,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: -12,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    marginRight: -12,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 50,
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 50,
  },
  filterDropdownPressed: {
    opacity: 0.6,
  },
  filterDropdownText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#757575',
    marginLeft: 5,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      default: 'sans-serif',
    }),
  },
  productCountText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      default: 'sans-serif',
    }),
  },
  sortDropdownText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
    marginLeft: 5,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      default: 'sans-serif',
    }),
  },
  filterDropdownOpen: {
    backgroundColor: '#F5F5F5',
    height: 51,
    marginBottom: -1,
  },
  filterDropdownTextOpen: {
    color: '#000000',
  },
  dropdownPanel: {
    position: 'absolute',
    top: 51,
    left: 12,
    width: 260,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E5E5E5',
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 99,
    zIndex: 9999,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dropdownCheckbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#999999',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownCheckboxActive: {
    borderColor: '#000000',
  },
  dropdownCheckboxInner: {
    width: 8,
    height: 8,
    backgroundColor: '#000000',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '400' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      default: 'sans-serif',
    }),
  },
  dropdownActions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 20,
  },
  applyBtn: {
    backgroundColor: '#999999',
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  dropdownOverlay: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: Platform.OS === 'web' ? 0 : -5000,
    left: Platform.OS === 'web' ? 0 : -5000,
    right: Platform.OS === 'web' ? 0 : -5000,
    bottom: Platform.OS === 'web' ? 0 : -5000,
    backgroundColor: 'transparent',
    zIndex: 90,
    ...(Platform.OS === 'web' ? ({ cursor: 'default' } as any) : {}),
  },
  sortDropdownPanel: {
    position: 'absolute',
    top: 51,
    right: 12,
    width: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E5E5E5',
    paddingVertical: 16,
    paddingHorizontal: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 99,
    zIndex: 9999,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  sortOptionText: {
    fontSize: 13,
    color: '#777777',
    fontWeight: '400' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      default: 'sans-serif',
    }),
  },
  sortOptionTextActive: {
    color: '#000000',
    fontWeight: '500' as const,
  },

  cardWrapper: {
    flex: 1,
    padding: 6,
  },
  cardWrapperDesktop: {
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  cardWrapperMobile: {
    padding: 4,
  },
  loadMoreContainer: {
    alignItems: 'center' as const,
    paddingVertical: 48,
    gap: 16,
  },
  loadMoreCount: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '400' as const,
    letterSpacing: 1,
  },
  loadMoreBtn: {
    paddingHorizontal: 56,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: 'transparent',
  },
  loadMoreBtnPressed: {
    backgroundColor: '#000000',
  },
  loadMoreText: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#000000',
    letterSpacing: 3,
  },
  endOfListContainer: {
    alignItems: 'center' as const,
    paddingVertical: 32,
  },
  endOfListText: {
    fontSize: 11,
    color: '#CCCCCC',
    fontWeight: '400' as const,
    letterSpacing: 1,
  },
});
