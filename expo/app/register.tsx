import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, UserPlus, Copy, Shield, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';
import { ClientProfile } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, loginAsClient } = useAuth();
  const { registerClient } = useClients();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [messengerLink, setMessengerLink] = useState('');
  const [createdClient, setCreatedClient] = useState<ClientProfile | null>(null);

  const handleRegister = useCallback(() => {
    if (!firstName.trim() || !lastName.trim() || !location.trim() || !phone.trim() || !customPassword.trim()) {
      Alert.alert(t('fillAllFields')); return;
    }
    if (customPassword.length < 4) { Alert.alert(t('passwordTooShort')); return; }
    if (customPassword !== confirmPassword) { Alert.alert(t('passwordMismatch')); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const client = registerClient({
      firstName: firstName.trim(), lastName: lastName.trim(), location: location.trim(),
      phone: phone.trim(), password: customPassword, messengerLink: messengerLink.trim() || undefined,
    });
    setCreatedClient(client);
    console.log('[Register] Client registered:', client.username);
  }, [firstName, lastName, location, phone, customPassword, confirmPassword, messengerLink, registerClient, t]);

  const handleCopyCredentials = useCallback(async () => {
    if (!createdClient) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `Login: ${createdClient.username}\nPassword: ${createdClient.password}`;
    await Clipboard.setStringAsync(text);
    Alert.alert('✓', t('credentialsCopied'));
  }, [createdClient, t]);

  const handleContinue = useCallback(async () => {
    if (!createdClient) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await loginAsClient(createdClient.id, `${createdClient.firstName} ${createdClient.lastName}`, createdClient.username);
    router.replace('/(tabs)/catalog' as any);
  }, [createdClient, loginAsClient, router]);

  if (createdClient) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}><Shield size={32} color={Colors.primary} /></View>
          <Text style={styles.successTitle}>{t('registrationSuccess')}</Text>
          <Text style={styles.successSubtitle}>{t('yourCredentials')}</Text>
          <View style={styles.credentialsCard}>
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>{t('yourUsername')}</Text>
              <Text style={styles.credValue}>{createdClient.username}</Text>
            </View>
            <View style={styles.credDivider} />
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>{t('yourPassword')}</Text>
              <Text style={styles.credValue}>{createdClient.password}</Text>
            </View>
          </View>
          <Pressable onPress={handleCopyCredentials} style={styles.copyBtn} testID="copy-credentials">
            <Copy size={14} color={Colors.primary} /><Text style={styles.copyBtnText}>{t('copyCredentials')}</Text>
          </Pressable>
          <Text style={styles.saveWarning}>{t('saveCredentials')}</Text>
          <Pressable onPress={handleContinue} style={styles.continueBtn} testID="continue-btn">
            <Text style={styles.continueBtnText}>{t('continueBtn')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <ArrowLeft size={18} color={Colors.text} /><Text style={styles.backText}>{t('back')}</Text>
        </Pressable>
        <View style={styles.header}>
          <View style={styles.registerIcon}><UserPlus size={24} color={Colors.white} /></View>
          <Text style={styles.title}>{t('register')}</Text>
          <Text style={styles.subtitle}>MILANA PREMIUM</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('firstName')} *</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder={t('firstName')} placeholderTextColor={Colors.textTertiary} testID="first-name-input" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('lastName')} *</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder={t('lastName')} placeholderTextColor={Colors.textTertiary} testID="last-name-input" />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('location')} *</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder={t('location')} placeholderTextColor={Colors.textTertiary} testID="location-input" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('phone')} *</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+998 90 123 45 67" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" testID="phone-input" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('createPassword')} *</Text>
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} value={customPassword} onChangeText={setCustomPassword} placeholder={t('createPassword')} placeholderTextColor={Colors.textTertiary} secureTextEntry={!showPassword} autoCapitalize="none" testID="password-input" />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
              </Pressable>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('confirmPassword')} *</Text>
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} value={confirmPassword} onChangeText={setConfirmPassword} placeholder={t('confirmPassword')} placeholderTextColor={Colors.textTertiary} secureTextEntry={!showConfirm} autoCapitalize="none" testID="confirm-password-input" />
              <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                {showConfirm ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
              </Pressable>
            </View>
          </View>
          <View style={styles.phoneHintBox}>
            <Text style={styles.phoneHintText}>{t('nameAsLogin')}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('messengerLinkOptional')}</Text>
            <TextInput style={styles.input} value={messengerLink} onChangeText={setMessengerLink} placeholder="https://t.me/username" placeholderTextColor={Colors.textTertiary} autoCapitalize="none" testID="messenger-input" />
          </View>
          <Pressable onPress={handleRegister} style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]} testID="register-btn">
            <UserPlus size={16} color={Colors.white} /><Text style={styles.registerBtnText}>{t('registerBtn')}</Text>
          </Pressable>
        </View>
        <View style={styles.loginLink}>
          <Text style={styles.loginLinkText}>{t('alreadyHaveAccount')} </Text>
          <Pressable onPress={() => router.back()} testID="login-link"><Text style={styles.loginLinkAction}>{t('loginHere')}</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, alignSelf: 'flex-start' },
  backText: { fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  header: { alignItems: 'center', marginTop: 8, marginBottom: 28 },
  registerIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 11, fontWeight: '500' as const, color: Colors.primary, letterSpacing: 6 },
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  field: {},
  label: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  input: { height: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, fontSize: 14, color: Colors.text, backgroundColor: Colors.background },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.background, overflow: 'hidden' },
  passwordInput: { flex: 1, height: 46, paddingHorizontal: 14, fontSize: 14, color: Colors.text },
  eyeBtn: { paddingHorizontal: 14, height: 46, alignItems: 'center', justifyContent: 'center' },
  phoneHintBox: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  phoneHintText: { fontSize: 12, color: Colors.primary, fontWeight: '500' as const },
  registerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 10, backgroundColor: Colors.primary, marginTop: 6 },
  registerBtnPressed: { backgroundColor: Colors.primaryDark },
  registerBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
  loginLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 13, color: Colors.textSecondary },
  loginLinkAction: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginBottom: 6, textAlign: 'center' as const },
  successSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  credentialsCard: { width: '100%', backgroundColor: Colors.background, borderRadius: 10, overflow: 'hidden' },
  credRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  credDivider: { height: 1, backgroundColor: Colors.border },
  credLabel: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  credValue: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Colors.primaryLight, marginTop: 14 },
  copyBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  saveWarning: { fontSize: 12, color: Colors.textTertiary, marginTop: 12, textAlign: 'center' as const, fontStyle: 'italic' },
  continueBtn: { width: '100%', height: 50, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  continueBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
});
