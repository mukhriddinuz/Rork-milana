import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, ClipboardList, TruckIcon, ArrowLeft, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import WebHeader from '@/components/WebHeader';
import GlobalFooter from '@/components/GlobalFooter';

export default function WarehouseDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, logout, language } = useAuth();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const isUz = language === 'uz';

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const stats = [
    {
      icon: Package,
      label: isUz ? 'Jami mahsulotlar' : 'Всего товаров',
      value: '1,248',
      color: '#3B82F6',
      bg: '#EFF6FF',
    },
    {
      icon: ClipboardList,
      label: isUz ? 'Yangi buyurtmalar' : 'Новые заказы',
      value: '23',
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      icon: TruckIcon,
      label: isUz ? 'Yetkazilmoqda' : 'В доставке',
      value: '7',
      color: '#10B981',
      bg: '#ECFDF5',
    },
  ];

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {isWeb && <WebHeader />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          !isWeb && { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {!isWeb && (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={18} color={Colors.textSecondary} />
              <Text style={styles.backText}>{t('mainPage')}</Text>
            </Pressable>
          )}

          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {isUz ? 'Xush kelibsiz!' : 'Добро пожаловать!'}
              </Text>
              <Text style={styles.pageTitle}>
                {isUz ? 'Ombor Boshqaruvi' : 'Управление складом'}
              </Text>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <LogOut size={18} color={Colors.danger} />
            </Pressable>
          </View>

          <View style={styles.titleUnderline} />

          <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
            {stats.map((stat, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: stat.bg }]}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.color }]}>
                  <stat.icon size={20} color="#FFF" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? 'Tezkor harakatlar' : 'Быстрые действия'}
            </Text>
            <View style={styles.actionsGrid}>
              {[
                isUz ? 'Buyurtmalarni ko\'rish' : 'Просмотр заказов',
                isUz ? 'Mahsulotlarni tekshirish' : 'Проверка товаров',
                isUz ? 'Yetkazib berishni boshqarish' : 'Управление доставкой',
                isUz ? 'Hisobotlar' : 'Отчёты',
              ].map((action, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                >
                  <Text style={styles.actionBtnText}>{action}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderEmoji}>🏗️</Text>
            <Text style={styles.placeholderTitle}>
              {isUz ? 'Panel ishlab chiqilmoqda' : 'Панель в разработке'}
            </Text>
            <Text style={styles.placeholderText}>
              {isUz
                ? 'Ombor boshqaruv paneli tez orada to\'liq ishga tushiriladi.'
                : 'Панель управления складом скоро будет полностью запущена.'}
            </Text>
          </View>
        </View>

        {isWeb && <GlobalFooter />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    flex: 1,
  },
  containerDesktop: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 60,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  backText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 28,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 28,
  },
  statsGridDesktop: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    gap: 8,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnPressed: {
    backgroundColor: Colors.background,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  placeholderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
