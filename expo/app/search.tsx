import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutGrid, Search, ChevronRight } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useClients } from '@/contexts/ClientsContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import CatalogCard from '@/components/CatalogCard';
import EmptyState from '@/components/EmptyState';
import QuickViewModal from '@/components/QuickViewModal';
import WebHeader, { TOTAL_HEADER_HEIGHT } from '@/components/WebHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { Product } from '@/types';
import { BREAKPOINTS } from '@/hooks/useResponsive';

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const { language, t, user } = useAuth();
  const { products } = useProducts();
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { categories } = useCategories();
  const { getClientById } = useClients();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { search, setSearch } = useWebHeader();
  const router = useRouter();

  const clientProfile = user?.role === 'client' && user ? getClientById(user.id) : null;
  const clientStatus = clientProfile?.clientStatus ?? 'standard';

  const [localSearchInput, setLocalSearchInput] = useState(search);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);

  const isDesktop = Platform.OS === 'web' && width >= BREAKPOINTS.mobile;
  const numColumns = width >= BREAKPOINTS.tablet ? 4 : isDesktop ? 3 : 2;

  const publishedProducts = useMemo(
    () =>
      products.filter((p) => {
        if (p.status !== 'published' || p.price === null) return false;
        if (user?.role === 'client' && p.visibility === 'vip' && clientStatus !== 'vip') return false;
        return true;
      }),
    [products, user?.role, clientStatus],
  );

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return publishedProducts;
    return publishedProducts.filter(
      (p) =>
        p.modelNumber.toLowerCase().includes(q) ||
        p.variantNumber.toLowerCase().includes(q),
    );
  }, [publishedProducts, search]);

  const paddedProducts = useMemo(() => {
    const data: (Product | null)[] = [...filteredProducts];
    const remainder = data.length % numColumns;
    if (remainder !== 0) {
      for (let i = 0; i < numColumns - remainder; i++) {
        data.push(null);
      }
    }
    return data;
  }, [filteredProducts, numColumns]);

  const handleImagePress = useCallback((product: Product) => {
    console.log('[Search] Quick view opened for:', product.modelNumber);
    setQuickViewProduct(product);
    setQuickViewVisible(true);
  }, []);

  const handleQuickViewClose = useCallback(() => {
    setQuickViewVisible(false);
    setQuickViewProduct(null);
  }, []);

  const handleInlineSearch = useCallback(() => {
    const trimmed = localSearchInput.trim();
    if (trimmed.length > 0) {
      setSearch(trimmed);
      console.log('[Search] Inline search submitted:', trimmed);
    }
  }, [localSearchInput, setSearch]);

  const renderItem = useCallback(
    ({ item }: { item: Product | null }) => {
      if (!item) {
        return <View style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop]} />;
      }
      return (
        <View style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop]}>
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
    [language, categories, getQuantity, handleImagePress, addToCart, removeFromCart, isDesktop, isFavorite, toggleFavorite],
  );

  const keyExtractor = useCallback(
    (item: Product | null, index: number) => item?.id ?? `spacer-${index}`,
    [],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerOuter}>
      <View style={styles.headerSection}>
        <View style={styles.breadcrumbs}>
          <Pressable onPress={() => router.push('/(tabs)/catalog' as any)} testID="search-breadcrumb-home">
            <Text style={styles.breadcrumbLink}>{t('mainPage')}</Text>
          </Pressable>
          <ChevronRight size={14} color="#999" />
          <Text style={styles.breadcrumbCurrent}>{t('catalog')}</Text>
        </View>

        <Text style={styles.pageTitle}>{t('searchResults')}</Text>
        <Text style={styles.resultCount}>
          {t('productsFound').replace('{count}', String(filteredProducts.length))}
        </Text>

        <View style={styles.inlineSearchRow}>
          <View style={styles.inlineInputWrap}>
            <Search size={16} color="#999" strokeWidth={2} />
            <TextInput
              value={localSearchInput}
              onChangeText={(text) => { setLocalSearchInput(text); setSearch(text); }}
              placeholder={t('searchProducts')}
              placeholderTextColor="#AAAAAA"
              style={styles.inlineInput}
              onSubmitEditing={handleInlineSearch}
              returnKeyType="search"
              testID="search-inline-input"
            />
          </View>
          <Pressable
            onPress={handleInlineSearch}
            style={({ pressed }) => [styles.searchBtn, pressed && styles.searchBtnPressed]}
            testID="search-inline-btn"
          >
            <Text style={styles.searchBtnText}>
              {t('searchBtn')}
            </Text>
          </Pressable>
        </View>
      </View>
      </View>
    ),
    [filteredProducts.length, language, localSearchInput, handleInlineSearch, router],
  );

  return (
    <View style={styles.container}>
      <WebHeader
        search={search}
        onSearchChange={(text) => {
          setSearch(text);
          setLocalSearchInput(text);
        }}
        onNavigateHome={() => router.push('/(tabs)/catalog' as any)}
        onMenuPress={() => {}}
        onCartPress={() => router.push('/(tabs)/cart' as any)}
        onOrdersPress={() => router.push('/(tabs)/orders' as any)}
        onProfilePress={() => router.push('/(tabs)/settings' as any)}
        onFavoritesPress={() => router.push('/(tabs)/favorites' as any)}
      />
      <FlatList
        data={paddedProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={`search-grid-${numColumns}`}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        style={{ flex: 1, width: '100%' }}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<LayoutGrid size={48} color={Colors.textTertiary} />}
            title={t('noSearchResults')}
          />
        }
        ListFooterComponent={
          <View style={styles.footerWrapper}>
            <GlobalFooter />
          </View>
        }
      />
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
        onSimilar={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAFAFA',
  },
  listContent: {
    flexGrow: 1,
  },
  headerOuter: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 20,
  },
  columnWrapper: {
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 20,
  },
  headerSection: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  breadcrumbLink: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500' as const,
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600' as const,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  resultCount: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '400' as const,
    marginBottom: 24,
    textAlign: 'center',
  },
  inlineSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 32,
    width: '100%',
    maxWidth: 600,
  },
  inlineInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  inlineInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#1A1A1A',
    outlineStyle: 'none' as any,
  },
  searchBtn: {
    height: 48,
    paddingHorizontal: 28,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  searchBtnPressed: {
    backgroundColor: '#222222',
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardWrapper: {
    flex: 1,
    padding: 4,
  },
  cardWrapperDesktop: {
    padding: 6,
  },
  footerWrapper: {
    marginTop: 'auto' as any,
    width: '100%',
    paddingTop: 60,
  },
});
