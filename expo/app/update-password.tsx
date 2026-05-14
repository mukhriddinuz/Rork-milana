import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Lock, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Deep-link target for Supabase password recovery emails.
 * The user arrives here from the email link with an active recovery session,
 * sets a new password, and is redirected back into the app.
 */
export default function UpdatePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, updatePassword } = useAuth();

  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean>(true);

  // Detect the recovery session; supabase fires PASSWORD_RECOVERY when the
  // deep-link is consumed. We also check the current session as a fallback
  // (the link may already have been parsed before this screen mounted).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && !data.session) {
          setHasRecoverySession(false);
        }
      } catch (e) {
        console.log('[UpdatePassword] getSession failed:', e);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setHasRecoverySession(true);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password.trim() || !confirm.trim()) {
      setErrorMsg(t('fillAllFields'));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t('passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setErrorMsg(t('passwordsDoNotMatch'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMsg(error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMsg(t('passwordUpdated'));
      setPassword('');
      setConfirm('');
      setTimeout(() => {
        router.replace('/(tabs)/catalog' as any);
      }, 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('authGenericError');
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirm, updatePassword, t, router]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin' as any);
  }, [router]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={goBack} style={styles.backBtn} testID="update-password-back">
          <ArrowLeft size={18} color={Colors.textSecondary} />
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Lock size={22} color={Colors.white} />
          </View>
          <Text style={styles.brand}>MILANA</Text>
          <View style={styles.divider} />
          <Text style={styles.title}>{t('updatePasswordTitle')}</Text>
          <Text style={styles.subtitle}>{t('updatePasswordSubtitle')}</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('newPassword')}</Text>
            <View style={[styles.passwordRow, errorMsg && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMsg(null); setSuccessMsg(null); }}
                placeholder={t('newPassword')}
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                testID="new-password-input"
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn} hitSlop={6}>
                {showPassword ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('confirmPassword')}</Text>
            <View style={[styles.passwordRow, errorMsg && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                value={confirm}
                onChangeText={(v) => { setConfirm(v); setErrorMsg(null); setSuccessMsg(null); }}
                placeholder={t('confirmPassword')}
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                testID="confirm-new-password-input"
              />
              <Pressable onPress={() => setShowConfirm((s) => !s)} style={styles.eyeBtn} hitSlop={6}>
                {showConfirm ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
              </Pressable>
            </View>
          </View>

          {!hasRecoverySession && !successMsg && (
            <Text style={styles.warningText} testID="update-password-no-session">
              {t('recoverySessionMissing')}
            </Text>
          )}

          {errorMsg ? (
            <Text style={styles.errorText} testID="update-password-error">{errorMsg}</Text>
          ) : null}

          {successMsg ? (
            <View style={styles.successRow} testID="update-password-success">
              <Check size={14} color="#1F7A4D" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting || !!successMsg}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && !isSubmitting && styles.submitBtnPressed,
              (isSubmitting || !!successMsg) && styles.submitBtnDisabled,
            ]}
            testID="update-password-submit"
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.submitText}>{t('savingPassword')}</Text>
              </>
            ) : (
              <Text style={styles.submitText}>{t('saveNewPassword')}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingHorizontal: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  header: { alignItems: 'center', marginTop: 28, marginBottom: 28 },
  iconCircle: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brand: { fontSize: 30, fontWeight: '800' as const, color: Colors.text, letterSpacing: 8 },
  divider: { width: 32, height: 2, backgroundColor: Colors.primary, marginTop: 14, marginBottom: 16, borderRadius: 2 },
  title: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 6, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, maxWidth: 320 },
  formCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 18, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.background, overflow: 'hidden' },
  passwordInput: { flex: 1, height: 48, paddingHorizontal: 14, fontSize: 14, color: Colors.text },
  eyeBtn: { paddingHorizontal: 14, height: 48, alignItems: 'center', justifyContent: 'center' },
  inputError: { borderColor: Colors.danger },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: '500' as const, letterSpacing: 0.2 },
  warningText: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', letterSpacing: 0.2 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  successText: { fontSize: 13, color: '#1F7A4D', fontWeight: '600' as const, letterSpacing: 0.2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 10, backgroundColor: Colors.primary, marginTop: 4 },
  submitBtnPressed: { backgroundColor: Colors.primaryDark },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '600' as const, color: Colors.white, letterSpacing: 0.3 },
});
