import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  MapPin,
  Phone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { supabase } from '@/lib/supabase';
import { FontFamily } from '@/constants/typography';
import { isAdminEmail } from '@/utils/adminAllowlist';
import type { Order, OrderItem, Product, ProductStatus, ProductVisibility } from '@/types';

type Tab = 'orders' | 'products';

const STATUSES: Order['status'][] = ['pending', 'processing', 'completed', 'cancelled'];

interface OrderRow {
  id: string;
  user_id: string;
  client_name: string | null;
  total: number;
  status: Order['status'];
  shipping_address: string | null;
  phone_number: string | null;
  created_at: string;
  order_items?: {
    product_id: string;
    model_number: string | null;
    variant_number: string | null;
    image: string | null;
    price: number;
    quantity: number;
  }[];
}

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    clientId: row.user_id,
    clientName: row.client_name ?? '',
    total: Number(row.total ?? 0),
    status: row.status,
    createdAt: row.created_at,
    shippingAddress: row.shipping_address ?? undefined,
    phoneNumber: row.phone_number ?? undefined,
    items: (row.order_items ?? []).map((it) => ({
      productId: it.product_id,
      modelNumber: it.model_number ?? '',
      variantNumber: it.variant_number ?? '',
      image: it.image ?? '',
      price: Number(it.price ?? 0),
      quantity: Number(it.quantity ?? 0),
    })),
  };
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('ru-RU').format(Number(n)) + ' UZS';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');

  const allowed = isAdminEmail(user?.email);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!allowed) {
      router.replace('/(tabs)/catalog');
    }
  }, [authLoading, user, allowed, router]);

  if (authLoading || !user) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#1A1A1A" />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.unauthorizedEyebrow}>RESTRICTED</Text>
        <Text style={styles.unauthorizedTitle}>Command Center</Text>
        <Text style={styles.unauthorizedBody}>
          This area is reserved for authorized staff.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/catalog')}
          style={styles.unauthorizedBtn}
          testID="unauthorized-back"
        >
          <Text style={styles.unauthorizedBtnText}>Return to catalog</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerBack}
          testID="manager-back"
        >
          <ArrowLeft size={20} color="#1A1A1A" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>MILANA</Text>
          <Text style={styles.headerTitle}>COMMAND CENTER</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setTab('orders');
          }}
          style={[styles.tabBtn, tab === 'orders' && styles.tabBtnActive]}
          testID="tab-orders"
        >
          <ShoppingBag size={14} color={tab === 'orders' ? '#1A1A1A' : '#999999'} />
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>Orders</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setTab('products');
          }}
          style={[styles.tabBtn, tab === 'products' && styles.tabBtnActive]}
          testID="tab-products"
        >
          <Package size={14} color={tab === 'products' ? '#1A1A1A' : '#999999'} />
          <Text style={[styles.tabText, tab === 'products' && styles.tabTextActive]}>Inventory</Text>
        </Pressable>
      </View>

      {tab === 'orders' ? <OrdersPanel /> : <ProductsPanel />}
    </View>
  );
}

/* ----------------------------- ORDERS PANEL ----------------------------- */

function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[Manager.Orders] Fetch failed:', error.message);
        return;
      }
      setOrders((data ?? []).map((r) => mapOrderRow(r as OrderRow)));
    } catch (e) {
      console.error('[Manager.Orders] threw:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const processing = orders.filter((o) => o.status === 'processing').length;
    const revenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((acc, o) => acc + o.total, 0);
    return { total: orders.length, pending, processing, revenue };
  }, [orders]);

  const changeStatus = useCallback(
    async (orderId: string, newStatus: Order['status']) => {
      setUpdatingId(orderId);
      const prev = orders;
      setOrders((rows) =>
        rows.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);
        if (error) {
          console.error('[Manager.Orders] update status failed:', error.message);
          setOrders(prev);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } catch (e) {
        console.error('[Manager.Orders] update threw:', e);
        setOrders(prev);
      } finally {
        setUpdatingId(null);
      }
    },
    [orders],
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#1A1A1A" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
      <View style={styles.statsRow}>
        <StatTile label="Total" value={String(stats.total)} />
        <StatTile label="Pending" value={String(stats.pending)} accent />
        <StatTile label="Processing" value={String(stats.processing)} />
        <StatTile label="Revenue" value={formatPrice(stats.revenue)} wide />
      </View>

      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {(['all', ...STATUSES] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setFilter(s)}
              style={[styles.chip, filter === s && styles.chipActive]}
              testID={`filter-${s}`}
            >
              <Text style={[styles.chipText, filter === s && styles.chipTextActive]}>
                {s.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          onPress={() => fetchAll(true)}
          style={styles.iconBtn}
          disabled={refreshing}
          testID="orders-refresh"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <RefreshCcw size={14} color="#1A1A1A" />
          )}
        </Pressable>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No orders match this filter.</Text>
        </View>
      ) : (
        filtered.map((order) => {
          const isOpen = expanded === order.id;
          return (
            <View key={order.id} style={styles.orderCard}>
              <Pressable
                onPress={() => setExpanded(isOpen ? null : order.id)}
                style={styles.orderHeader}
                testID={`order-${order.id}`}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <StatusPill status={order.status} />
                  </View>
                  <Text style={styles.orderClient}>{order.clientName || 'Anonymous'}</Text>
                  <Text style={styles.orderMeta}>
                    {formatDate(order.createdAt)} · {order.items.length} item
                    {order.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                  {isOpen ? (
                    <ChevronUp size={16} color="#999999" />
                  ) : (
                    <ChevronDown size={16} color="#999999" />
                  )}
                </View>
              </Pressable>

              {isOpen && (
                <View style={styles.orderBody}>
                  {order.shippingAddress || order.phoneNumber ? (
                    <View style={styles.shipBox}>
                      {order.shippingAddress ? (
                        <View style={styles.shipRow}>
                          <MapPin size={12} color="#666666" />
                          <Text style={styles.shipText}>{order.shippingAddress}</Text>
                        </View>
                      ) : null}
                      {order.phoneNumber ? (
                        <View style={styles.shipRow}>
                          <Phone size={12} color="#666666" />
                          <Text style={styles.shipText}>{order.phoneNumber}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={styles.itemsList}>
                    {order.items.map((it, idx) => (
                      <OrderItemRow key={`${order.id}-${idx}`} item={it} />
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Change status</Text>
                  <View style={styles.statusRow}>
                    {STATUSES.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => changeStatus(order.id, s)}
                        disabled={updatingId === order.id || order.status === s}
                        style={[
                          styles.statusBtn,
                          order.status === s && styles.statusBtnActive,
                          updatingId === order.id && { opacity: 0.5 },
                        ]}
                        testID={`status-${order.id}-${s}`}
                      >
                        <Text
                          style={[
                            styles.statusBtnText,
                            order.status === s && styles.statusBtnTextActive,
                          ]}
                        >
                          {s}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemThumbWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemThumb} resizeMode="cover" />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.modelNumber} · {item.variantNumber}
        </Text>
        <Text style={styles.itemSub}>
          {item.quantity} × {formatPrice(item.price)}
        </Text>
      </View>
      <Text style={styles.itemLineTotal}>{formatPrice(item.price * item.quantity)}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: Order['status'] }) {
  const config: Record<Order['status'], { bg: string; fg: string }> = {
    pending: { bg: '#FFF5E6', fg: '#B86E00' },
    processing: { bg: '#E6F0FF', fg: '#1F4FC1' },
    completed: { bg: '#E8F5E9', fg: '#1B5E20' },
    cancelled: { bg: '#FCEAEA', fg: '#B53030' },
  };
  const c = config[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  accent,
  wide,
}: {
  label: string;
  value: string;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <View style={[styles.statTile, wide && styles.statTileWide, accent && styles.statTileAccent]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* ---------------------------- PRODUCTS PANEL ---------------------------- */

interface ProductFormState {
  modelNumber: string;
  variantNumber: string;
  category: string;
  image: string;
  secondaryImage: string;
  price: string;
  oldPrice: string;
  description: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  isTrending: boolean;
  isNew: boolean;
}

const emptyForm: ProductFormState = {
  modelNumber: '',
  variantNumber: '',
  category: '',
  image: '',
  secondaryImage: '',
  price: '',
  oldPrice: '',
  description: '',
  status: 'draft',
  visibility: 'all',
  isTrending: false,
  isNew: false,
};

function ProductsPanel() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading } = useProducts();
  const { categories } = useCategories();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.modelNumber?.toLowerCase().includes(q) ||
        p.variantNumber?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
    );
  }, [products, search]);

  const handleNew = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditing(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((p: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditing(p);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (p: Product) => {
      const performDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        deleteProduct(p.id);
      };
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm(`Delete ${p.modelNumber}?`)) {
          performDelete();
        }
        return;
      }
      Alert.alert('Delete product', `Delete ${p.modelNumber}? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    },
    [deleteProduct],
  );

  const handleSubmit = useCallback(
    (state: ProductFormState) => {
      const priceNum = state.price.trim() === '' ? null : Number(state.price);
      const oldPriceNum = state.oldPrice.trim() === '' ? null : Number(state.oldPrice);
      if (priceNum != null && Number.isNaN(priceNum)) return;
      if (oldPriceNum != null && Number.isNaN(oldPriceNum)) return;

      if (editing) {
        updateProduct(editing.id, {
          modelNumber: state.modelNumber.trim(),
          variantNumber: state.variantNumber.trim(),
          category: state.category.trim(),
          image: state.image.trim(),
          secondaryImage: state.secondaryImage.trim() || undefined,
          price: priceNum,
          oldPrice: oldPriceNum,
          description: state.description.trim() || undefined,
          status: state.status,
          visibility: state.visibility,
          isTrending: state.isTrending,
          isNew: state.isNew,
        });
      } else {
        addProduct({
          modelNumber: state.modelNumber.trim(),
          variantNumber: state.variantNumber.trim(),
          category: state.category.trim(),
          image: state.image.trim(),
          secondaryImage: state.secondaryImage.trim() || undefined,
          price: priceNum,
          oldPrice: oldPriceNum,
          description: state.description.trim() || undefined,
          status: state.status,
          visibility: state.visibility,
          isTrending: state.isTrending,
          isNew: state.isNew,
          createdBy: user?.id ?? 'manager',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowForm(false);
      setEditing(null);
    },
    [editing, addProduct, updateProduct, user?.id],
  );

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#1A1A1A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.invToolbar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by model, variant, category"
          placeholderTextColor="#AAAAAA"
          style={styles.searchInput}
          testID="product-search"
        />
        <Pressable onPress={handleNew} style={styles.primaryBtn} testID="add-product">
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>New</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <Text style={styles.countText}>{filtered.length} products</Text>
        {filtered.map((p) => (
          <View key={p.id} style={styles.productRow}>
            <View style={styles.productThumbWrap}>
              {p.image ? (
                <Image source={{ uri: p.image }} style={styles.productThumb} resizeMode="cover" />
              ) : null}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {p.modelNumber} · {p.variantNumber}
              </Text>
              <Text style={styles.productMeta} numberOfLines={1}>
                {p.category} · {p.status} · {p.visibility}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.productPrice}>{formatPrice(p.price)}</Text>
                {p.oldPrice ? (
                  <Text style={styles.productOldPrice}>{formatPrice(p.oldPrice)}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.productActions}>
              <Pressable
                onPress={() => handleEdit(p)}
                style={styles.iconBtnSmall}
                testID={`edit-${p.id}`}
              >
                <Pencil size={14} color="#1A1A1A" />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(p)}
                style={[styles.iconBtnSmall, styles.iconBtnDanger]}
                testID={`delete-${p.id}`}
              >
                <Trash2 size={14} color="#B53030" />
              </Pressable>
            </View>
          </View>
        ))}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        ) : null}
      </ScrollView>

      <ProductFormModal
        visible={showForm}
        initial={editing}
        categories={categories}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

function ProductFormModal({
  visible,
  initial,
  categories,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial: Product | null;
  categories: { id: string; uz: string; ru: string }[];
  onClose: () => void;
  onSubmit: (state: ProductFormState) => void;
}) {
  const [state, setState] = useState<ProductFormState>(emptyForm);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setState({
        modelNumber: initial.modelNumber ?? '',
        variantNumber: initial.variantNumber ?? '',
        category: initial.category ?? '',
        image: initial.image ?? '',
        secondaryImage: initial.secondaryImage ?? '',
        price: initial.price != null ? String(initial.price) : '',
        oldPrice: initial.oldPrice != null ? String(initial.oldPrice) : '',
        description: initial.description ?? '',
        status: initial.status ?? 'draft',
        visibility: initial.visibility ?? 'all',
        isTrending: !!initial.isTrending,
        isNew: !!initial.isNew,
      });
    } else {
      setState(emptyForm);
    }
  }, [visible, initial]);

  const set = useCallback(<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const canSubmit =
    state.modelNumber.trim() !== '' &&
    state.variantNumber.trim() !== '' &&
    state.category.trim() !== '' &&
    state.image.trim() !== '';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initial ? 'Edit product' : 'New product'}</Text>
            <Pressable onPress={onClose} hitSlop={12} testID="form-close">
              <X size={18} color="#1A1A1A" />
            </Pressable>
          </View>

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <FormField label="Model number">
              <TextInput
                value={state.modelNumber}
                onChangeText={(v) => set('modelNumber', v)}
                style={styles.formInput}
                placeholder="e.g. M-2410"
                placeholderTextColor="#BBBBBB"
                testID="f-model"
              />
            </FormField>
            <FormField label="Variant">
              <TextInput
                value={state.variantNumber}
                onChangeText={(v) => set('variantNumber', v)}
                style={styles.formInput}
                placeholder="e.g. 01"
                placeholderTextColor="#BBBBBB"
                testID="f-variant"
              />
            </FormField>

            <FormField label="Category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => set('category', c.id)}
                    style={[styles.chip, state.category === c.id && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        state.category === c.id && styles.chipTextActive,
                      ]}
                    >
                      {c.ru}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </FormField>

            <FormField label="Image URL">
              <TextInput
                value={state.image}
                onChangeText={(v) => set('image', v)}
                style={styles.formInput}
                placeholder="https://..."
                placeholderTextColor="#BBBBBB"
                autoCapitalize="none"
                testID="f-image"
              />
            </FormField>
            <FormField label="Secondary image (optional)">
              <TextInput
                value={state.secondaryImage}
                onChangeText={(v) => set('secondaryImage', v)}
                style={styles.formInput}
                placeholder="https://..."
                placeholderTextColor="#BBBBBB"
                autoCapitalize="none"
              />
            </FormField>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Price">
                  <TextInput
                    value={state.price}
                    onChangeText={(v) => set('price', v.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#BBBBBB"
                    testID="f-price"
                  />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Old price">
                  <TextInput
                    value={state.oldPrice}
                    onChangeText={(v) => set('oldPrice', v.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#BBBBBB"
                  />
                </FormField>
              </View>
            </View>

            <FormField label="Description">
              <TextInput
                value={state.description}
                onChangeText={(v) => set('description', v)}
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                multiline
                placeholder="Short description"
                placeholderTextColor="#BBBBBB"
              />
            </FormField>

            <FormField label="Status">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['draft', 'published'] as ProductStatus[]).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => set('status', s)}
                    style={[styles.toggleBtn, state.status === s && styles.toggleBtnActive]}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        state.status === s && styles.toggleBtnTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </FormField>

            <FormField label="Visibility">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['all', 'vip'] as ProductVisibility[]).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => set('visibility', v)}
                    style={[styles.toggleBtn, state.visibility === v && styles.toggleBtnActive]}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        state.visibility === v && styles.toggleBtnTextActive,
                      ]}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </FormField>

            <View style={styles.flagsRow}>
              <FlagToggle
                label="Trending"
                active={state.isTrending}
                onToggle={() => set('isTrending', !state.isTrending)}
              />
              <FlagToggle
                label="New"
                active={state.isNew}
                onToggle={() => set('isNew', !state.isNew)}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => canSubmit && onSubmit(state)}
              disabled={!canSubmit}
              style={[styles.primaryBtn, !canSubmit && { opacity: 0.4 }]}
              testID="form-submit"
            >
              <Check size={14} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{initial ? 'Save' : 'Create'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

function FlagToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={[styles.flagBtn, active && styles.flagBtnActive]}>
      <View style={[styles.flagDot, active && styles.flagDotActive]} />
      <Text style={[styles.flagText, active && styles.flagTextActive]}>{label}</Text>
    </Pressable>
  );
}

/* -------------------------------- STYLES -------------------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  unauthorizedEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 4,
    color: '#B53030',
    textTransform: 'uppercase',
  },
  unauthorizedTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 3,
    color: '#1A1A1A',
    textTransform: 'uppercase',
  },
  unauthorizedBody: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 320,
    marginTop: 6,
  },
  unauthorizedBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
  },
  unauthorizedBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
  },
  headerBack: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { alignItems: 'center' },
  headerEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 4,
    color: '#888888',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 3,
    color: '#1A1A1A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#1A1A1A' },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 2,
    color: '#999999',
    textTransform: 'uppercase',
  },
  tabTextActive: { color: '#1A1A1A' },
  panel: { flex: 1 },
  panelContent: { padding: 16, paddingBottom: 48, maxWidth: 920, width: '100%', alignSelf: 'center' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statTile: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAEAEA',
    gap: 4,
  },
  statTileWide: { flexBasis: '100%' },
  statTileAccent: { backgroundColor: '#1A1A1A' },
  statLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    color: '#999999',
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: FontFamily.medium,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },

  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  chipText: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.4,
    color: '#666666',
  },
  chipTextActive: { color: '#FFFFFF' },
  iconBtn: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAEAEA',
  },
  orderHeader: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderId: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    color: '#1A1A1A',
  },
  orderClient: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' as const },
  orderMeta: { fontSize: 11, color: '#999999' },
  orderTotal: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  pill: { paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1 },
  orderBody: {
    padding: 14,
    paddingTop: 0,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
  },
  shipBox: {
    backgroundColor: '#FAFAFA',
    padding: 10,
    gap: 4,
  },
  shipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shipText: { fontSize: 12, color: '#444444', flex: 1 },
  itemsList: { gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemThumbWrap: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  itemThumb: { width: '100%', height: '100%' },
  itemTitle: { fontSize: 12, fontWeight: '600' as const, color: '#1A1A1A' },
  itemSub: { fontSize: 11, color: '#888888' },
  itemLineTotal: { fontSize: 12, fontWeight: '600' as const, color: '#1A1A1A' },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    color: '#888888',
    textTransform: 'uppercase',
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  statusBtnActive: { backgroundColor: '#1A1A1A' },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1,
    color: '#666666',
    textTransform: 'uppercase',
  },
  statusBtnTextActive: { color: '#FFFFFF' },

  invToolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
  },
  searchInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    color: '#1A1A1A',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    backgroundColor: '#1A1A1A',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAEAEA',
    marginBottom: 8,
  },
  productThumbWrap: {
    width: 56,
    height: 56,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  productThumb: { width: '100%', height: '100%' },
  productTitle: { fontSize: 13, fontWeight: '600' as const, color: '#1A1A1A' },
  productMeta: { fontSize: 11, color: '#999999', textTransform: 'capitalize' },
  productPrice: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  productOldPrice: { fontSize: 11, color: '#AAAAAA', textDecorationLine: 'line-through' },
  productActions: { flexDirection: 'row', gap: 6 },
  iconBtnSmall: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  iconBtnDanger: { backgroundColor: '#FCEAEA' },

  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 12, color: '#999999', letterSpacing: 0.5 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
  },
  modalTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 2,
    color: '#1A1A1A',
    textTransform: 'uppercase',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EAEAEA',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1A1A1A',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    color: '#1A1A1A',
    textTransform: 'uppercase',
  },

  formField: { gap: 6, marginBottom: 14 },
  formLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    color: '#888888',
    textTransform: 'uppercase',
  },
  formInput: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    color: '#1A1A1A',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  toggleBtnActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    color: '#666666',
    textTransform: 'uppercase',
  },
  toggleBtnTextActive: { color: '#FFFFFF' },
  flagsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  flagBtnActive: { borderColor: '#1A1A1A' },
  flagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DDDDDD',
  },
  flagDotActive: { backgroundColor: '#1A1A1A' },
  flagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    color: '#666666',
    textTransform: 'uppercase',
  },
  flagTextActive: { color: '#1A1A1A' },
});
