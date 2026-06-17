import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Search, X, Menu, User, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import { useResponsive } from '@/hooks/useResponsive';
import * as Haptics from 'expo-haptics';

const HEADER_HEIGHT = 52;

export default function MobileHeader() {
  const { isWebMobile } = useResponsive();
  const { t, language, changeLanguage } = useAuth();
  const { totalItems } = useCart();
  const { setSearch, goHome, selectDepartment, navigateToSegment } = useWebHeader();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  if (!isWebMobile) return null;

  const toggleSearch = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (searchOpen) {
      Animated.timing(searchAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
        setSearchOpen(false);
        setSearchText('');
      });
    } else {
      setSearchOpen(true);
      Animated.timing(searchAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    }
  };

  const handleSubmit = () => {
    const trimmed = searchText.trim();
    if (trimmed.length > 0) {
      setSearch(trimmed);
      router.push('/search' as any);
      setSearchText('');
      setSearchOpen(false);
      searchAnim.setValue(0);
    }
  };

  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          {!searchOpen && (
            <>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMenuOpen(!menuOpen);
                }}
                style={styles.iconBtn}
                testID="mobile-header-menu"
              >
                <Menu size={20} color="#000000" strokeWidth={1.5} />
              </Pressable>

              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  goHome();
                }}
                style={styles.logoTouch}
                testID="mobile-header-logo"
              >
                <Text style={styles.logoText} numberOfLines={1}>MILANA PREMIUM</Text>
              </Pressable>

              <View style={styles.rightActions}>
                <Pressable onPress={toggleSearch} style={styles.iconBtn} testID="mobile-header-search">
                  <Search size={18} color="#000000" strokeWidth={1.5} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/settings' as any)}
                  style={styles.iconBtn}
                  testID="mobile-header-account"
                >
                  <User size={18} color="#000000" strokeWidth={1.5} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/cart' as any)}
                  style={styles.iconBtn}
                  testID="mobile-header-bag"
                >
                  <ShoppingBag size={18} color="#000000" strokeWidth={1.5} />
                  {totalItems > 0 && (
                    <View style={styles.bagBadge}>
                      <Text style={styles.bagBadgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </>
          )}

          {searchOpen && (
            <Animated.View style={[styles.searchExpanded, { width: searchWidth }]}>
              <View style={styles.searchBar}>
                <Search size={16} color="#999" strokeWidth={1.5} />
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder={t('search')}
                  placeholderTextColor="#999"
                  style={styles.searchInput}
                  autoFocus
                  onSubmitEditing={handleSubmit}
                  returnKeyType="search"
                  testID="mobile-search-input"
                />
                <Pressable onPress={toggleSearch} style={styles.searchClose}>
                  <X size={16} color="#000" strokeWidth={1.5} />
                </Pressable>
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {menuOpen && (
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuPanel}>
            <View style={styles.menuHeader}>
              <Pressable onPress={() => setMenuOpen(false)} style={styles.menuCloseBtn}>
                <X size={20} color="#000000" strokeWidth={1.5} />
              </Pressable>
            </View>
            {[
              { label: t('navMen') ?? 'MEN', kind: 'dept' as const, dept: 'men' },
              { label: t('navWomen') ?? 'WOMEN', kind: 'dept' as const, dept: 'women' },
              { label: t('navKids') ?? 'KIDS', kind: 'dept' as const, dept: 'kids' },
              { label: t('navNew') ?? 'NEW ARRIVALS', kind: 'catalog' as const, segment: 'yangi' },
              { label: t('navSale') ?? 'SALE', kind: 'catalog' as const, segment: 'chegirma' },
            ].map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setMenuOpen(false);
                  if (item.kind === 'dept') {
                    selectDepartment(item.dept);
                  } else {
                    navigateToSegment(item.segment);
                  }
                  router.push('/(tabs)/catalog' as any);
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>{item.label.toUpperCase()}</Text>
              </Pressable>
            ))}
            <View style={styles.menuDivider} />
            <Pressable
              onPress={() => { setMenuOpen(false); router.push('/(tabs)/favorites' as any); }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemTextSmall}>{(t('favorites') ?? 'FAVORITES').toUpperCase()}</Text>
            </Pressable>
            <Pressable
              onPress={() => { setMenuOpen(false); router.push('/(tabs)/settings' as any); }}
              style={styles.menuItem}
            >
              <Text style={styles.menuItemTextSmall}>{(t('profile') ?? 'ACCOUNT').toUpperCase()}</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <View style={styles.langRow}>
              <Pressable
                onPress={() => changeLanguage('ru')}
                style={styles.langItem}
                testID="mobile-lang-ru"
              >
                <Text style={[styles.langText, language === 'ru' && styles.langTextActive]}>RU</Text>
              </Pressable>
              <Text style={styles.langSep}>|</Text>
              <Pressable
                onPress={() => changeLanguage('uz')}
                style={styles.langItem}
                testID="mobile-lang-uz"
              >
                <Text style={[styles.langText, language === 'uz' && styles.langTextActive]}>UZ</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}
    </>
  );
}

export { HEADER_HEIGHT as MOBILE_HEADER_HEIGHT };

const styles = StyleSheet.create({
  wrapper: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  container: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  logoTouch: {
    position: 'absolute' as const,
    // Reserve the icon-cluster width on BOTH sides so the centered logo
    // stays screen-centered yet can never slide under the menu button
    // (left) or the search/account/bag icons (right). It truncates
    // gracefully on very narrow phones instead of overlapping.
    left: 116,
    right: 116,
    alignItems: 'center',
    justifyContent: 'center',
    height: HEADER_HEIGHT,
    zIndex: -1,
  },
  logoText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as object) : {}),
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Futura PT", "Trebuchet MS", "Century Gothic", "Avenir Next", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  iconBtn: {
    width: 38,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  bagBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 7,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagBadgeText: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  searchExpanded: {
    flex: 1,
    height: HEADER_HEIGHT,
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    height: 38,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    height: '100%',
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  searchClose: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999999,
  },
  menuPanel: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  menuCloseBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#000000',
    letterSpacing: 2,
  },
  menuItemTextSmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#666666',
    letterSpacing: 1.5,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 24,
    marginVertical: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  langItem: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#888888',
    letterSpacing: 1.5,
  },
  langTextActive: {
    color: '#000000',
    fontWeight: '700' as const,
  },
  langSep: {
    fontSize: 12,
    color: '#CCCCCC',
  },
});
