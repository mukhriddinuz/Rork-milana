import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, ChevronDown, Package, Truck, Shirt } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCategories } from '@/contexts/CategoriesContext';
import CatalogCard from '@/components/CatalogCard';
import QuickViewModal from '@/components/QuickViewModal';
import { Product } from '@/types';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import WebHeader from '@/components/WebHeader';
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
        <View style={[styles.scrollContentInner, isDesktop && styles.scrollContentInnerDesktop, { paddingBottom: 0 }]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {language === 'ru' ? 'Мой список желаний' : language === 'uz' ? "Mening xohishlarim ro'yxati" : 'My Wishlist'}
          </Text>
          {!user && (
            <View style={styles.authPromptBox}>
              <Text style={styles.authSubtitle}>
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
        </View>
        {hasFavorites && (
          <View style={styles.toolbar}>
            {activeDropdown !== null && (
              <Pressable style={styles.dropdownOverlay} onPress={() => setActiveDropdown(null)} testID="fav-dropdown-overlay" />
            )}
            <View style={styles.toolbarScroll}>
              <View style={styles.toolbarLeft}>
                {([
                  { id: 'dept', label: language === 'ru' ? 'Отдел' : language === 'uz' ? "Bo'lim" : 'Department' },
                  { id: 'cat', label: language === 'ru' ? 'Категории' : language === 'uz' ? 'Kategoriyalar' : 'Categories' },
                  { id: 'avail', label: language === 'ru' ? 'Наличие' : language === 'uz' ? 'Mavjudlik' : 'Availability' },
                ]).map((f) => {
                  const isOpen = activeDropdown === f.id;
                  return (
                    <View key={f.id} style={{ position: 'relative', zIndex: isOpen ? 100 : 1 }}>
                      <Pressable
                        onPress={() => setActiveDropdown(isOpen ? null : f.id)}
                        style={StyleSheet.flatten([styles.filterDropdown, isOpen && styles.filterDropdownOpen])}
                      >
                        <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                          <ChevronDown size={14} color={isOpen ? '#000000' : '#757575'} strokeWidth={1.5} />
                        </View>
                        <Text style={StyleSheet.flatten([styles.filterDropdownText, isOpen && styles.filterDropdownTextOpen])}>{f.label}</Text>
                      </Pressable>

                      {isOpen && (
                        <View style={styles.dropdownPanel}>
                          <Pressable style={styles.dropdownOption} testID={`fav-${f.id}-opt-1`}>
                            <View style={styles.dropdownCheckbox} />
                            <Text style={styles.dropdownOptionText}>{language === 'ru' ? 'Вариант 1' : language === 'uz' ? 'Variant 1' : 'Option 1'}</Text>
                          </Pressable>
                          <Pressable style={styles.dropdownOption} testID={`fav-${f.id}-opt-2`}>
                            <View style={styles.dropdownCheckbox} />
                            <Text style={styles.dropdownOptionText}>{language === 'ru' ? 'Вариант 2' : language === 'uz' ? 'Variant 2' : 'Option 2'}</Text>
                          </Pressable>

                          <View style={styles.dropdownActions}>
                            <Pressable style={styles.applyBtn} onPress={() => setActiveDropdown(null)}>
                              <Text style={styles.applyBtnText}>{(language === 'ru' ? 'ПРИМЕНИТЬ' : language === 'uz' ? "QO'LLASH" : 'APPLY')}</Text>
                            </Pressable>
                            <Pressable style={StyleSheet.flatten([styles.applyBtn, { backgroundColor: '#F5F5F5', marginTop: 8 }])} onPress={() => setActiveDropdown(null)}>
                              <Text style={StyleSheet.flatten([styles.applyBtnText, { color: '#000000' }])}>{language === 'ru' ? 'СБРОСИТЬ' : language === 'uz' ? 'TOZALASH' : 'CLEAR'}</Text>
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
                  {filteredFavorites.length} {language === 'ru' ? 'товаров' : language === 'uz' ? 'ta mahsulot' : 'items'}
                </Text>
                <View style={{ position: 'relative', zIndex: activeDropdown === 'sort' ? 100 : 1 }}>
                  <Pressable
                    onPress={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                    style={StyleSheet.flatten([styles.sortDropdown, activeDropdown === 'sort' && styles.filterDropdownOpen])}
                  >
                    <View style={{ transform: [{ rotate: activeDropdown === 'sort' ? '180deg' : '0deg' }] }}>
                      <ChevronDown size={14} color={activeDropdown === 'sort' ? '#000000' : '#757575'} strokeWidth={1.5} />
                    </View>
                    <Text style={StyleSheet.flatten([styles.sortDropdownText, activeDropdown === 'sort' && styles.filterDropdownTextOpen])}>
                      {t(SORT_KEYS[sortBy])}
                    </Text>
                  </Pressable>

                  {activeDropdown === 'sort' && (
                    <View style={styles.sortDropdownPanel}>
                      {(Object.keys(SORT_KEYS) as SortOption[]).map((key) => (
                        <Pressable
                          key={key}
                          style={styles.sortOption}
                          onPress={() => { setSortBy(key); setActiveDropdown(null); }}
                        >
                          <Text style={StyleSheet.flatten([styles.sortOptionText, sortBy === key && styles.sortOptionTextActive])}>
                            {t(SORT_KEYS[key])}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
        <View style={[styles.scrollContentInner, isDesktop && styles.scrollContentInnerDesktop]}>
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
    marginTop: 180,
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '500' as const,
    color: '#000000',
    marginBottom: 24,
    fontFamily: LUXURY_FONT,
    textAlign: 'center' as const,
  },
  authPromptBox: {
    alignItems: 'center',
    maxWidth: 700,
  },
  authSubtitle: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: LUXURY_FONT,
  },
  authBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  filterBarWrapper: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    marginBottom: 40,
  },
  filterBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1380,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  filterGroupLeft: {
    flexDirection: 'row',
    gap: 32,
    flexWrap: 'wrap',
  },
  filterGroupRight: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '400' as const,
    fontFamily: LUXURY_FONT,
  },
  sortDropdownMenuFloat: {
    position: 'absolute',
    top: 110,
    right: 24,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 300,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEEEE',
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
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    elevation: 10,
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1380,
    alignSelf: 'center',
    flex: 1,
    height: 50,
    paddingHorizontal: 24,
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
  filterDropdownOpen: {
    backgroundColor: '#F5F5F5',
    height: 51,
    marginBottom: -1,
  },
  filterDropdownText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#757575',
    marginLeft: 5,
    fontFamily: LUXURY_FONT,
  },
  filterDropdownTextOpen: {
    color: '#000000',
  },
  productCountText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500' as const,
    fontFamily: LUXURY_FONT,
  },
  sortDropdownText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
    marginLeft: 5,
    fontFamily: LUXURY_FONT,
  },
  sortDropdownPanel: {
    position: 'absolute',
    top: 51,
    right: 0,
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
    fontFamily: LUXURY_FONT,
  },
  sortOptionTextActive: {
    color: '#000000',
    fontWeight: '500' as const,
  },
  dropdownPanel: {
    position: 'absolute',
    top: 51,
    left: 0,
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
  dropdownOptionText: {
    fontSize: 13,
    color: '#555555',
    fontFamily: LUXURY_FONT,
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
    fontFamily: LUXURY_FONT,
  },
  toolbarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
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
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: Platform.OS === 'web' ? 0 : -5000,
    left: Platform.OS === 'web' ? 0 : -5000,
    right: Platform.OS === 'web' ? 0 : -5000,
    bottom: Platform.OS === 'web' ? 0 : -5000,
    backgroundColor: 'transparent',
    zIndex: 90,
    ...(Platform.OS === 'web' ? ({ cursor: 'default' } as any) : {}),
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
