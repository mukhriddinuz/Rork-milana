import React, { useMemo, useCallback, useState } from 'react';

import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ShoppingBag, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrdersContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import WebHeader, { globalWebScrollY } from '@/components/WebHeader';
import MobileHeader from '@/components/MobileHeader';
import { MOBILE_HEADER_HEIGHT } from '@/components/MobileHeader';
import QuickViewModal from '@/components/QuickViewModal';
import { CartItem, OrderItem, Product } from '@/types';
import GlobalFooter from '@/components/GlobalFooter';
import { useResponsive } from '@/hooks/useResponsive';

const LUXURY_FONT = Platform.select({
  web: 'Futura, "Futura-Medium", sans-serif',
  default: 'sans-serif',
});

function CartItemRow({
  item,
  product,
  language,
  categories,
  onAdd,
  onRemove,
  onDelete,
  onOpenQuickView,
  isDesktop,
  t,
}: {
  item: CartItem;
  product: Product;
  language: 'uz' | 'ru';
  categories: { id: string; uz: string; ru: string }[];
  onAdd: () => void;
  onRemove: () => void;
  onDelete: () => void;
  onOpenQuickView: () => void;
  isDesktop: boolean;
  t: (key: string, fallback?: string) => string;
}) {
  const subtotal = (product.price ?? 0) * item.quantity;
  const unitPrice = product.price ?? 0;
  const categoryObj = categories.find((c) => c.id === product.category);
  const categoryName = categoryObj ? (language === 'uz' ? categoryObj.uz : categoryObj.ru) : '';

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemLeft}>
        <Pressable onPress={onOpenQuickView} testID={`cart-image-${item.productId}`}>
          <Image
            source={{ uri: product.image }}
            style={styles.itemImage}
            contentFit="cover"
          />
        </Pressable>
        <View style={styles.itemInfo}>
          <Pressable onPress={onOpenQuickView}>
            {categoryName ? (
              <Text style={styles.itemBrand} numberOfLines={1}>
                {categoryName.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.itemModel} numberOfLines={2}>
              {product.modelNumber}
            </Text>
            {product.variantNumber ? (
              <Text style={styles.itemVariant} numberOfLines={1}>
                {t('size', 'Size')}: {product.variantNumber}
              </Text>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.itemRight}>
        <View style={styles.itemColPrice}>
          <Text style={styles.itemPriceText}>${unitPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.itemColQty}>
          <View style={styles.qtyBox}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemove();
              }}
              style={styles.qtySideBtn}
              testID={`cart-minus-${item.productId}`}
            >
              <Text style={styles.qtySideText}>−</Text>
            </Pressable>
            <View style={styles.qtyMidBox}>
              <Text style={styles.qtyMidText}>{item.quantity}</Text>
            </View>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAdd();
              }}
              style={styles.qtySideBtn}
              testID={`cart-plus-${item.productId}`}
            >
              <Text style={styles.qtySideText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.itemColTotal}>
          <Text style={styles.itemTotalText}>${subtotal.toFixed(2)}</Text>
          <Pressable
            onPress={onDelete}
            style={styles.removeBtn}
            testID={`cart-delete-${item.productId}`}
          >
            <X size={11} color="#000000" strokeWidth={1.6} />
            <Text style={styles.removeBtnText}>
              {t('removeItem', 'Remove')}
            </Text>
          </Pressable>
        </View>
      </View>

      {!isDesktop ? null : null}
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const { user, language, t } = useAuth();
  const { products } = useProducts();
  const { items, addToCart, removeFromCart, removeItemCompletely, clearCart } = useCart();
  const { submitOrder } = useOrders();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { categories } = useCategories();

  const responsive = useResponsive();
  const isDesktop = responsive.isWebDesktop;
  const isWebMobile = responsive.isWebMobile;
  const { search, setSearch } = useWebHeader();
  const { getClientById } = useClients();
  const clientProfile = user?.role === 'client' && user ? getClientById(user.id) : null;
  const isVip = clientProfile?.clientStatus === 'vip';

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState<boolean>(false);

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: globalWebScrollY } } }],
        { useNativeDriver: false }
      ),
    []
  );

  const cartProducts = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? { ...item, product } : null;
      })
      .filter(Boolean) as (CartItem & { product: Product })[];
  }, [items, products]);

  const total = useMemo(() => {
    return cartProducts.reduce(
      (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
      0,
    );
  }, [cartProducts]);

  const handleOpenQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    setQuickViewVisible(true);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setQuickViewVisible(false);
    setQuickViewProduct(null);
  }, []);

  const handleSimilar = useCallback((_categoryId: string) => {
    handleCloseQuickView();
    router.push('/(tabs)/catalog' as any);
  }, [router, handleCloseQuickView]);

  const handleSubmitOrder = useCallback(() => {
    if (cartProducts.length === 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const orderItems: OrderItem[] = cartProducts.map((item) => ({
      productId: item.productId,
      modelNumber: item.product.modelNumber,
      variantNumber: item.product.variantNumber,
      image: item.product.image,
      price: item.product.price ?? 0,
      quantity: item.quantity,
    }));
    submitOrder({
      clientId: user?.id ?? '',
      clientName: user?.name ?? '',
      items: orderItems,
      total,
    });
    clearCart();
    Alert.alert('✓', t('orderSubmitted'), [
      {
        text: t('orders'),
        onPress: () => router.push('/(tabs)/orders' as any),
      },
      { text: 'OK' },
    ]);
  }, [cartProducts, total, user, submitOrder, clearCart, t, router]);

  const renderQuickView = () => (
    <QuickViewModal
      visible={quickViewVisible}
      product={quickViewProduct}
      language={language}
      categories={categories}
      quantity={quickViewProduct ? (items.find((i) => i.productId === quickViewProduct.id)?.quantity ?? 0) : 0}
      isFavorite={quickViewProduct ? isFavorite(quickViewProduct.id) : false}
      onClose={handleCloseQuickView}
      onAdd={() => quickViewProduct && addToCart(quickViewProduct.id)}
      onRemove={() => quickViewProduct && removeFromCart(quickViewProduct.id)}
      onToggleFavorite={() => quickViewProduct && toggleFavorite(quickViewProduct.id)}
      onSimilar={handleSimilar}
    />
  );

  const headerSection = isDesktop ? (
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
  ) : null;

  if (cartProducts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          {headerSection}
          <MobileHeader />
        </View>
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollOuter,
            isWebMobile && { paddingTop: MOBILE_HEADER_HEIGHT },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.pageContainer, !isDesktop && styles.pageContainerMobile]}>
            <Text style={styles.pageTitle}>{t('myCart', 'Shopping Bag')}</Text>
            <View style={styles.emptyWrap}>
              <ShoppingBag size={88} color="#D4D4D4" strokeWidth={0.8} />
              <Text style={styles.emptyTitle}>{t('emptyCartTitle')}</Text>
              <Text style={styles.emptySubtext}>{t('emptyCartSubtext')}</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/catalog')}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                testID="go-to-catalog"
              >
                <Text style={styles.primaryBtnText}>{t('goToCatalog')}</Text>
              </Pressable>
            </View>
          </View>
          <GlobalFooter />
        </Animated.ScrollView>
        {renderQuickView()}
      </View>
    );
  }

  const checkoutLabel = (isVip ? t('sendForConfirmation') : t('checkoutButton', 'Proceed to checkout')).toUpperCase();

  const colItems = language === 'uz' ? 'Mahsulotlar' : language === 'ru' ? 'Ваши товары' : 'Your items';
  const colPriceLabel = language === 'uz' ? 'Narxi' : language === 'ru' ? 'Цена' : 'Price';
  const colQtyLabel = language === 'uz' ? 'Soni' : language === 'ru' ? 'Количество' : 'Quantity';
  const colTotalLabel = language === 'uz' ? 'Jami' : language === 'ru' ? 'Сумма' : 'Subtotal';

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        {headerSection}
        <MobileHeader />
      </View>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollOuter,
          isWebMobile && { paddingTop: MOBILE_HEADER_HEIGHT, paddingBottom: 70 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.pageContainer, !isDesktop && styles.pageContainerMobile]}>
          {/* Top header row */}
          <View style={[styles.cartPageHeader, !isDesktop && styles.topHeaderMobile]}>
            <Text style={styles.cartPageTitle}>
              {t('cartTitle') ?? 'Your shopping bag'}
            </Text>
            {isDesktop ? (
              <Pressable
                onPress={handleSubmitOrder}
                style={({ pressed }) => [styles.topCheckoutBtn, pressed && styles.primaryBtnPressed]}
                testID="submit-order-top"
              >
                <Text style={styles.topCheckoutBtnText}>
                  {(t('checkoutBtn') ?? t('checkoutButton') ?? 'PROCEED TO CHECKOUT').toUpperCase()}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderLeft}>{colItems}</Text>
            {isDesktop ? (
              <View style={styles.tableHeaderRight}>
                <Text style={[styles.tableHeaderText, styles.colPrice]}>{colPriceLabel}</Text>
                <Text style={[styles.tableHeaderText, styles.colQty]}>{colQtyLabel}</Text>
                <Text style={[styles.tableHeaderText, styles.colTotal]}>{colTotalLabel}</Text>
              </View>
            ) : null}
          </View>

          {/* Items */}
          <View>
            {cartProducts.map((cp) => (
              <CartItemRow
                key={cp.productId}
                item={cp}
                product={cp.product}
                language={language}
                categories={categories}
                onAdd={() => addToCart(cp.productId)}
                onRemove={() => removeFromCart(cp.productId)}
                onDelete={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  removeItemCompletely(cp.productId);
                }}
                onOpenQuickView={() => handleOpenQuickView(cp.product)}
                isDesktop={isDesktop}
                t={t}
              />
            ))}
          </View>

          {/* Footer / Summary */}
          <View style={[styles.footerRow, !isDesktop && styles.footerRowMobile]}>
            <View style={styles.summaryCol}>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>
                  {t('summaryTotal', 'Subtotal')}
                </Text>
                <Text style={styles.summaryLineValue}>${total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>
                  {t('shipping', 'Shipping')}
                </Text>
                <Text style={styles.summaryLineValue}>
                  {t('freeShipping', 'Free')}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryLine}>
                <Text style={styles.grandTotalLabel}>
                  {t('grandTotal', 'Grand Total')}
                </Text>
                <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
              </View>
              {isVip ? (
                <Text style={styles.vipDisclaimer}>{t('vipDisclaimer')}</Text>
              ) : null}
            </View>
          </View>

          {/* Bottom CTA */}
          <View style={styles.bottomCtaWrap}>
            <Pressable
              onPress={handleSubmitOrder}
              style={({ pressed }) => [styles.primaryBtnLarge, pressed && styles.primaryBtnPressed]}
              testID="submit-order-bottom"
            >
              <Text style={styles.primaryBtnText}>{checkoutLabel}</Text>
            </Pressable>
          </View>
        </View>
        <GlobalFooter />
      </Animated.ScrollView>
      {renderQuickView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerWrapper: {
    zIndex: 9999,
    elevation: 9999,
    position: Platform.OS === 'web' ? ('relative' as const) : ('absolute' as const),
    top: 0,
    left: 0,
    right: 0,
  },
  scrollOuter: {
    paddingBottom: 0,
    flexGrow: 1,
  },
  pageContainer: {
    width: '100%',
    maxWidth: 910,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 180,
    paddingBottom: 60,
  },
  pageContainerMobile: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  cartPageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 32,
  },
  cartPageTitle: {
    fontSize: 44,
    fontWeight: '500' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  topCheckoutBtn: {
    backgroundColor: '#000000',
    width: 250,
    height: 32,
    paddingVertical: 0,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    fontFamily: LUXURY_FONT,
  },
  topHeaderMobile: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 44,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: -0.5,
    fontFamily: LUXURY_FONT,
  },

  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tableHeaderLeft: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  tableHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 380,
    justifyContent: 'space-between',
    marginLeft: 24,
  },
  tableHeaderText: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  colPrice: {
    width: 90,
    textAlign: 'left' as const,
  },
  colQty: {
    width: 110,
    textAlign: 'center' as const,
  },
  colTotal: {
    width: 100,
    textAlign: 'right' as const,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 20,
  },
  itemImage: {
    width: 100,
    height: 113,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
    paddingTop: 4,
  },
  itemBrand: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    fontFamily: LUXURY_FONT,
  },
  itemModel: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#777777',
    lineHeight: 18,
    marginBottom: 2,
    fontFamily: LUXURY_FONT,
  },
  itemVariant: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#000000',
    marginTop: 12,
    fontFamily: LUXURY_FONT,
  },

  itemRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 380,
    justifyContent: 'space-between',
    paddingTop: 4,
    marginLeft: 24,
  },
  itemColPrice: {
    width: 90,
  },
  itemColQty: {
    width: 110,
    alignItems: 'center',
  },
  itemColTotal: {
    width: 100,
    alignItems: 'flex-end',
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  itemTotalText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    height: 36,
  },
  qtySideBtn: {
    width: 30,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtySideText: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  qtyMidBox: {
    width: 36,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000000',
  },
  qtyMidText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 24,
    paddingVertical: 4,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#000000',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    fontFamily: LUXURY_FONT,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 48,
    marginTop: 48,
  },
  footerRowMobile: {
    flexDirection: 'column',
    gap: 32,
    marginTop: 32,
  },
  promoCol: {
    flex: 1,
    maxWidth: 400,
  },
  promoLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#000000',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: LUXURY_FONT,
  },
  promoInputRow: {
    flexDirection: 'row',
    height: 44,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#000000',
    fontFamily: LUXURY_FONT,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  useCodeBtn: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useCodeBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    fontFamily: LUXURY_FONT,
  },
  summaryCol: {
    flex: 1,
    maxWidth: 360,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLineLabel: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#666666',
    fontFamily: LUXURY_FONT,
  },
  summaryLineValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#000000',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000000',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    fontFamily: LUXURY_FONT,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
    fontFamily: LUXURY_FONT,
  },
  vipDisclaimer: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#999999',
    marginTop: 12,
    lineHeight: 16,
    fontFamily: LUXURY_FONT,
  },

  bottomCtaWrap: {
    alignItems: 'center',
    marginTop: 48,
  },
  primaryBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnLarge: {
    backgroundColor: '#000000',
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    fontFamily: LUXURY_FONT,
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '500' as const,
    color: '#000000',
    marginTop: 24,
    fontFamily: LUXURY_FONT,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#777777',
    textAlign: 'center' as const,
    marginTop: 12,
    maxWidth: 360,
    lineHeight: 20,
    fontFamily: LUXURY_FONT,
  },
});
