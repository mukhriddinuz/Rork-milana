import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Search,
  Package,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCategories } from '@/contexts/CategoriesContext';
import EmptyState from '@/components/EmptyState';
import { Product, ProductStatus } from '@/types';

export default function ProductsScreen() {
  const { language, t } = useAuth();
  const { products } = useProducts();
  const { categories } = useCategories();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.modelNumber.toLowerCase().includes(q) ||
          p.variantNumber.toLowerCase().includes(q),
      );
    }
    return result;
  }, [products, statusFilter, search]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      const categoryName =
        categories.find((c) => c.id === item.category)?.[language] ?? item.category;
      const isDraft = item.status === 'draft';

      return (
        <View style={styles.productRow}>
          <Image
            source={{ uri: item.image }}
            style={styles.thumbnail}
            contentFit="cover"
          />
          <View style={styles.productInfo}>
            <View style={styles.productHeader}>
              <Text style={styles.productModel} numberOfLines={1}>
                {item.modelNumber}
              </Text>
              <View style={styles.badgeRow}>
                {item.visibility === 'vip' && (
                  <View style={styles.vipBadge}>
                    <Text style={styles.vipBadgeText}>VIP</Text>
                  </View>
                )}
                {item.isTrending && (
                  <View style={styles.trendBadge}>
                    <Text style={styles.trendBadgeText}>T</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.statusBadge,
                    isDraft ? styles.statusDraft : styles.statusPublished,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isDraft ? styles.statusTextDraft : styles.statusTextPublished,
                    ]}
                  >
                    {isDraft ? t('draft') : t('published')}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.productMeta}>
              {item.variantNumber} · {categoryName}
            </Text>
          </View>
        </View>
      );
    },
    [language, t, categories],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={16} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search')}
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'draft', 'published'] as const).map((status) => (
          <Pressable
            key={status}
            onPress={() => setStatusFilter(status)}
            style={[
              styles.filterChip,
              statusFilter === status && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === status && styles.filterChipTextActive,
              ]}
            >
              {status === 'all' ? t('all') : t(status)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Package size={48} color={Colors.textTertiary} />}
            title={t('noProducts')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 90,
  },
  productRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productModel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vipBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.text,
  },
  vipBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  trendBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusDraft: {
    backgroundColor: Colors.statusDraft,
  },
  statusPublished: {
    backgroundColor: Colors.statusPublished,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  statusTextDraft: {
    color: Colors.statusDraftText,
  },
  statusTextPublished: {
    color: Colors.statusPublishedText,
  },
  productMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  accountantControls: {
    marginTop: 6,
    gap: 6,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  priceInput: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.danger,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
