import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, ArrowRight, Search, ChevronDown, Check, Package, Truck, Shirt } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCategories } from '@/contexts/CategoriesContext';
import CatalogCard from '@/components/CatalogCard';
import QuickViewModal from '@/components/QuickViewModal';
import { Product } from '@/types';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import WebHeader, { TOTAL_HEADER_HEIGHT } from '@/components/WebHeader';
import MobileHeader from '@/components/MobileHeader';
import { MOBILE_HEADER_HEIGHT } from '@/components/MobileHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { useResponsive } from '@/hooks/useResponsive';

function RecommendationsGrid({
  products,
  language,
  categories,
  getQuantity,
  addToCart,
  removeFromCart,
  isFavorite,
  toggleFavorite,
  onImagePress,
  isDesktop,
}: {
  products: Product[];
  language: 'uz' | 'ru';
  categories: any[];
  getQuantity: (id: string) => number;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  onImagePress: (p: Product) => void;
  isDesktop: boolean;
}) {
  const numColumns = isDesktop ? 5 : 2;
  const displayProducts = useMemo(() => {
    const sliced = products.slice(0, numColumns);
    const data: (Product | null)[] = [...sliced];
    const remainder = data.length % numColumns;
    if (remainder !== 0) {
      for (let i = 0; i < numColumns - remainder; i++) data.push(null);
    }
    return data;
  }, [products, numColumns]);

  return (
    <View style={[recsStyles.recsGrid, isDesktop && recsStyles.recsGridDesktop]}>
      {displayProducts.map((item, idx) => (
        <View key={item?.id ?? `spacer-${idx}`} style={[recsStyles.cardWrapper, isDesktop && recsStyles.cardWrapperDesktop, { width: `${100 / numColumns}%` as any }]}>
          {item ? (
            <CatalogCard
              product={item}
              quantity={getQuantity(item.id)}
              language={language}
              categories={categories}
              onImagePress={() => onImagePress(item)}
              onAdd={() => addToCart(item.id)}
              onRemove={() => removeFromCart(item.id)}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              href={`/product/${item.id}`}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

type SortOption = 'date' | 'price_asc' | 'price_desc';

const SORT_KEYS: Record<SortOption, string> = {
  date: 'sortByDate',
  price_asc: 'sortPriceAsc',
  price_desc: 'sortPriceDesc',
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { language, t, user } = useAuth();
  const { search, setSearch, setSelectedCategory } = useWebHeader();
  const { products } = useProducts();
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { categories } = useCategories();

  const responsive = useResponsive();
  const isDesktop = responsive.isWebDesktop;
  const isWebMobile = responsive.isWebMobile;
  const numColumns = responsive.numColumns;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);

  const favoriteProducts = useMemo(
    () => products.filter((p) => favoriteIds.includes(p.id) && p.status === 'published' && p.price !== null),
    [products, favoriteIds],
  );

  const filteredFavorites = useMemo(() => {
    let result = [...favoriteProducts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.modelNumber.toLowerCase().includes(q) ||
          p.variantNumber.toLowerCase().includes(q) ||
          (categories.find((c) => c.id === p.category)?.[language] ?? '').toLowerCase().includes(q),
      );
    }

    if (inStockOnly) {
      result = result.filter((p) => p.status === 'published');
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }

    return result;
  }, [favoriteProducts, searchQuery, sortBy, inStockOnly, language, categories]);

  const paddedFavorites = useMemo(() => {
    const data: (Product | null)[] = [...filteredFavorites];
    const remainder = data.length % numColumns;
    if (remainder !== 0) {
      for (let i = 0; i < numColumns - remainder; i++) data.push(null);
    }
    return data;
  }, [filteredFavorites, numColumns]);

  const recommendations = useMemo(
    () => products
      .filter((p) => p.status === 'published' && p.price !== null && !favoriteIds.includes(p.id))
      .slice(0, isDesktop ? 5 : 6),
    [products, favoriteIds, isDesktop],
  );

  const handleImagePress = useCallback(
    (product: Product) => {
      console.log('[Favorites] Quick view opened for:', product.modelNumber);
      setQuickViewProduct(product);
      setQuickViewVisible(true);
    },
    [],
  );

  const handleQuickViewClose = useCallback(() => {
    setQuickViewVisible(false);
    setQuickViewProduct(null);
  }, []);

  const handleSimilar = useCallback(
    (categoryId: string) => {
      console.log('[Favorites] Navigate to catalog with category:', categoryId);
      setSelectedCategory(categoryId);
      router.push('/(tabs)/catalog' as any);
    },
    [router, setSelectedCategory],
  );

  const hasFavorites = favoriteProducts.length > 0;

  return (
    <View style={styles.container}>
      <WebHeader
        search={search}
        onSearchChange={setSearch}
        onNavigateHome={() => router.push('/(tabs)/catalog')}
        onMenuPress={() => {}}
        onCartPress={() => router.push('/(tabs)/cart')}
        onOrdersPress={() => router.push('/(tabs)/orders')}
        onProfilePress={() => router.push('/(tabs)/settings')}
        onFavoritesPress={() => router.push('/(tabs)/favorites')}
      />
      <MobileHeader />
      <ScrollView
        contentContainerStyle={[styles.scrollContentOuter, isWebMobile && { paddingTop: MOBILE_HEADER_HEIGHT, paddingBottom: 70 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.scrollContentInner, isDesktop && styles.scrollContentInnerDesktop]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {language === 'ru' ? 'Мой список желаний' : language === 'uz' ? "Mening xohishlarim ro'yxati" : 'My Wishlist'}
          </Text>
          {!user && (
            <View style={styles.authPromptBox}>
              <Text style={styles.authPromptText}>
                {language === 'ru'
                  ? 'Создайте учётную запись, чтобы сохранять товары в списке желаний и узнавать о новинках первыми.'
                  : language === 'uz'
                  ? "Siz o'zingizning xohishlar ro'yxatingizga narsalarni saqlash va yangi kelgan mahsulotlarimizdan xabardor bo'lish uchun hisob yaratishingiz mumkin."
                  : 'Create an account to save items to your wishlist and be the first to hear about new arrivals.'}
              </Text>
              <Pressable
                style={styles.authBtn}
                onPress={() => router.push('/register' as any)}
                testID="favorites-register-btn"
              >
                <Text style={styles.authBtnText}>
                  {language === 'ru' ? 'РЕГИСТРАЦИЯ' : language === 'uz' ? "RO'YXATDAN O'TISH" : 'REGISTER'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        <View style={styles.breadcrumbContainer}>
          <Pressable onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.breadcrumbInactive}>{t('mainPage')}</Text>
          </Pressable>
          <Text style={styles.breadcrumbSeparator}> — </Text>
          <Text style={styles.breadcrumbActive}>{t('favorites')}</Text>
        </View>
        {!hasFavorites ? (
          <>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Heart size={120} color="#D4D4D4" strokeWidth={0.8} />
              </View>
              <Text style={styles.emptyTitle}>
                {t('emptyFavTitle')}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('emptyFavSubtext')}
              </Text>
            </View>
            {recommendations.length > 0 && (
              <View style={styles.recsSection}>
                <Text style={styles.recsTitle}>{t('recommendedForYou')}</Text>
                <RecommendationsGrid
                  products={recommendations}
                  language={language}
                  categories={categories}
                  getQuantity={getQuantity}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  isFavorite={isFavorite}
                  toggleFavorite={toggleFavorite}
                  onImagePress={handleImagePress}
                  isDesktop={isDesktop}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <View style={[styles.toolbar, !isDesktop && styles.toolbarMobile]}>
              <View style={styles.toolbarLeft}>
                <View style={styles.sortDropdownWrap}>
                  <Pressable
                    style={styles.sortDropdownBtn}
                    onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
                    testID="favorites-sort-btn"
                  >
                    <Text style={styles.sortDropdownText} numberOfLines={1}>
                      {t(SORT_KEYS[sortBy])}
                    </Text>
                    <ChevronDown
                      size={14}
                      color="#666"
                      strokeWidth={2}
                      style={sortDropdownOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
                    />
                  </Pressable>
                  {sortDropdownOpen && (
                    <View style={styles.sortDropdownMenu}>
                      {(Object.keys(SORT_KEYS) as SortOption[]).map((key) => (
                        <Pressable
                          key={key}
                          style={[styles.sortDropdownItem, sortBy === key && styles.sortDropdownItemActive]}
                          onPress={() => {
                            setSortBy(key);
                            setSortDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.sortDropdownItemText, sortBy === key && styles.sortDropdownItemTextActive]}>
                            {t(SORT_KEYS[key])}
                          </Text>
                          {sortBy === key && <Check size={14} color="#223c63" strokeWidth={2.5} />}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setInStockOnly(!inStockOnly)}
                  testID="favorites-in-stock"
                >
                  <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
                    {inStockOnly && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{t('inStock')}</Text>
                </Pressable>
              </View>

              <View style={styles.toolbarRight}>
                <View style={styles.searchBar}>
                  <Search size={16} color="#999" strokeWidth={2} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('searchByNameSku')}
                    placeholderTextColor="#BBBBBB"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    testID="favorites-search"
                  />
                </View>
              </View>
            </View>

            {sortDropdownOpen && (
              <Pressable
                style={styles.dropdownOverlay}
                onPress={() => setSortDropdownOpen(false)}
              />
            )}

            <View style={styles.favGrid}>
              {paddedFavorites.map((item, idx) => (
                <View
                  key={item?.id ?? `spacer-${idx}`}
                  style={[
                    styles.cardWrapper,
                    isDesktop && styles.cardWrapperDesktop,
                    { width: `${100 / numColumns}%` as any },
                  ]}
                >
                  {item ? (
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
                  ) : null}
                </View>
              ))}
            </View>

            {filteredFavorites.length === 0 && (
              <View style={styles.noResultsWrap}>
                <Text style={styles.noResultsText}>{t('nothingFound')}</Text>
              </View>
            )}

            {recommendations.length > 0 && (
              <View style={styles.recsSection}>
                <Text style={styles.recsTitle}>{t('recommendedForYou')}</Text>
                <RecommendationsGrid
                  products={recommendations}
                  language={language}
                  categories={categories}
                  getQuantity={getQuantity}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  isFavorite={isFavorite}
                  toggleFavorite={toggleFavorite}
                  onImagePress={handleImagePress}
                  isDesktop={isDesktop}
                />
              </View>
            )}
          </>
        )}
        </View>

        {/* Luxury Editorial Cross-Sell */}
        <View style={styles.editorialSection}>
          <View style={[styles.editorialRow, !isDesktop && styles.editorialRowMobile]}>
            <Pressable style={styles.editorialBanner} testID="favorites-editorial-1">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop' }}
                style={styles.editorialBg}
                contentFit="cover"
              />
              <View style={styles.editorialOverlay}>
                <Text style={styles.editorialTitle}>Trenddagi sumkalar</Text>
                <View style={styles.editorialBtn}>
                  <Text style={styles.editorialBtnText}>HOZIR XARID QILING</Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={styles.editorialBanner} testID="favorites-editorial-2">
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1000&auto=format&fit=crop' }}
                style={styles.editorialBg}
                contentFit="cover"
              />
              <View style={styles.editorialOverlay}>
                <Text style={styles.editorialTitle}>Bayram liboslari</Text>
                <View style={styles.editorialBtn}>
                  <Text style={styles.editorialBtnText}>HOZIR XARID QILING</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.trustSection}>
          <View style={styles.trustVerticalLine} />
          <Text style={styles.trustBrandTitle}>MILANA PREMIUM</Text>
          <Text style={styles.trustPhilosophyText}>
            Biz faqat eng sifatli tabiiy materiallardan — paxta, viskoza, ipak va bambuk tolasidan — tikish uchun foydalanamiz. Har bir kiyim nafisligi, qulayligi va uzoq muddat xizmat qilishi bilan ajralib turadi. Milana Premium — bu sizning kundalik hayotingizga hashamat olib keluvchi brend.
          </Text>
          <Text style={styles.trustPhilosophyText}>
            Мы используем только лучшие натуральные материалы — хлопок, вискозу, шёлк и бамбуковое волокно. Каждое изделие отличается утончённостью, комфортом и долговечностью. Milana Premium — бренд, привносящий роскошь в вашу повседневную жизнь.
          </Text>

          <View style={[styles.trustFeaturesRow, !isDesktop && styles.trustFeaturesRowMobile]}>
            <View style={styles.trustFeatureItem}>
              <Shirt size={32} color="#000000" strokeWidth={1} style={{ marginBottom: 16 }} />
              <Text style={styles.trustFeatureTitle}>EKSKLYUZIV DIZAYN</Text>
              <Text style={styles.trustFeatureDesc}>Xaridor istagiga ko&apos;ra individual modellar yaratish va premium darajada tikish xizmati.</Text>
            </View>
            <View style={styles.trustFeatureItem}>
              <Package size={32} color="#000000" strokeWidth={1} style={{ marginBottom: 16 }} />
              <Text style={styles.trustFeatureTitle}>ULGURJI HAMKORLIK</Text>
              <Text style={styles.trustFeatureDesc}>Biznesingiz uchun yuqori sifatli kiyimlarni eng qulay shartlarda yetkazib berish.</Text>
            </View>
            <View style={styles.trustFeatureItem}>
              <Truck size={32} color="#000000" strokeWidth={1} style={{ marginBottom: 16 }} />
              <Text style={styles.trustFeatureTitle}>MDH BO&apos;YLAB LOGISTIKA</Text>
              <Text style={styles.trustFeatureDesc}>Har qanday davlatga ishonchli, tezkor va xavfsiz yetkazib berish kafolati.</Text>
            </View>
          </View>
        </View>

        <GlobalFooter />
      </ScrollView>
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

const recsStyles = StyleSheet.create({
  recsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recsGridDesktop: {
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardWrapper: {
    padding: 2,
  },
  cardWrapperDesktop: {
    padding: 0,
    flex: 1,
  },
});

const LUXURY_FONT = Platform.select({
  web: 'Futura, "Futura-Medium", sans-serif',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pageHeader: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '500' as const,
    color: '#000000',
    marginBottom: 16,
    fontFamily: LUXURY_FONT,
    textAlign: 'center' as const,
  },
  authPromptBox: {
    alignItems: 'center',
    maxWidth: 600,
  },
  authPromptText: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: LUXURY_FONT,
  },
  authBtn: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  authBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    fontFamily: LUXURY_FONT,
  },
  editorialSection: {
    width: '100%',
    maxWidth: 1380,
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginTop: 60,
    marginBottom: 60,
  },
  editorialRow: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
  },
  editorialRowMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  editorialBanner: {
    flex: 1,
    height: 362,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  editorialBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  editorialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  editorialTitle: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center' as const,
    letterSpacing: 1,
    fontFamily: LUXURY_FONT,
  },
  editorialBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  editorialBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    fontFamily: LUXURY_FONT,
  },
  trustSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  trustVerticalLine: {
    width: 1,
    height: 40,
    backgroundColor: '#D4D4D4',
    marginBottom: 24,
  },
  trustBrandTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 4,
    color: '#000000',
    marginBottom: 24,
    fontFamily: LUXURY_FONT,
  },
  trustPhilosophyText: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 800,
    fontFamily: LUXURY_FONT,
  },
  trustFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 60,
    gap: 40,
  },
  trustFeaturesRowMobile: {
    flexDirection: 'column',
    gap: 48,
  },
  trustFeatureItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustFeatureTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center' as const,
    fontFamily: LUXURY_FONT,
  },
  trustFeatureDesc: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center' as const,
    lineHeight: 20,
    fontFamily: LUXURY_FONT,
  },
  scrollContentOuter: {
    paddingBottom: 0,
    flexGrow: 1,
  },
  scrollContentInner: {
    paddingHorizontal: 6,
    paddingBottom: 40,
  },
  scrollContentInnerDesktop: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  toolbarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  sortDropdownWrap: {
    position: 'relative',
    zIndex: 200,
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortDropdownText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#333',
    maxWidth: 200,
  },
  sortDropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 300,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8E8E8',
  },
  sortDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sortDropdownItemActive: {
    backgroundColor: '#F0F3F7',
  },
  sortDropdownItemText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#333',
  },
  sortDropdownItemTextActive: {
    fontWeight: '600' as const,
    color: '#000000',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#555',
  },
  toolbarRight: {
    flex: 1,
    minWidth: 180,
    ...(Platform.OS === 'web' ? { maxWidth: 400 } : {}),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  dropdownOverlay: {
    ...(Platform.OS === 'web'
      ? { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }
      : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }),
  },
  favGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  cardWrapper: {
    padding: 4,
  },
  cardWrapperDesktop: {
    padding: 9,
  },
  noResultsWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#999',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  breadcrumbInactive: {
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '400' as const,
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#D0D0D0',
    marginHorizontal: 8,
  },
  breadcrumbActive: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 0,
    paddingHorizontal: 32,
    marginBottom: 80,
  },
  emptyIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    fontStyle: 'normal' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
    marginTop: 24,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontStyle: 'normal' as const,
    color: '#777777',
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 400,
    marginTop: 12,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 0,
    paddingVertical: 15,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyBtnText: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  recsSection: {
    paddingTop: 48,
    paddingHorizontal: 4,
    marginTop: 0,
    paddingBottom: 60,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
  },
  recsTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 24,
    paddingHorizontal: 8,
    letterSpacing: -0.3,
  },
});
