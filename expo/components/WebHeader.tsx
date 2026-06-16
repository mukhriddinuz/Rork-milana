import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Search, User, Heart, X } from 'lucide-react-native';

/** Global scroll bridge — any scrollable surface (e.g. EditorialShowroom) can write into this
 * Animated.Value and the sticky web header will react to it instantly, without prop drilling. */
export const globalWebScrollY = new Animated.Value(0);
import ToteIcon from '@/components/icons/ToteIcon';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useResponsive } from '@/hooks/useResponsive';
import {
  departmentsData as defaultDepartmentsData,
  categoriesData as defaultCategoriesData,
  megaMenuData as defaultMegaMenuData,
  type DepartmentKey,
  type DepartmentItem,
  type NavCategoryItem,
  type MegaMenuData,
} from '@/constants/navigationData';

interface WebHeaderProps {
  search: string;
  onSearchChange: (text: string) => void;
  onLogoPress?: () => void;
  onNavigateHome?: () => void;
  onMenuPress: () => void;
  onCartPress: () => void;
  onOrdersPress: () => void;
  onProfilePress: () => void;
  onFavoritesPress?: () => void;
  isSidebarOpen?: boolean;
  onMegaMenuChange?: (isOpen: boolean) => void;
  /** Animated scroll value used to translate the dept/main bars up to dock under the promo bar. */
  scrollY?: Animated.Value;
  /** CMS-ready data injection. Defaults to mock arrays in `constants/navigationData`. */
  departments?: DepartmentItem[];
  categories?: Record<DepartmentKey, NavCategoryItem[]>;
  megaMenu?: MegaMenuData;
}

const PROMO_BAR_HEIGHT = 34;
const DEPARTMENT_BAR_HEIGHT = 52;
const MAIN_BAR_HEIGHT = 74;
const HEADER_CONTENT_WIDTH = 1440;
const TOTAL_HEADER_HEIGHT = PROMO_BAR_HEIGHT + DEPARTMENT_BAR_HEIGHT + MAIN_BAR_HEIGHT;

function WebHeader({
  search,
  onSearchChange,
  onLogoPress,
  onNavigateHome,
  onCartPress,
  onProfilePress,
  onFavoritesPress,
  scrollY,
  departments = defaultDepartmentsData,
  categories = defaultCategoriesData,
  megaMenu = defaultMegaMenuData,
}: WebHeaderProps) {
  const { t, language, changeLanguage } = useAuth();
  const { totalItems } = useCart();
  const { totalFavorites } = useFavorites();
  const { selectedTopCategory, selectedCategory, enterCatalog, selectDepartment } = useWebHeader();
  const { settings: ds } = useSiteSettings();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchAnim = useRef(new Animated.Value(0)).current;
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [megaMenuHovered, setMegaMenuHovered] = useState(false);
  const megaMenuAnim = useRef(new Animated.Value(0)).current;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDepartment = selectedTopCategory || 'women';
  const activeNavId = hoveredNavId || megaMenuHovered ? (hoveredNavId ?? null) : null;
  const activeMegaEntry = activeNavId
    ? megaMenu[activeDepartment as DepartmentKey]?.[activeNavId] ?? null
    : null;
  const isMegaMenuVisible = activeMegaEntry !== null;

  useEffect(() => {
    if (isMegaMenuVisible) {
      Animated.timing(megaMenuAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    } else {
      Animated.timing(megaMenuAnim, { toValue: 0, duration: 120, useNativeDriver: false }).start();
    }
  }, [isMegaMenuVisible]);

  const handleNavHoverIn = useCallback((id: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setHoveredNavId(id);
  }, []);

  const handleNavHoverOut = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setHoveredNavId(null);
    }, 80);
  }, []);

  const handleMegaPanelHoverIn = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setMegaMenuHovered(true);
  }, []);

  const handleMegaPanelHoverOut = useCallback(() => {
    setMegaMenuHovered(false);
    setHoveredNavId(null);
  }, []);

  const closeMegaMenu = useCallback(() => {
    setHoveredNavId(null);
    setMegaMenuHovered(false);
  }, []);

  const handleMegaLinkPress = useCallback((url: string) => {
    console.log('[WebHeader] Mega link pressed:', url);
    closeMegaMenu();
    router.push(url as any);
  }, [closeMegaMenu, router]);

  const { isWebMobile } = useResponsive();

  if (Platform.OS !== 'web' || isWebMobile) {
    return null;
  }

  const toggleSearch = () => {
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

  const handleSearchSubmit = () => {
    const trimmed = searchText.trim();
    if (trimmed.length > 0) {
      onSearchChange(trimmed);
      router.push('/search' as any);
      setSearchText('');
      setSearchOpen(false);
      searchAnim.setValue(0);
    }
  };

  const handleDepartmentPress = (key: DepartmentKey) => {
    console.log('[WebHeader] Department pressed (showroom):', key);
    selectDepartment(key);
  };

  const handleNavPress = (key: string) => {
    console.log('[WebHeader] Nav pressed:', key);
    enterCatalog();
  };




  // The wrapper is absolutely positioned at the top of the viewport. As the user scrolls,
  // we translate the department and main bars UP by exactly DEPARTMENT_BAR_HEIGHT so the
  // gray bar slides behind the (fixed) promo bar and the white main bar docks under it.
  const slideUp = globalWebScrollY.interpolate({
    inputRange: [0, DEPARTMENT_BAR_HEIGHT],
    outputRange: [0, -DEPARTMENT_BAR_HEIGHT],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.wrapper, { backgroundColor: 'transparent' }]}>
      {/* ROW 1: Promo Top Bar (Black) — physically pinned at top, never moves */}
      <View
        style={[
          styles.promoBar,
          { backgroundColor: ds.topBannerBgColor || '#000000', zIndex: 100 },
        ]}
        testID="web-promo-bar"
      >
        <Text style={[styles.promoBarText, { color: ds.topBannerTextColor || '#FFFFFF' }]} numberOfLines={1}>
          {ds.topBannerText || 'BEPUL YETKAZIB BERISH — 500 000 SO\'MDAN YUQORI BUYURTMALARGA'}
        </Text>
      </View>

      {/* ROW 2: Department Mini-Bar (Gray) — slides up by DEPARTMENT_BAR_HEIGHT and hides behind promo */}
      <Animated.View style={[styles.departmentBar, { backgroundColor: '#FFFFFF', zIndex: 1, transform: [{ translateY: slideUp as any }] }]}>
        <View style={styles.departmentBarInner}>
          <View style={styles.departmentLeft}>
            {departments.map((dept) => {
              const isActive = activeDepartment === dept.id;
              const translated = t(dept.labelKey);
              const label = translated && translated !== dept.labelKey ? translated : dept.label;
              return (
                <DepartmentTab
                  key={dept.id}
                  label={label}
                  isActive={isActive}
                  onPress={() => { handleDepartmentPress(dept.id); closeMegaMenu(); }}
                  testID={`dept-${dept.id}`}
                  href={`/catalog?segment=${dept.id}`}
                />
              );
            })}
          </View>
          <View style={styles.departmentRight}>
            <Pressable
              onPress={() => changeLanguage('ru')}
              testID="lang-ru"
              style={styles.langBtn}
            >
              <Text
                style={[
                  styles.departmentRightText,
                  language === 'ru' && styles.departmentRightTextActive,
                ]}
              >
                RU
              </Text>
            </Pressable>
            <Text style={styles.departmentRightSep}>|</Text>
            <Pressable
              onPress={() => changeLanguage('uz')}
              testID="lang-uz"
              style={styles.langBtn}
            >
              <Text
                style={[
                  styles.departmentRightText,
                  language === 'uz' && styles.departmentRightTextActive,
                ]}
              >
                UZ
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
      {/* ROW 3: Main Navigation Bar (White) — slides up by DEPARTMENT_BAR_HEIGHT to dock under promo */}
      <Animated.View style={[styles.mainBar, { backgroundColor: '#FFFFFF', zIndex: 2, transform: [{ translateY: slideUp as any }] }]}>
        <View style={styles.mainBarInner}>
          {/* LEFT: Logo */}
          <View style={styles.mainLeft}>
            <Pressable
              onPress={() => { onLogoPress?.(); onNavigateHome?.(); }}
              style={styles.logoTouch}
              testID="web-logo-home"
            >
              <Text style={[styles.logoText, { color: '#000000' }]} selectable={false} numberOfLines={1}>
                MILANA PREMIUM
              </Text>
            </Pressable>
          </View>

          {/* CENTER: Navigation Links */}
          <View style={styles.mainCenter}>
            {(categories[activeDepartment as DepartmentKey] ?? categories.women).map((item, idx) => {
              const translated = t(item.labelKey);
              const label = translated && translated !== item.labelKey ? translated : item.label;
              return (
                <NavLink
                  key={`${activeDepartment}-${item.id}`}
                  label={label}
                  onPress={() => { handleNavPress(label); closeMegaMenu(); }}
                  onHoverIn={() => handleNavHoverIn(item.id)}
                  onHoverOut={handleNavHoverOut}
                  isActive={(activeNavId === item.id && isMegaMenuVisible) || selectedCategory === item.id}
                  testID={`nav-link-${idx}`}
                  href={`/catalog?segment=${activeDepartment}&category=${item.id}`}
                />
              );
            })}
          </View>

          {/* RIGHT: Action Icons */}
          <View style={styles.mainRight}>
            {!searchOpen ? (
              <Pressable
                onPress={toggleSearch}
                style={styles.iconBtn}
                testID="web-search-toggle"
              >
                <Search size={23} color="#000000" strokeWidth={1.3} />
              </Pressable>
            ) : (
              <Animated.View style={[styles.searchExpanded, {
                opacity: searchAnim,
                width: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 260],
                }),
              }]}>
                <View style={styles.searchBar}>
                  <Search size={14} color="#999" strokeWidth={1.3} />
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder={t('search')}
                    placeholderTextColor="#999"
                    style={styles.searchInput}
                    autoFocus
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                    testID="web-search-input"
                  />
                  <Pressable onPress={toggleSearch} style={styles.searchCloseBtn}>
                    <X size={14} color="#000" strokeWidth={1.3} />
                  </Pressable>
                </View>
              </Animated.View>
            )}
            <Pressable onPress={onFavoritesPress} style={styles.iconBtn} testID="web-favorites">
              <Heart size={23} color="#000000" strokeWidth={1.3} />
            </Pressable>
            <Pressable onPress={onProfilePress} style={styles.iconBtn} testID="web-profile">
              <User size={23} color="#000000" strokeWidth={1.3} />
            </Pressable>
            <Pressable onPress={onCartPress} style={styles.iconBtn} testID="web-cart">
              <ToteIcon size={23} color="#000000" strokeWidth={1.3} />
              {totalItems > 0 && (
                <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '500' as const, color: '#000000' }}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
        {/* MEGA MENU PANEL — nested inside mainBar so it travels with the sticky element */}
        {isMegaMenuVisible && activeMegaEntry && (
          <Animated.View
            style={[
              styles.megaMenuWrapper,
              {
                opacity: megaMenuAnim,
                transform: [{
                  translateY: megaMenuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-6, 0],
                  }),
                }],
              },
            ]}
          >
            <View
              style={styles.megaMenuPanel}
              {...(Platform.OS === 'web' ? ({ onMouseEnter: handleMegaPanelHoverIn, onMouseLeave: handleMegaPanelHoverOut } as any) : {})}
            >
              {/* Invisible hover bridge to prevent the menu from closing
                  when moving the cursor between the nav link and the panel. */}
              <View style={styles.megaMenuBridge} pointerEvents="auto" />
              <View style={styles.megaMenuSurface}>
                <View style={styles.megaMenuInner}>
                  <View style={styles.megaMenuColumns}>
                    {activeMegaEntry.columns.map((col, ci) => (
                      <View key={ci} style={styles.megaMenuColumn}>
                        <Text
                          accessibilityRole={Platform.OS === 'web' ? ('header' as any) : undefined}
                          {...(Platform.OS === 'web' ? ({ 'aria-level': 3 } as any) : {})}
                          style={styles.megaMenuColumnTitle}
                        >
                          {col.title}
                        </Text>
                        {col.links.map((link, li) => (
                          <MegaMenuLink
                            key={li}
                            label={link.label}
                            url={link.url}
                            onPress={() => handleMegaLinkPress(link.url)}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                  <Pressable
                    style={styles.megaMenuFeatured}
                    onPress={() => handleMegaLinkPress(activeMegaEntry.promo.url)}
                    {...(Platform.OS === 'web' ? ({ accessibilityRole: 'link', href: activeMegaEntry.promo.url } as any) : {})}
                  >
                    <Image
                      source={{ uri: activeMegaEntry.promo.imageUrl }}
                      style={styles.megaMenuFeaturedImage}
                      resizeMode="cover"
                      accessible
                      accessibilityLabel={activeMegaEntry.promo.alt}
                      {...(Platform.OS === 'web' ? ({ alt: activeMegaEntry.promo.alt } as any) : {})}
                    />
                    <Text style={styles.megaMenuFeaturedTitle}>{activeMegaEntry.promo.title}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

function MegaMenuLink({ label, url, onPress }: { label: string; url: string; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.megaMenuLinkTouch}
      {...(Platform.OS === 'web' ? ({ accessibilityRole: 'link', href: url } as any) : {})}
    >
      <Text style={[styles.megaMenuLinkText, hovered && styles.megaMenuLinkTextHover]}>{label}</Text>
    </Pressable>
  );
}

function DepartmentTab({
  label,
  isActive,
  onPress,
  testID,
  href,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  testID: string;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href as any} asChild>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={StyleSheet.flatten([
          styles.departmentTab,
          hovered && styles.departmentTabHovered,
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
        ])}
        testID={testID}
        accessibilityRole="link"
      >
        <Text
          style={StyleSheet.flatten([
            styles.departmentTabText,
            isActive && (Platform.OS === 'web'
              ? ({
                  textDecorationLine: 'underline' as const,
                  textDecorationColor: '#000000',
                  textDecorationThickness: 2,
                  textUnderlineOffset: 8,
                } as any)
              : { textDecorationLine: 'underline' as const, textDecorationColor: '#000000' }),
          ])}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function NavLink({ label, onPress, onHoverIn, onHoverOut, isActive, testID, href }: {
  label: string;
  onPress: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  isActive?: boolean;
  testID: string;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href as any} asChild>
      <Pressable
        onPress={onPress}
        onHoverIn={() => { setHovered(true); onHoverIn?.(); }}
        onHoverOut={() => { setHovered(false); onHoverOut?.(); }}
        style={StyleSheet.flatten([styles.navLink, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null])}
        testID={testID}
        accessibilityRole="link"
      >
      <Text
        style={StyleSheet.flatten([
          styles.navLinkText,
          { color: '#000000' },
          isActive && (Platform.OS === 'web'
            ? ({
                textDecorationLine: 'underline' as const,
                textDecorationColor: '#000000',
                textDecorationThickness: 2,
                textUnderlineOffset: 8,
              } as any)
            : { textDecorationLine: 'underline' as const, textDecorationColor: '#000000' }),
        ])}
      >
        {label}
      </Text>
      </Pressable>
    </Link>
  );
}

export { TOTAL_HEADER_HEIGHT };
export default React.memo(WebHeader);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    width: '100%',
    margin: 0,
    padding: 0,
    userSelect: 'none' as any,
    overflow: 'visible' as any,
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  promoBar: {
    width: '100%',
    height: PROMO_BAR_HEIGHT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  promoBarText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },

  departmentBar: {
    backgroundColor: '#FFFFFF',
    height: DEPARTMENT_BAR_HEIGHT,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    position: 'relative' as const,
    zIndex: 1,
  },
  departmentBarInner: {
    width: '100%',
    maxWidth: HEADER_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: DEPARTMENT_BAR_HEIGHT,
  },
  departmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  departmentTab: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    marginTop: 5,
    marginRight: 5,
    marginBottom: 5,
    marginLeft: 0,
    padding: 0,
  },
  departmentTabHovered: {
  },
  departmentTabText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
    color: '#000000',
    textTransform: 'uppercase' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  departmentTabTextActive: {
    color: '#000000',
    fontWeight: '600' as const,
  },
  departmentTabTextHover: {
    color: '#555555',
  },
  departmentUnderline: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 5,
    height: 2,
    backgroundColor: '#000000',
  },
  departmentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  departmentRightText: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: '#888888',
    letterSpacing: 1,
  },
  departmentRightTextActive: {
    color: '#000000',
    fontWeight: '700' as const,
  },
  departmentRightSep: {
    color: '#CCCCCC',
    fontSize: 10,
    marginHorizontal: 6,
  },
  langBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  mainBar: {
    backgroundColor: '#FFFFFF',
    height: MAIN_BAR_HEIGHT,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  mainBarInner: {
    width: '100%',
    maxWidth: HEADER_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 30,
    height: MAIN_BAR_HEIGHT,
    ...(Platform.OS === 'web'
      ? ({
          display: 'grid' as any,
          gridTemplateColumns: '1fr auto 1fr' as any,
          alignItems: 'center' as any,
        } as any)
      : { flexDirection: 'row' as const, alignItems: 'center' as const }),
  },
  mainLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? ({ justifySelf: 'start' } as any) : {}),
  },
  logoTouch: {
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 30,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as object) : {}),
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Futura PT", "Trebuchet MS", "Century Gothic", "Avenir Next", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  mainCenter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    height: MAIN_BAR_HEIGHT,
    gap: 0,
    ...(Platform.OS === 'web' ? ({ justifySelf: 'center' } as any) : {}),
  },
  mainRight: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    flexShrink: 0,
    height: MAIN_BAR_HEIGHT,
    gap: 0,
    marginRight: -10,
    ...(Platform.OS === 'web' ? ({ justifySelf: 'end' } as any) : {}),
  },

  navLink: {
    height: MAIN_BAR_HEIGHT,
    alignSelf: 'stretch',
    margin: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 7,
    paddingRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative' as const,
  },
  navLinkText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#000000',
    textTransform: 'uppercase' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  navLinkTextHover: {
    color: '#666666',
  },
  navLinkUnderline: {
    position: 'absolute' as const,
    bottom: 0,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: '#000000',
  },

  iconBtn: {
    height: MAIN_BAR_HEIGHT,
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: 18,
    right: 4,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 7,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  searchExpanded: {
    height: 36,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    height: 36,
    paddingHorizontal: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000000',
    height: '100%',
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  searchCloseBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  megaMenuWrapper: {
    position: 'absolute' as any,
    top: MAIN_BAR_HEIGHT,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 999998,
  },
  megaMenuPanel: {
    backgroundColor: 'transparent',
    width: '100%',
    ...(Platform.OS === 'web' ? ({ cursor: 'default' } as any) : {}),
  },
  megaMenuBridge: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  megaMenuSurface: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 12,
  },
  megaMenuInner: {
    width: '100%',
    maxWidth: 1600,
    alignSelf: 'center',
    paddingHorizontal: 56,
    paddingVertical: 56,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  megaMenuColumns: {
    flex: 1,
    flexDirection: 'row',
    gap: 96,
  },
  megaMenuColumn: {
    minWidth: 180,
  },
  megaMenuColumnTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 2,
    marginBottom: 22,
  },
  megaMenuLinkTouch: {
    paddingVertical: 9,
  },
  megaMenuLinkText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#555555',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  megaMenuLinkTextHover: {
    color: '#000000',
  },
  megaMenuFeatured: {
    flex: 1,
    maxWidth: 700,
    marginLeft: 80,
  },
  megaMenuFeaturedImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    height: undefined,
    backgroundColor: '#F5F5F5',
  },
  megaMenuFeaturedTitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: 2,
    marginTop: 18,
  },
});
