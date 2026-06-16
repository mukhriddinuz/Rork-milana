import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { FontFamily } from '@/constants/typography';
import Colors from '@/constants/colors';
import { logger } from '@/utils/logger';

/**
 * Customer-facing, luxury registration screen.
 *
 * Minimal form: first name, email, password. Mirrors the login screen
 * aesthetic. Since email confirmation is disabled in Supabase, the user
 * is redirected straight to the catalog on success.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, signUp } = useAuth();

  const [firstName, setFirstName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = useCallback(async () => {
    setErrorMsg(null);

    if (!firstName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg(t('fillAllFields'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t('passwordTooShort'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const { user, error } = await signUp(email.trim(), password, {
        name: firstName.trim(),
        role: 'client',
      });
      if (error || !user) {
        setErrorMsg(error ?? t('authGenericError'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/(tabs)/catalog' as any);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('authGenericError');
      logger.log('[Register] Unexpected error:', message);
      setErrorMsg(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, email, password, signUp, router, t]);

  const handleGoToLogin = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.replace('/login' as any);
  }, [router]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
          testID="register-back"
        >
          <ArrowLeft size={18} color="#1A1A1A" />
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>

        <View style={styles.inner}>
          <View style={styles.crest}>
            <View style={styles.crestLine} />
            <Text style={styles.crestText}>MILANA</Text>
            <View style={styles.crestLine} />
          </View>

          <Text style={styles.title}>{t('createAccountAction')}</Text>
          <Text style={styles.subtitle}>{t('signInSubtitle')}</Text>

          <View style={styles.divider} />

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('firstName')}</Text>
              <View style={styles.inputUnderline}>
                <TextInput
                  value={firstName}
                  onChangeText={(v) => {
                    setFirstName(v);
                    setErrorMsg(null);
                  }}
                  placeholder={t('firstName')}
                  placeholderTextColor={Colors.placeholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.input}
                  testID="register-first-name"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('email')}</Text>
              <View style={styles.inputUnderline}>
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setErrorMsg(null);
                  }}
                  placeholder={t('emailPlaceholder')}
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  testID="register-email"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('password')}</Text>
              <View style={styles.inputUnderline}>
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setErrorMsg(null);
                  }}
                  placeholder={t('password')}
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  testID="register-password"
                  editable={!isSubmitting}
                  onSubmitEditing={handleRegister}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#999999" />
                  ) : (
                    <Eye size={16} color="#999999" />
                  )}
                </Pressable>
              </View>
            </View>

            {errorMsg ? (
              <Text style={styles.errorText} testID="register-error">
                {errorMsg}
              </Text>
            ) : null}

            <Pressable
              onPress={handleRegister}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && !isSubmitting && styles.primaryBtnPressed,
                isSubmitting && styles.primaryBtnDisabled,
              ]}
              testID="register-submit"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('createAccountAction')}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('alreadyHaveAccount')} </Text>
            <Pressable onPress={handleGoToLogin} hitSlop={6} testID="register-go-login">
              <Text style={styles.footerLink}>{t('loginHere')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  inner: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  crest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 36,
  },
  crestLine: { width: 40, height: 1, backgroundColor: '#1A1A1A' },
  crestText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    letterSpacing: 4,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 24,
    fontWeight: '500' as const,
    color: '#1A1A1A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.muted,
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  divider: { width: 32, height: 1, backgroundColor: '#E5E5E5', marginBottom: 32 },
  form: { width: '100%', gap: 22 },
  field: { gap: 8 },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  inputUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  input: {
    flex: 1,
    height: 44,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  eyeBtn: {
    paddingHorizontal: 6,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.danger,
    letterSpacing: 0.3,
    marginTop: -4,
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnPressed: { backgroundColor: '#333333' },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: {
    fontFamily: FontFamily.medium,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  footerLink: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    ...(Platform.OS === 'web'
      ? ({ textDecorationLine: 'underline' } as object)
      : {}),
  },
});
