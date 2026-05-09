import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { FileText, Download, Truck, ArrowRight, ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrdersContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import WebHeader, { TOTAL_HEADER_HEIGHT } from '@/components/WebHeader';
import GlobalFooter from '@/components/GlobalFooter';
import EmptyState from '@/components/EmptyState';
import CatalogCard from '@/components/CatalogCard';
import Toast from '@/components/Toast';
import { useClients } from '@/contexts/ClientsContext';
import { Order, Product } from '@/types';

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
  const numColumns = isDesktop ? 6 : 2;
  const padded = useMemo(() => {
    const data: (Product | null)[] = [...products];
    const remainder = data.length % numColumns;
    if (remainder !== 0) {
      for (let i = 0; i < numColumns - remainder; i++) data.push(null);
    }
    return data;
  }, [products, numColumns]);

  return (
    <View style={recsStyles.recsGrid}>
      {padded.map((item, idx) => (
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

const statusColors: Record<Order['status'], { bg: string; text: string }> = {
  pending: { bg: Colors.statusPendingLight, text: Colors.statusPending },
  processing: { bg: Colors.statusProcessingLight, text: Colors.statusProcessing },
  completed: { bg: Colors.statusCompletedLight, text: Colors.statusCompleted },
  cancelled: { bg: Colors.statusCancelledLight, text: Colors.statusCancelled },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, language, t } = useAuth();
  const { orders, markOrdersSeen, isOrderUnseen, unseenCount, toastMessage, dismissToast } = useOrders();
  const { getClientById } = useClients();
  const { products } = useProducts();
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { categories } = useCategories();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { search, setSearch } = useWebHeader();

  const isClient = user?.role === 'client';
  const isWarehouse = user?.role === 'warehouse';
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const visibleOrders = useMemo(() => {
    if (isClient) {
      return orders.filter((o) => o.clientId === user?.id);
    }
    return orders;
  }, [orders, isClient, user?.id]);

  const recommendations = useMemo(
    () => products
      .filter((p) => p.status === 'published' && p.price !== null)
      .slice(0, 12),
    [products],
  );

  const handleImagePress = useCallback(
    (product: Product) => {
      const highRes = product.image.replace(/w=\d+/, 'w=1600').replace(/h=\d+/, 'h=1600');
      router.push({ pathname: '/product-image' as any, params: { uri: highRes } });
    },
    [router],
  );

  useEffect(() => {
    if (!isClient && visibleOrders.length > 0) {
      const unseenIds = visibleOrders.filter((o) => isOrderUnseen(o.id)).map((o) => o.id);
      if (unseenIds.length > 0) {
        const timer = setTimeout(() => {
          markOrdersSeen(unseenIds);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [visibleOrders, isClient, markOrdersSeen, isOrderUnseen]);

  const generateCSV = useCallback(() => {
    const headers = [
      'Order ID', 'Client', 'Date', 'Model', 'Variant', 'Price', 'Qty', 'Subtotal', 'Order Total', 'Status',
    ];
    const rows = visibleOrders.flatMap((order) =>
      order.items.map((item) =>
        [
          order.id, order.clientName, new Date(order.createdAt).toLocaleDateString(),
          item.modelNumber, item.variantNumber, `$${item.price.toFixed(2)}`,
          item.quantity.toString(), `$${(item.price * item.quantity).toFixed(2)}`,
          `$${order.total.toFixed(2)}`, order.status,
        ].join(','),
      ),
    );
    return [headers.join(','), ...rows].join('\n');
  }, [visibleOrders]);

  const generatePdfHtml = useCallback(
    (order: Order) => {
      const pageSize = 8;
      const totalPages = Math.ceil(order.items.length / pageSize);
      let pagesHtml = '';
      for (let page = 0; page < totalPages; page++) {
        const pageItems = order.items.slice(page * pageSize, (page + 1) * pageSize);
        const gridCells = pageItems
          .map(
            (item) => `
          <div style="border:1px solid #E0E0E0;border-radius:6px;overflow:hidden;background:#FFFFFF;">
            <div style="width:100%;aspect-ratio:1;background:#F5F5F6;overflow:hidden;">
              <img src="${item.image}" style="width:100%;height:100%;object-fit:cover;display:block;" />
            </div>
            <div style="padding:8px 10px;">
              <div style="font-size:14px;font-weight:700;color:#1A1A1A;margin-bottom:2px;">${item.modelNumber}</div>
              <div style="font-size:12px;color:#6B6B6B;margin-bottom:6px;">${item.variantNumber}</div>
              <div style="background:#CB11AB;color:#FFFFFF;font-size:16px;font-weight:800;text-align:center;padding:6px;border-radius:4px;">
                ${t('quantity')}: ${item.quantity}
              </div>
            </div>
          </div>`,
          )
          .join('');

        const pageBreak = page < totalPages - 1 ? 'page-break-after:always;' : '';
        pagesHtml += `
        <div style="${pageBreak}padding:20px 0;">
          ${page === 0 ? `
          <div style="border-bottom:3px solid #CB11AB;padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;">
            <div>
              <h1 style="color:#1A1A1A;margin:0;font-size:22px;letter-spacing:4px;">MILANA PREMIUM</h1>
              <p style="color:#CB11AB;margin:3px 0 0;font-size:11px;">${t('packingList')}</p>
            </div>
          </div>
          <div style="margin-bottom:16px;padding:10px 14px;background:#F5F5F6;border-radius:6px;display:flex;gap:20px;flex-wrap:wrap;">
            <span style="font-size:13px;"><strong>${t('clientInfo')}:</strong> ${order.clientName}</span>
            <span style="font-size:13px;"><strong>${t('orderNumber')}:</strong> #${order.id.slice(-6)}</span>
            <span style="font-size:13px;"><strong>${t('orderDate')}:</strong> ${new Date(order.createdAt).toLocaleDateString()}</span>
            <span style="font-size:13px;"><strong>${t('items')}:</strong> ${order.items.length}</span>
          </div>` : `
          <div style="margin-bottom:12px;padding:8px 14px;background:#F5F5F6;border-radius:4px;font-size:11px;color:#6B6B6B;">
            ${order.clientName} — #${order.id.slice(-6)} — ${t('items')} ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, order.items.length)} / ${order.items.length}
          </div>`}
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
            ${gridCells}
          </div>
          <div style="text-align:right;margin-top:10px;font-size:10px;color:#9E9E9E;">
            ${page + 1} / ${totalPages}
          </div>
        </div>`;
      }
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order ${order.id}</title>
<style>@page{margin:16mm}body{font-family:Arial,sans-serif;margin:0;padding:0;color:#1A1A1A}*{box-sizing:border-box}</style>
</head><body>${pagesHtml}</body></html>`;
    },
    [t],
  );

  const handleExportPdf = useCallback(
    async (order: Order) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const html = generatePdfHtml(order);
      if (Platform.OS === 'web') {
        try {
          const win = window.open('', '_blank');
          if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
        } catch (e) { console.error('[Orders] PDF export error:', e); }
      } else {
        try {
          const { File, Paths } = await import('expo-file-system');
          const Sharing = await import('expo-sharing');
          const file = new File(Paths.cache, `order_${order.id}.html`);
          file.create(); file.write(html);
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) { await Sharing.shareAsync(file.uri, { mimeType: 'text/html', dialogTitle: t('exportPdf') }); }
        } catch (e) { console.error('[Orders] Native PDF export error:', e); Alert.alert('Error', 'Export failed'); }
      }
    },
    [generatePdfHtml, t],
  );

  const handleExport = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const csv = generateCSV();
    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `orders_${Date.now()}.csv`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        Alert.alert('✓', t('exportSuccess'));
      } catch (e) { console.error('[Orders] Web export error:', e); }
    } else {
      try {
        const { File, Paths } = await import('expo-file-system');
        const Sharing = await import('expo-sharing');
        const file = new File(Paths.cache, `orders_${Date.now()}.csv`);
        file.create(); file.write(csv);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) { await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: t('exportExcel') }); }
        else { Alert.alert('✓', t('exportSuccess')); }
      } catch (e) { console.error('[Orders] Native export error:', e); Alert.alert('Error', 'Export failed'); }
    }
  }, [generateCSV, t]);

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => {
      const colors = statusColors[item.status];
      const isExpanded = expandedOrder === item.id;
      const unseen = !isClient && isOrderUnseen(item.id);

      return (
        <Pressable
          onPress={() => setExpandedOrder(isExpanded ? null : item.id)}
          style={[styles.orderCard, unseen && styles.orderCardUnseen]}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderLeft}>
              {unseen && <View style={styles.unseenDot} />}
              <View>
                <Text style={styles.orderNumber}>
                  {t('orderNumber')} #{item.id.slice(-6)}
                </Text>
                {!isClient && (
                  <View>
                    <Text style={styles.clientName}>{item.clientName}</Text>
                    {(() => {
                      const clientProfile = getClientById(item.clientId);
                      return clientProfile ? (
                        <Text style={styles.clientLocation}>{clientProfile.location} · {clientProfile.phone}</Text>
                      ) : null;
                    })()}
                  </View>
                )}
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.orderRight}>
              <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {t(item.status)}
                </Text>
              </View>
              <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
            </View>
          </View>
          <Text style={styles.itemCount}>
            {item.items.length} {t('items')}
          </Text>

          {isExpanded && (
            <View style={styles.orderDetails}>
              {item.items.map((orderItem, idx) => (
                <View key={idx} style={styles.detailRow}>
                  {orderItem.image ? (
                    <Image source={{ uri: orderItem.image }} style={styles.detailImage} contentFit="cover" />
                  ) : (
                    <View style={styles.detailImagePlaceholder} />
                  )}
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailModel} numberOfLines={1}>{orderItem.modelNumber}</Text>
                    <Text style={styles.detailVariant} numberOfLines={1}>{orderItem.variantNumber}</Text>
                    <Text style={styles.detailQty}>${orderItem.price.toFixed(2)} × {orderItem.quantity}</Text>
                  </View>
                  <Text style={styles.detailSubtotal}>${(orderItem.price * orderItem.quantity).toFixed(2)}</Text>
                </View>
              ))}
              {(isWarehouse || user?.role === 'accountant') && (
                <Pressable onPress={() => handleExportPdf(item)} style={styles.pdfBtn} testID={`export-pdf-${item.id}`}>
                  <Download size={14} color={Colors.white} />
                  <Text style={styles.pdfBtnText}>{t('exportPdf')}</Text>
                </Pressable>
              )}
            </View>
          )}
        </Pressable>
      );
    },
    [expandedOrder, isClient, isWarehouse, user?.role, t, formatDate, isOrderUnseen, handleExportPdf, getClientById],
  );

  const isStaff = user?.role === 'warehouse' || user?.role === 'accountant';

  const renderWebHeader = () => isDesktop ? (
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

  if (isClient && visibleOrders.length === 0) {
    return (
      <View style={styles.container}>
        {renderWebHeader()}
        <ScrollView contentContainerStyle={styles.scrollContentOuter} showsVerticalScrollIndicator={false}>
          <View style={[styles.centeredInner, isDesktop && styles.centeredInnerDesktop]}>
            <Toast message={t('newOrderNotification')} visible={!!toastMessage} onDismiss={dismissToast} />
            <View style={styles.breadcrumbContainer}>
              <Pressable onPress={() => router.push('/(tabs)/catalog' as any)}>
                <Text style={styles.breadcrumbInactive}>{t('mainPage')}</Text>
              </Pressable>
              <Text style={styles.breadcrumbSeparator}> — </Text>
              <Text style={styles.breadcrumbActive}>{t('orderHistory')}</Text>
            </View>
            <Text style={styles.pageTitle}>{t('orderHistory')}</Text>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Truck size={64} color="#D4D4D4" strokeWidth={1.2} />
              </View>
              <Text style={styles.emptyTitle}>
                {t('emptyOrdersTitle')}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('emptyOrdersSubtext')}
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/cart' as any)}
                testID="orders-go-cart"
              >
                <ShoppingCart size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.emptyBtnText}>{t('goToCart')}</Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
            {recommendations.length > 0 && (
              <View style={[styles.recsSection, isDesktop && styles.recsSectionDesktop]}>
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
          </View>
          <GlobalFooter />
        </ScrollView>
      </View>
    );
  }

  if (isClient && visibleOrders.length > 0) {
    return (
      <View style={styles.container}>
        {renderWebHeader()}
        <ScrollView contentContainerStyle={styles.scrollContentOuter} showsVerticalScrollIndicator={false}>
          <View style={[styles.centeredInner, isDesktop && styles.centeredInnerDesktop]}>
            <Toast message={t('newOrderNotification')} visible={!!toastMessage} onDismiss={dismissToast} />
            <View style={styles.breadcrumbContainer}>
              <Pressable onPress={() => router.push('/(tabs)/catalog' as any)}>
                <Text style={styles.breadcrumbInactive}>{t('mainPage')}</Text>
              </Pressable>
              <Text style={styles.breadcrumbSeparator}> — </Text>
              <Text style={styles.breadcrumbActive}>{t('orderHistory')}</Text>
            </View>
            <Text style={styles.pageTitle}>{t('orderHistory')}</Text>
            <View style={styles.clientOrdersHeader}>
              <Text style={styles.clientOrdersCount}>{visibleOrders.length} {t('orders').toLowerCase()}</Text>
            </View>
            {visibleOrders.map((order) => {
              const colors = statusColors[order.status];
              const isExpanded = expandedOrder === order.id;
              return (
                <Pressable
                  key={order.id}
                  onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
                  style={styles.batchCard}
                  testID={`client-order-${order.id}`}
                >
                  <View style={styles.batchHeader}>
                    <View style={styles.batchLeft}>
                      <View style={styles.batchIdRow}>
                        <FileText size={14} color="#CB11AB" strokeWidth={2} />
                        <Text style={styles.batchId}>#{order.id.slice(-6)}</Text>
                      </View>
                      <Text style={styles.batchDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    <View style={styles.batchRight}>
                      <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>{t(order.status)}</Text>
                      </View>
                      <Text style={styles.batchTotal}>${order.total.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.batchItemsPreview}>
                    {order.items.slice(0, 4).map((item, idx) => (
                      <View key={idx} style={styles.batchThumb}>
                        <Image source={{ uri: item.image }} style={styles.batchThumbImage} contentFit="cover" />
                        {item.quantity > 1 && (
                          <View style={styles.batchThumbBadge}>
                            <Text style={styles.batchThumbBadgeText}>×{item.quantity}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                    {order.items.length > 4 && (
                      <View style={styles.batchThumbMore}>
                        <Text style={styles.batchThumbMoreText}>+{order.items.length - 4}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <Text style={styles.batchItemCount}>{order.items.reduce((s, i) => s + i.quantity, 0)} {t('items')}</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.batchExpandedItems}>
                      {order.items.map((item, idx) => (
                        <View key={idx} style={styles.batchDetailRow}>
                          <Image source={{ uri: item.image }} style={styles.batchDetailImage} contentFit="cover" />
                          <View style={styles.batchDetailInfo}>
                            <Text style={styles.batchDetailModel} numberOfLines={1}>{item.modelNumber}</Text>
                            <Text style={styles.batchDetailVariant} numberOfLines={1}>{item.variantNumber}</Text>
                            <Text style={styles.batchDetailQty}>${item.price.toFixed(2)} × {item.quantity}</Text>
                          </View>
                          <Text style={styles.batchDetailSubtotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
            {recommendations.length > 0 && (
              <View style={[styles.recsSection, isDesktop && styles.recsSectionDesktop]}>
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
          </View>
          <GlobalFooter />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast message={t('newOrderNotification')} visible={!!toastMessage} onDismiss={dismissToast} />
      {isStaff && visibleOrders.length > 0 && (
        <View style={styles.exportBar}>
          <Text style={styles.orderCountText}>
            {visibleOrders.length} {t('orders').toLowerCase()}
            {unseenCount > 0 ? ` · ${unseenCount} ${t('newStatus').toLowerCase()}` : ''}
          </Text>
          <Pressable onPress={handleExport} style={styles.exportBtn} testID="export-excel">
            <Download size={14} color={Colors.text} />
            <Text style={styles.exportText}>{t('exportExcel')}</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={visibleOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon={<FileText size={48} color={Colors.textTertiary} />} title={t('noOrders')} />}
      />
    </View>
  );
}

const recsStyles = StyleSheet.create({
  recsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    padding: 2,
  },
  cardWrapperDesktop: {
    padding: 9,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContentOuter: {
    paddingBottom: 0,
    flexGrow: 1,
  },
  centeredInner: {
    width: '100%',
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  centeredInnerDesktop: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
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
  pageTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: -0.5,
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  exportBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  orderCountText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 6, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  exportText: { fontSize: 11, fontWeight: '600' as const, color: Colors.text },
  listContent: { padding: 14, paddingBottom: 30 },
  orderCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  orderCardUnseen: { backgroundColor: Colors.newOrderHighlight, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, flex: 1 },
  unseenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
  orderNumber: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  clientName: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  clientLocation: { fontSize: 10, color: Colors.textTertiary, marginTop: 1 },
  orderDate: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600' as const },
  orderTotal: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
  itemCount: { fontSize: 11, color: Colors.textTertiary, marginTop: 6 },
  orderDetails: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: Colors.background },
  detailImagePlaceholder: { width: 44, height: 44, borderRadius: 6, backgroundColor: Colors.background },
  detailInfo: { flex: 1, gap: 1 },
  detailModel: { fontSize: 12, color: Colors.text, fontWeight: '600' as const },
  detailVariant: { fontSize: 11, color: Colors.textSecondary },
  detailQty: { fontSize: 11, color: Colors.textTertiary },
  detailSubtotal: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, minWidth: 50, textAlign: 'right' as const },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.primary, marginTop: 4,
  },
  pdfBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.white },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#6B6B6B',
    textAlign: 'center' as const,
    lineHeight: 20,
    maxWidth: 360,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 36,
    gap: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  clientOrdersHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 0,
    paddingBottom: 12,
  },
  clientOrdersCount: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#888',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 0,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  batchLeft: {
    gap: 3,
  },
  batchIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchId: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  batchDate: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#999',
    marginLeft: 20,
  },
  batchRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  batchTotal: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1A1A1A',
  },
  batchItemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  batchThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  batchThumbImage: {
    width: 44,
    height: 44,
  },
  batchThumbBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopLeftRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  batchThumbBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  batchThumbMore: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchThumbMoreText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
  },
  batchItemCount: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#999',
  },
  batchExpandedItems: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  batchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  batchDetailImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  batchDetailInfo: {
    flex: 1,
    gap: 1,
  },
  batchDetailModel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  batchDetailVariant: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#888',
  },
  batchDetailQty: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#999',
  },
  batchDetailSubtotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    minWidth: 55,
    textAlign: 'right' as const,
  },
  recsSection: {
    paddingTop: 48,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    marginTop: 24,
  },
  recsSectionDesktop: {
    paddingHorizontal: 0,
  },
  recsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});
