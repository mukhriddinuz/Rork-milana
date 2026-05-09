import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, Calculator, ShoppingBag, Globe, LogIn, ChevronRight, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';
import { UserRole } from '@/types';

type LoginMode = 'select' | 'client';

const staffConfig = [
  { role: 'warehouse' as UserRole, icon: Package },
  { role: 'accountant' as UserRole, icon: Calculator },
];

export default function AdminLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, login, loginAsClient, changeLanguage, t } = useAuth();
  const { findClientByCredentials } = useClients();

  const [mode, setMode] = useState<LoginMode>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleStaffLogin = useCallback(
    async (role: UserRole) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login(role);
      const route = role === 'warehouse' ? '/(tabs)/orders' : '/(tabs)/products';
      router.replace(route as any);
    },
    [login, router],
  );

  const handleClientLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) { setLoginError(true); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const client = findClientByCredentials(username.trim(), password.trim());
    if (client) {
      setLoginError(false);
      await loginAsClient(client.id, `${client.firstName} ${client.lastName}`, client.username);
      router.replace('/(tabs)/catalog' as any);
    } else {
      setLoginError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [username, password, findClientByCredentials, loginAsClient, router]);

  const handleToggleLang = useCallback(() => {
    Haptics.selectionAsync();
    changeLanguage(language === 'uz' ? 'ru' : 'uz');
  }, [language, changeLanguage]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable onPress={handleGoBack} style={styles.backBtn} testID="admin-back">
            <ArrowLeft size={18} color={Colors.textSecondary} />
            <Text style={styles.backText}>{t('mainPage')}</Text>
          </Pressable>
          <Pressable onPress={handleToggleLang} style={styles.langToggle} testID="admin-lang-toggle">
            <Globe size={14} color={Colors.textSecondary} />
            <Text style={styles.langText}>{language === 'uz' ? "O'zbekcha" : 'Русский'}</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoDiamond}>
              <Text style={styles.logoIcon}>M</Text>
            </View>
          </View>
          <Text style={styles.brand}>MILANA</Text>
          <Text style={styles.brandSub}>PREMIUM</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>{t('staffPortal')}</Text>
        </View>

        {mode === 'select' && (
          <View style={styles.rolesContainer}>
            <Text style={styles.sectionLabel}>{t('staffLogin')}</Text>
            {staffConfig.map((config) => {
              const IconComponent = config.icon;
              return (
                <Pressable
                  key={config.role}
                  onPress={() => handleStaffLogin(config.role)}
                  style={({ pressed }) => [styles.roleCard, pressed && styles.roleCardPressed]}
                  testID={`admin-login-${config.role}`}
                >
                  <View style={styles.roleIcon}>
                    <IconComponent size={20} color={Colors.text} />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>{t(config.role)}</Text>
                    <Text style={styles.roleDesc}>{t(`${config.role}Desc`)}</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textTertiary} />
                </Pressable>
              );
            })}

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>{t('clientLogin')}</Text>
              <View style={styles.separatorLine} />
            </View>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode('client'); }}
              style={({ pressed }) => [styles.clientLoginCard, pressed && styles.roleCardPressed]}
              testID="admin-client-login-mode"
            >
              <View style={styles.clientRoleIcon}>
                <ShoppingBag size={20} color={Colors.white} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>{t('client')}</Text>
                <Text style={styles.roleDesc}>{t('clientDesc')}</Text>
              </View>
              <LogIn size={16} color={Colors.primary} />
            </Pressable>
          </View>
        )}

        {mode === 'client' && (
          <View style={styles.clientForm}>
            <Pressable onPress={() => { setMode('select'); setLoginError(false); setUsername(''); setPassword(''); }} style={styles.backToSelect}>
              <Text style={styles.backToSelectText}>← {t('back')}</Text>
            </Pressable>

            <Text style={styles.sectionLabel}>{t('clientLogin')}</Text>

            <View style={styles.formCard}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('firstName')}</Text>
                <TextInput
                  style={[styles.input, loginError && styles.inputError]}
                  value={username}
                  onChangeText={(text) => { setUsername(text); setLoginError(false); }}
                  placeholder={t('firstName')}
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="admin-username-input"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('password')}</Text>
                <TextInput
                  style={[styles.input, loginError && styles.inputError]}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setLoginError(false); }}
                  placeholder={t('password')}
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  testID="admin-password-input"
                />
              </View>
              {loginError && <Text style={styles.errorText}>{t('loginError')}</Text>}
              <Pressable
                onPress={handleClientLogin}
                style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
                testID="admin-client-login-btn"
              >
                <LogIn size={16} color={Colors.white} />
                <Text style={styles.loginBtnText}>{t('loginBtn')}</Text>
              </Pressable>
            </View>

            <View style={styles.registerLink}>
              <Text style={styles.registerLinkText}>{t('noAccount')} </Text>
              <Pressable onPress={() => router.push('/register' as any)} testID="admin-register-link">
                <Text style={styles.registerLinkAction}>{t('registerHere')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: Colors.background },
  langText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  header: { alignItems: 'center', marginTop: 28, marginBottom: 32 },
  logoContainer: { marginBottom: 16 },
  logoDiamond: { width: 60, height: 60, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 28, color: Colors.white, fontWeight: '800' as const },
  brand: { fontSize: 36, fontWeight: '800' as const, color: Colors.text, letterSpacing: 10 },
  brandSub: { fontSize: 12, fontWeight: '500' as const, color: Colors.primary, letterSpacing: 10, marginTop: 2 },
  divider: { width: 36, height: 3, backgroundColor: Colors.primary, marginTop: 16, borderRadius: 2 },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 10 },
  rolesContainer: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '600' as const, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 14, gap: 12 },
  roleCardPressed: { backgroundColor: Colors.background, borderColor: Colors.primary },
  roleIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  clientRoleIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  roleInfo: { flex: 1 },
  roleName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text, marginBottom: 1 },
  roleDesc: { fontSize: 12, color: Colors.textSecondary },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 },
  separatorLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  separatorText: { fontSize: 10, fontWeight: '600' as const, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  clientLoginCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10, padding: 14, gap: 12 },
  clientForm: { gap: 10 },
  backToSelect: { alignSelf: 'flex-start', paddingVertical: 4 },
  backToSelectText: { fontSize: 13, color: Colors.primary, fontWeight: '500' as const },
  formCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 16, gap: 12 },
  field: { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: Colors.text, backgroundColor: Colors.background },
  inputError: { borderColor: Colors.danger },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: '500' as const },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 10, backgroundColor: Colors.primary, marginTop: 4 },
  loginBtnPressed: { backgroundColor: Colors.primaryDark },
  loginBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
  registerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  registerLinkText: { fontSize: 13, color: Colors.textSecondary },
  registerLinkAction: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary, textDecorationLine: 'underline' as const },
});
