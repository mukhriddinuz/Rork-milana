import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Globe,
  LogOut,
  ChevronRight,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Save,
  Heart,
  ShoppingBag,
  Wallet,
  HelpCircle,
  MessageCircle,
  Settings,
  Home,
  Package,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import WebHeader, { TOTAL_HEADER_HEIGHT } from '@/components/WebHeader';
import MobileHeader from '@/components/MobileHeader';
import { MOBILE_HEADER_HEIGHT } from '@/components/MobileHeader';
import { useResponsive } from '@/hooks/useResponsive';
import { useCategories } from '@/contexts/CategoriesContext';
import { useClients } from '@/contexts/ClientsContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useOrders } from '@/contexts/OrdersContext';
import GlobalFooter from '@/components/GlobalFooter';
import { Language, Product } from '@/types';

interface DashNavItem {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onPress: () => void;
  badge?: string | number;
  danger?: boolean;
}

function DashNavCard({ item }: { item: DashNavItem }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Pressable
      onPress={item.onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[profileStyles.navCard, hovered && profileStyles.navCardHover, item.danger && profileStyles.navCardDanger]}
    >
      <View style={profileStyles.navCardTop}>
        <View style={[profileStyles.navCardIconWrap, item.danger && { backgroundColor: '#FFF5F5' }]}>
          {item.icon}
        </View>
        {item.badge !== undefined && (
          <View style={profileStyles.navCardBadge}>
            <Text style={profileStyles.navCardBadgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      <Text style={[profileStyles.navCardLabel, item.danger && { color: '#E53935' }]}>{item.label}</Text>
      <Text style={profileStyles.navCardSublabel}>{item.sublabel}</Text>
      <View style={profileStyles.navCardArrow}>
        <ChevronRight size={14} color={item.danger ? '#E53935' : '#CCCCCC'} />
      </View>
    </Pressable>
  );
}

function ProfileDashboard({
  router,
  user,
  language,
  t,
  clientProfile,
  totalFavorites,
  orders,
  logout,
}: {
  router: any;
  user: any;
  language: 'uz' | 'ru';
  t: (key: string) => string;
  clientProfile: any;
  totalFavorites: number;
  orders: any[];
  logout: () => Promise<void>;
}) {
  const clientOrders = useMemo(
    () => orders.filter((o: any) => o.clientId === user?.id),
    [orders, user?.id],
  );

  const handleLogout = useCallback(() => {
    Alert.alert(t('logout'), '', [
      { text: t('no'), style: 'cancel' },
      {
        text: t('yes'),
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace('/');
        },
      },
    ]);
  }, [logout, router, t]);

  const displayName = clientProfile
    ? `${clientProfile.firstName} ${clientProfile.lastName}`
    : user?.name ?? t('user');

  const initials = useMemo(() => {
    if (clientProfile) {
      return `${clientProfile.firstName?.[0] ?? ''}${clientProfile.lastName?.[0] ?? ''}`.toUpperCase();
    }
    return (user?.name?.[0] ?? 'F').toUpperCase();
  }, [clientProfile, user?.name]);

  const navItems: DashNavItem[] = useMemo(() => [
    {
      icon: <User size={20} color="#1A1A1A" />,
      label: t('menuPersonalInfo'),
      sublabel: t('descPersonalInfo'),
      onPress: () => {},
    },
    {
      icon: <Package size={20} color="#1A1A1A" />,
      label: t('menuOrderHistory'),
      sublabel: t('orderCount').replace('{count}', String(clientOrders.length)),
      badge: clientOrders.length,
      onPress: () => router.push('/(tabs)/orders' as any),
    },
    {
      icon: <Heart size={20} color="#1A1A1A" />,
      label: t('menuFavorites'),
      sublabel: t('productCount').replace('{count}', String(totalFavorites)),
      badge: totalFavorites,
      onPress: () => router.push('/(tabs)/favorites' as any),
    },
    {
      icon: <Settings size={20} color="#1A1A1A" />,
      label: t('menuSettings'),
      sublabel: t('descSettings'),
      onPress: () => {},
    },
    {
      icon: <Shield size={20} color="#1A1A1A" />,
      label: t('menuSecurity'),
      sublabel: t('descSecurity'),
      onPress: () => {},
    },
    {
      icon: <LogOut size={20} color="#E53935" />,
      label: t('menuLogout'),
      sublabel: t('descLogout'),
      onPress: handleLogout,
      danger: true,
    },
  ], [clientOrders.length, totalFavorites, router, handleLogout, t]);

  return (
    <ScrollView style={profileStyles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={profileStyles.scrollContent}>
        <View style={profileStyles.breadcrumbs}>
          <Pressable onPress={() => router.push('/(tabs)/catalog' as any)} style={profileStyles.breadcrumbLink}>
            <Home size={13} color="#999999" />
            <Text style={profileStyles.breadcrumbTextMuted}>{t('mainPage')}</Text>
          </Pressable>
          <Text style={profileStyles.breadcrumbSep}>—</Text>
          <Text style={profileStyles.breadcrumbTextActive}>{t('profileTitle')}</Text>
        </View>

        <View style={profileStyles.profileHeader}>
          <View style={profileStyles.avatarCircle}>
            <Text style={profileStyles.avatarInitials}>{initials}</Text>
          </View>
          <View style={profileStyles.profileHeaderInfo}>
            <Text style={profileStyles.profileHeaderName}>{displayName}</Text>
            <Text style={profileStyles.profileHeaderPhone}>
              {clientProfile?.phone ?? user?.username ?? ''}
            </Text>
          </View>
        </View>

        <View style={profileStyles.navGrid}>
          {navItems.map((item, idx) => (
            <DashNavCard key={idx} item={item} />
          ))}
        </View>

      </View>
      <GlobalFooter />
    </ScrollView>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, language, changeLanguage, logout, t } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { getClientById, updateClientProfile, changeClientPassword } = useClients();
  const { products } = useProducts();
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const { isFavorite, toggleFavorite, totalFavorites } = useFavorites();
  const { orders } = useOrders();

  const { search, setSearch } = useWebHeader();
  const isAccountant = user?.role === 'accountant';
  const isClient = user?.role === 'client';
  const clientProfile = isClient && user ? getClientById(user.id) : null;
  const responsive = useResponsive();
  const isDesktop = responsive.isWebDesktop;
  const isWebMobile = responsive.isWebMobile;

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catNameUz, setCatNameUz] = useState('');
  const [catNameRu, setCatNameRu] = useState('');

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const renderWebHeader = () => (
    <>
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
    </>
  );

  if (isClient && (isDesktop || isWebMobile)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {renderWebHeader()}
        <ProfileDashboard
        router={router}
        user={user}
        language={language}
        t={t}
        clientProfile={clientProfile}
        totalFavorites={totalFavorites}
        orders={orders}
        logout={logout}
      />
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert(t('logout'), '', [
      { text: t('no'), style: 'cancel' },
      {
        text: t('yes'),
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleLanguageChange = (lang: Language) => {
    Haptics.selectionAsync();
    changeLanguage(lang);
  };

  const handleAddCategory = () => {
    if (!catNameUz.trim() || !catNameRu.trim()) {
      Alert.alert(t('categoryNameUz'), t('categoryNameRu'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCategory({ uz: catNameUz.trim(), ru: catNameRu.trim() });
    setCatNameUz('');
    setCatNameRu('');
    setShowAddCategory(false);
  };

  const handleStartEdit = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setEditingCategoryId(catId);
      setCatNameUz(cat.uz);
      setCatNameRu(cat.ru);
    }
  };

  const handleSaveEdit = () => {
    if (!editingCategoryId || !catNameUz.trim() || !catNameRu.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCategory(editingCategoryId, { uz: catNameUz.trim(), ru: catNameRu.trim() });
    setEditingCategoryId(null);
    setCatNameUz('');
    setCatNameRu('');
  };

  const handleDeleteCategory = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    Alert.alert(t('confirmDelete'), cat[language], [
      { text: t('no'), style: 'cancel' },
      {
        text: t('yes'),
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deleteCategory(catId);
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setShowAddCategory(false);
    setCatNameUz('');
    setCatNameRu('');
  };

  const handleStartEditProfile = () => {
    if (clientProfile) {
      setEditFirstName(clientProfile.firstName);
      setEditLastName(clientProfile.lastName);
      setEditLocation(clientProfile.location);
      setShowEditProfile(true);
    }
  };

  const handleSaveProfile = () => {
    if (!user || !editFirstName.trim() || !editLastName.trim() || !editLocation.trim()) {
      Alert.alert(t('fillAllFields'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateClientProfile(user.id, {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      location: editLocation.trim(),
    });
    setShowEditProfile(false);
    Alert.alert('✓', t('profileUpdated'));
    console.log('[Settings] Profile updated for client:', user.id);
  };

  const handleChangePassword = () => {
    setPwError('');
    if (!user) return;
    if (!oldPassword.trim() || !newPassword.trim()) {
      setPwError(t('fillAllFields'));
      return;
    }
    if (newPassword.length < 4) {
      setPwError(t('passwordTooShort'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError(t('passwordMismatch'));
      return;
    }
    const success = changeClientPassword(user.id, oldPassword, newPassword);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPwError('');
      Alert.alert('✓', t('passwordChanged'));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPwError(t('wrongOldPassword'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {renderWebHeader()}
    <ScrollView style={styles.container}>
      <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account')}</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <User size={20} color={Colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileRole}>
                {t('role')}: {user?.role ? t(user.role) : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        <View style={styles.card}>
          <Pressable
            onPress={() => handleLanguageChange('uz')}
            style={[styles.langRow, styles.langRowBorder]}
          >
            <Globe size={16} color={Colors.textSecondary} />
            <Text style={styles.langText}>O'zbekcha</Text>
            <View style={[styles.radio, language === 'uz' && styles.radioActive]}>
              {language === 'uz' && <View style={styles.radioDot} />}
            </View>
          </Pressable>
          <Pressable onPress={() => handleLanguageChange('ru')} style={styles.langRow}>
            <Globe size={16} color={Colors.textSecondary} />
            <Text style={styles.langText}>Русский</Text>
            <View style={[styles.radio, language === 'ru' && styles.radioActive]}>
              {language === 'ru' && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        </View>
      </View>

      {isClient && clientProfile && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Pencil size={12} color={Colors.textTertiary} />
              <Text style={styles.sectionTitle}>{t('editProfile')}</Text>
            </View>
            {!showEditProfile && (
              <Pressable onPress={handleStartEditProfile} style={styles.addCatBtn} testID="edit-profile-btn">
                <Pencil size={12} color={Colors.primary} />
                <Text style={styles.addCatText}>{t('edit')}</Text>
              </Pressable>
            )}
          </View>

          {showEditProfile ? (
            <View style={styles.catForm}>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>{t('firstName')}</Text>
                <TextInput style={styles.catInput} value={editFirstName} onChangeText={setEditFirstName} placeholder={t('firstName')} placeholderTextColor={Colors.textTertiary} testID="edit-first-name" />
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>{t('lastName')}</Text>
                <TextInput style={styles.catInput} value={editLastName} onChangeText={setEditLastName} placeholder={t('lastName')} placeholderTextColor={Colors.textTertiary} testID="edit-last-name" />
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>{t('location')}</Text>
                <TextInput style={styles.catInput} value={editLocation} onChangeText={setEditLocation} placeholder={t('location')} placeholderTextColor={Colors.textTertiary} testID="edit-location" />
              </View>
              <View style={styles.catFormActions}>
                <Pressable onPress={() => setShowEditProfile(false)} style={styles.catFormBtn}>
                  <X size={14} color={Colors.textSecondary} />
                  <Text style={styles.catCancelText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable onPress={handleSaveProfile} style={[styles.catFormBtn, styles.catSaveBtn]}>
                  <Save size={14} color={Colors.white} />
                  <Text style={styles.catSaveText}>{t('save')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.profileDetailRow}>
                <User size={14} color={Colors.textSecondary} />
                <Text style={styles.profileDetailLabel}>{t('firstName')}</Text>
                <Text style={styles.profileDetailValue}>{clientProfile.firstName}</Text>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileDetailRow}>
                <User size={14} color={Colors.textSecondary} />
                <Text style={styles.profileDetailLabel}>{t('lastName')}</Text>
                <Text style={styles.profileDetailValue}>{clientProfile.lastName}</Text>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileDetailRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.profileDetailLabel}>{t('location')}</Text>
                <Text style={styles.profileDetailValue}>{clientProfile.location}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {isClient && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Lock size={12} color={Colors.textTertiary} />
              <Text style={styles.sectionTitle}>{t('changePassword')}</Text>
            </View>
            {!showChangePassword && (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowChangePassword(true); setPwError(''); }}
                style={styles.addCatBtn}
                testID="change-password-btn"
              >
                <Lock size={12} color={Colors.primary} />
                <Text style={styles.addCatText}>{t('changePassword')}</Text>
              </Pressable>
            )}
          </View>

          {showChangePassword && (
            <View style={styles.catForm}>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>{t('oldPassword')}</Text>
                <View style={styles.pwRow}>
                  <TextInput style={styles.pwInput} value={oldPassword} onChangeText={(text) => { setOldPassword(text); setPwError(''); }} placeholder={t('oldPassword')} placeholderTextColor={Colors.textTertiary} secureTextEntry={!showOldPw} autoCapitalize="none" testID="old-password-input" />
                  <Pressable onPress={() => setShowOldPw(!showOldPw)} style={styles.pwEyeBtn}>
                    {showOldPw ? <EyeOff size={16} color={Colors.textSecondary} /> : <Eye size={16} color={Colors.textSecondary} />}
                  </Pressable>
                </View>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>{t('newPassword')}</Text>
                <View style={styles.pwRow}>
                  <TextInput style={styles.pwInput} value={newPassword} onChangeText={(text) => { setNewPassword(text); setPwError(''); }} placeholder={t('newPassword')} placeholderTextColor={Colors.textTertiary} secureTextEntry={!showNewPw} autoCapitalize="none" testID="new-password-input" />
                  <Pressable onPress={() => setShowNewPw(!showNewPw)} style={styles.pwEyeBtn}>
                    {showNewPw ? <EyeOff size={16} color={Colors.textSecondary} /> : <Eye size={16} color={Colors.textSecondary} />}
                  </Pressable>
                </View>
              </View>
              <View style={styles.profileField}>
                <Text style={styles.profileFieldLabel}>{t('confirmNewPassword')}</Text>
                <TextInput style={styles.catInput} value={confirmNewPassword} onChangeText={(text) => { setConfirmNewPassword(text); setPwError(''); }} placeholder={t('confirmNewPassword')} placeholderTextColor={Colors.textTertiary} secureTextEntry autoCapitalize="none" testID="confirm-new-password-input" />
              </View>
              {pwError ? <Text style={styles.pwError}>{pwError}</Text> : null}
              <View style={styles.catFormActions}>
                <Pressable onPress={() => { setShowChangePassword(false); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); setPwError(''); }} style={styles.catFormBtn}>
                  <X size={14} color={Colors.textSecondary} />
                  <Text style={styles.catCancelText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable onPress={handleChangePassword} style={[styles.catFormBtn, styles.catSaveBtn]}>
                  <Check size={14} color={Colors.white} />
                  <Text style={styles.catSaveText}>{t('save')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {isAccountant && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <FolderOpen size={12} color={Colors.textTertiary} />
              <Text style={styles.sectionTitle}>{t('manageCategories')}</Text>
            </View>
            {!showAddCategory && !editingCategoryId && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddCategory(true); }} style={styles.addCatBtn}>
                <Plus size={12} color={Colors.primary} />
                <Text style={styles.addCatText}>{t('addCategory')}</Text>
              </Pressable>
            )}
          </View>

          {(showAddCategory || editingCategoryId) && (
            <View style={styles.catForm}>
              <TextInput style={styles.catInput} value={catNameUz} onChangeText={setCatNameUz} placeholder={t('categoryNameUz')} placeholderTextColor={Colors.textTertiary} />
              <TextInput style={styles.catInput} value={catNameRu} onChangeText={setCatNameRu} placeholder={t('categoryNameRu')} placeholderTextColor={Colors.textTertiary} />
              <View style={styles.catFormActions}>
                <Pressable onPress={handleCancelEdit} style={styles.catFormBtn}>
                  <X size={14} color={Colors.textSecondary} />
                  <Text style={styles.catCancelText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable onPress={editingCategoryId ? handleSaveEdit : handleAddCategory} style={[styles.catFormBtn, styles.catSaveBtn]}>
                  <Check size={14} color={Colors.white} />
                  <Text style={styles.catSaveText}>{t('save')}</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.card}>
            {categories.map((cat, index) => (
              <View key={cat.id} style={[styles.catRow, index < categories.length - 1 && styles.catRowBorder]}>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat[language]}</Text>
                  <Text style={styles.catSub}>{language === 'uz' ? cat.ru : cat.uz}</Text>
                </View>
                <View style={styles.catActions}>
                  <Pressable onPress={() => handleStartEdit(cat.id)} style={styles.catActionBtn}>
                    <Pencil size={13} color={Colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteCategory(cat.id)} style={styles.catActionBtn}>
                    <Trash2 size={13} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Pressable onPress={handleLogout} style={styles.logoutBtn} testID="logout-btn">
        <LogOut size={16} color={Colors.danger} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
        <ChevronRight size={16} color={Colors.textTertiary} />
      </Pressable>
      </View>
      <GlobalFooter />
    </ScrollView>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 80,
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  breadcrumbLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  breadcrumbTextMuted: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#999999',
  },
  breadcrumbSep: {
    fontSize: 13,
    color: '#CCCCCC',
  },
  breadcrumbTextActive: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#1A1A1A',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 44,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  profileHeaderInfo: {
    flex: 1,
    gap: 3,
  },
  profileHeaderName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  profileHeaderPhone: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#888888',
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 60,
  },
  navCard: {
    width: '48%' as any,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 22,
    gap: 6,
    position: 'relative' as const,
    ...(Platform.OS === 'web' ? {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    } : {
      elevation: 1,
    }),
  },
  navCardHover: {
    ...(Platform.OS === 'web' ? {
      shadowOpacity: 0.09,
      shadowRadius: 16,
    } : {}),
  },
  navCardDanger: {
    backgroundColor: '#FFFAFA',
  },
  navCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navCardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  navCardBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  navCardLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  navCardSublabel: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#999999',
  },
  navCardArrow: {
    position: 'absolute' as const,
    bottom: 18,
    right: 18,
  },

});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 34, maxWidth: 1440, width: '100%', alignSelf: 'center' as const },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '600' as const, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingHorizontal: 2 },
  addCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: Colors.primaryLight },
  addCatText: { fontSize: 11, fontWeight: '600' as const, color: Colors.primary },
  catForm: { backgroundColor: '#FAFAFA', borderRadius: 0, padding: 12, marginBottom: 8, gap: 8 },
  catInput: { height: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E8E8E8', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: Colors.text, backgroundColor: '#FFFFFF' },
  catFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  catFormBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#F5F5F5' },
  catSaveBtn: { backgroundColor: Colors.primary },
  catCancelText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  catSaveText: { fontSize: 12, fontWeight: '600' as const, color: Colors.white },
  card: { backgroundColor: '#FAFAFA', borderRadius: 0, overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  profileRole: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  langRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  langText: { flex: 1, fontSize: 14, color: Colors.text },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14 },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  catInfo: { flex: 1 },
  catName: { fontSize: 13, fontWeight: '500' as const, color: Colors.text },
  catSub: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  catActions: { flexDirection: 'row', gap: 6 },
  catActionBtn: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 0, padding: 16, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0' },
  logoutText: { flex: 1, fontSize: 14, fontWeight: '500' as const, color: Colors.danger },
  profileField: { gap: 4 },
  profileFieldLabel: { fontSize: 10, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  profileDetailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  profileDivider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 36 },
  profileDetailLabel: { fontSize: 12, color: Colors.textSecondary, width: 70 },
  profileDetailValue: { flex: 1, fontSize: 13, fontWeight: '500' as const, color: Colors.text, textAlign: 'right' as const },
  pwRow: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E8E8E8', borderRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  pwInput: { flex: 1, height: 40, paddingHorizontal: 12, fontSize: 13, color: Colors.text },
  pwEyeBtn: { paddingHorizontal: 12, height: 40, alignItems: 'center', justifyContent: 'center' },
  pwError: { fontSize: 12, color: Colors.danger, fontWeight: '500' as const },
});
