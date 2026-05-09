import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import useEscapeKey from '@/hooks/useEscapeKey';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, LogIn, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientsContext';
import { UserRole } from '@/types';
import WebHeader from '@/components/WebHeader';
import GlobalFooter from '@/components/GlobalFooter';
import MobileHeader from '@/components/MobileHeader';
import { MOBILE_HEADER_HEIGHT } from '@/components/MobileHeader';
import { useResponsive } from '@/hooks/useResponsive';

type TargetRole = 'warehouse' | 'accountant' | null;

export default function RulesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, login, loginAsClient, language } = useAuth();
  const { findClientByCredentials } = useClients();
  const isWeb = Platform.OS === 'web';
  const responsive = useResponsive();
  const isDesktop = responsive.isWebDesktop;
  const isWebMobile = responsive.isWebMobile;

  const [clickCount, setClickCount] = useState(0);
  const [activeTarget, setActiveTarget] = useState<TargetRole>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalRole, setModalRole] = useState<TargetRole>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleSecretTap = useCallback((role: TargetRole) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setClickCount((prev) => {
      const isSameTarget = activeTarget === role;
      const newCount = isSameTarget ? prev + 1 : 1;

      if (newCount >= 4) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setModalRole(role);
        setModalVisible(true);
        setUsername('');
        setPassword('');
        setLoginError(false);
        setActiveTarget(null);
        return 0;
      }

      if (newCount > 1) {
        Haptics.selectionAsync();
      }

      setActiveTarget(role);

      timeoutRef.current = setTimeout(() => {
        setClickCount(0);
        setActiveTarget(null);
      }, 1200);

      return newCount;
    });
  }, [activeTarget]);

  const MOCK_CREDENTIALS: Record<string, { login: string; password: string }> = {
    warehouse: { login: 'omborchi', password: '123' },
    accountant: { login: 'buxgalter', password: '123' },
  };

  const handleStaffLogin = useCallback(async () => {
    if (!modalRole) return;
    if (!username.trim() || !password.trim()) {
      setLoginError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const creds = MOCK_CREDENTIALS[modalRole];
    if (creds && username.trim() === creds.login && password.trim() === creds.password) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoginError(false);
      await login(modalRole as UserRole);
      setModalVisible(false);
      const route = modalRole === 'warehouse' ? '/warehouse' : '/accountant';
      router.push(route as any);
      console.log('[Auth] Staff login success:', modalRole);
    } else {
      setLoginError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log('[Auth] Staff login failed for role:', modalRole);
    }
  }, [modalRole, username, password, login, router]);

  const handleClientLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const client = findClientByCredentials(username.trim(), password.trim());
    if (client) {
      setLoginError(false);
      await loginAsClient(client.id, `${client.firstName} ${client.lastName}`, client.username);
      setModalVisible(false);
      router.replace('/(tabs)/catalog' as any);
    } else {
      setLoginError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [username, password, findClientByCredentials, loginAsClient, router]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalRole(null);
    setUsername('');
    setPassword('');
    setLoginError(false);
  }, []);

  useEscapeKey(modalVisible, closeModal);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderTriggerWord = (word: string, role: TargetRole) => (
    <Text onPress={() => handleSecretTap(role)} style={styles.bodyText}>
      {word}
    </Text>
  );

  const isUz = language === 'uz';

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {isWeb && <WebHeader />}
      {isWebMobile && <MobileHeader />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          !isWeb && { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
          isWebMobile && { paddingTop: MOBILE_HEADER_HEIGHT + 8, paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          {!isWeb && (
            <Pressable onPress={handleGoBack} style={styles.backBtn}>
              <ArrowLeft size={18} color={Colors.textSecondary} />
              <Text style={styles.backText}>{t('mainPage')}</Text>
            </Pressable>
          )}

          <Text style={styles.pageTitle}>
            {isUz ? 'Qoidalar va Shartlar' : 'Правила и Условия'}
          </Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.lastUpdated}>
            {isUz ? "So'nggi yangilanish: 2026-yil 1-aprel" : 'Последнее обновление: 1 апреля 2026 г.'}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '1. Umumiy qoidalar' : '1. Общие правила'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? 'Ushbu hujjat "Milana Premium" savdo platformasidan foydalanish shartlarini belgilaydi. Platformadan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz. Barcha foydalanuvchilar, shu jumladan mijozlar, hamkorlar va xodimlar ushbu qoidalarga rioya qilishlari shart.'
                : 'Настоящий документ определяет условия использования торговой платформы «Milana Premium». Используя платформу, вы соглашаетесь с нижеуказанными условиями. Все пользователи, включая клиентов, партнёров и сотрудников, обязаны соблюдать данные правила.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '2. Buyurtma berish tartibi' : '2. Порядок оформления заказов'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "Buyurtmalar faqat ro'yxatdan o'tgan foydalanuvchilar tomonidan berilishi mumkin. Har bir buyurtma tasdiqlangan paytdan boshlab 48 soat ichida qayta ishlanadi. Buyurtma berilgandan keyin uni bekor qilish faqat ombor xodimi yoki buxgalter tomonidan amalga oshirilishi mumkin. Mahsulotlar zaxirasi cheklangan bo'lganligi sababli, buyurtma berish vaqtida mahsulot mavjudligiga kafolat berilmaydi."
                : 'Заказы могут быть оформлены только зарегистрированными пользователями. Каждый заказ обрабатывается в течение 48 часов с момента подтверждения. Отмена заказа после оформления возможна только сотрудником склада или бухгалтером. В связи с ограниченностью запасов, наличие товара в момент оформления заказа не гарантируется.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '3. Yetkazib berish shartlari' : '3. Условия доставки'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "Yetkazib berish O'zbekiston Respublikasi hududida amalga oshiriladi. Standart yetkazib berish muddati 2-5 ish kunini tashkil etadi. Maxsus buyurtmalar (50 dona va undan ortiq) uchun yetkazib berish muddati alohida kelishiladi. Yetkazib berish narxi buyurtma summasiga qarab o'zgarishi mumkin. 500 000 so'mdan yuqori buyurtmalar uchun yetkazib berish bepul."
                : 'Доставка осуществляется по территории Республики Узбекистан. Стандартный срок доставки составляет 2-5 рабочих дней. Для специальных заказов (от 50 единиц и выше) сроки доставки согласуются индивидуально. Стоимость доставки может варьироваться в зависимости от суммы заказа. Заказы на сумму свыше 500 000 сум доставляются бесплатно.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '4. Qaytarish siyosati' : '4. Политика возврата'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "Mahsulotlarni qaytarish buyurtma olingan kundan boshlab 14 kun ichida amalga oshirilishi mumkin. Qaytariladigan mahsulotlar asl holatida, yorliqlar saqlanib qolgan bo'lishi kerak. Shaxsiy gigiyena mahsulotlari (ichki kiyim) qaytarilmaydi. Qaytarish uchun ariza qoldirish kerak va uni "
                : 'Возврат товаров возможен в течение 14 дней с момента получения заказа. Возвращаемые товары должны быть в оригинальном состоянии с сохранёнными бирками. Товары личной гигиены (нижнее бельё) возврату не подлежат. Для возврата необходимо оставить заявку, которую рассматривает '}
              {renderTriggerWord(isUz ? 'OMBOR HODIMI' : 'СОТРУДНИК СКЛАДА', 'warehouse')}
              <Text style={styles.bodyText}>
                {isUz
                  ? " ko'rib chiqadi va 3 ish kuni ichida javob beradi."
                  : ' и отвечает в течение 3 рабочих дней.'}
              </Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '5. Narxlar va to\'lov' : '5. Цены и оплата'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "Barcha narxlar AQSh dollarida ko'rsatilgan va QQS ni o'z ichiga olmaydi. To'lov bank o'tkazmasi, naqd pul yoki muddatli to'lov orqali amalga oshirilishi mumkin. Ulgurji narxlar individual ravishda kelishiladi va minimal buyurtma miqdoriga bog'liq. Narxlar oldindan xabar berilmasdan o'zgartirilishi mumkin. Hisob-fakturalarni "
                : 'Все цены указаны в долларах США и не включают НДС. Оплата может быть произведена банковским переводом, наличными или в рассрочку. Оптовые цены обсуждаются индивидуально и зависят от минимального объёма заказа. Цены могут быть изменены без предварительного уведомления. Счета-фактуры выставляет '}
              {renderTriggerWord(isUz ? 'SOTUVCHI' : 'БУХГАЛТЕР', 'accountant')}
              <Text style={styles.bodyText}>
                {isUz
                  ? " tayyorlaydi va e-pochta orqali yuboradi."
                  : ' и отправляет по электронной почте.'}
              </Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '6. Maxfiylik siyosati' : '6. Политика конфиденциальности'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "Biz sizning shaxsiy ma'lumotlaringizni himoya qilishga intilamiz. To'plangan ma'lumotlar faqat buyurtmalarni qayta ishlash va xizmat ko'rsatishni yaxshilash maqsadida ishlatiladi. Uchinchi tomonlarga ma'lumotlar faqat qonunchilik talablari doirasida berilishi mumkin. Foydalanuvchilar istalgan vaqtda o'z ma'lumotlarini yangilash yoki o'chirishni so'rashi mumkin."
                : 'Мы стремимся защищать ваши персональные данные. Собранная информация используется исключительно для обработки заказов и улучшения качества обслуживания. Передача данных третьим лицам возможна только в рамках требований законодательства. Пользователи могут в любое время запросить обновление или удаление своих данных.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '7. Javobgarlik chegaralari' : '7. Ограничения ответственности'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "\"Milana Premium\" platformasi mahsulotlar sifatiga kafolat beradi, ammo fors-major holatlari (tabiiy ofatlar, hukumat qarorlari, logistik uzilishlar) natijasida kelib chiqadigan kechikishlar uchun javobgar bo'lmaydi. Platforma texnik nosozliklar tufayli vaqtincha ishlamasligi mumkin. Bunday hollarda barcha buyurtmalar qayta tiklanadi."
                : '«Milana Premium» гарантирует качество товаров, но не несёт ответственности за задержки, вызванные обстоятельствами непреодолимой силы (стихийные бедствия, правительственные решения, логистические сбои). Платформа может быть временно недоступна из-за технических неполадок. В таких случаях все заказы будут восстановлены.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '8. Xodimlar uchun ichki qoidalar' : '8. Внутренние правила для сотрудников'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "Barcha xodimlar ish vaqtida korporativ axloq qoidalariga rioya qilishlari shart. Mijozlarga xizmat ko'rsatishda hurmatli va professional munosabatda bo'lish talab etiladi. Har bir xodim, jumladan "
                : 'Все сотрудники обязаны соблюдать корпоративный кодекс этики в рабочее время. Требуется уважительное и профессиональное отношение к клиентам при обслуживании. Каждый сотрудник, включая '}
              {renderTriggerWord(isUz ? 'OMBOR HODIMI' : 'СОТРУДНИКА СКЛАДА', 'warehouse')}
              <Text style={styles.bodyText}>
                {isUz
                  ? " va "
                  : ' и '}
              </Text>
              {renderTriggerWord(isUz ? 'SOTUVCHI' : 'БУХГАЛТЕРА', 'accountant')}
              <Text style={styles.bodyText}>
                {isUz
                  ? ", kompaniya ichki tartib-qoidalariga rioya qilishi, konfidentsial ma'lumotlarni himoya qilishi va o'z vazifalarini mas'uliyat bilan bajarishi shart. Qoidalarni buzish intizomiy choralar ko'rilishiga sabab bo'lishi mumkin."
                  : ', обязан соблюдать внутренний распорядок компании, защищать конфиденциальную информацию и ответственно выполнять свои обязанности. Нарушение правил может повлечь за собой дисциплинарные меры.'}
              </Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isUz ? '9. Nizolarni hal qilish' : '9. Разрешение споров'}
            </Text>
            <Text style={styles.bodyText}>
              {isUz
                ? "Barcha nizolar avvalo muzokaralar orqali hal qilinadi. Agar kelishuvga erishilmasa, nizo O'zbekiston Respublikasi qonunchiligi asosida sudda ko'rib chiqiladi. Ushbu qoidalarning barcha bandlari O'zbekiston Respublikasi qonunchiligi bilan tartibga solinadi."
                : 'Все споры разрешаются прежде всего путём переговоров. В случае недостижения соглашения спор рассматривается в суде на основании законодательства Республики Узбекистан. Все положения настоящих правил регулируются законодательством Республики Узбекистан.'}
            </Text>
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              {isUz
                ? "Savollar bo'lsa, info@milanapremium.uz manziliga yozing yoki +998 71 250 93 91 raqamiga qo'ng'iroq qiling."
                : 'При возникновении вопросов пишите на info@milanapremium.uz или звоните по номеру +998 71 250 93 91.'}
            </Text>
          </View>
        </View>

        {isWeb && <GlobalFooter />}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalCard, isDesktop && styles.modalCardDesktop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalRole === 'warehouse'
                  ? t('warehouse')
                  : modalRole === 'accountant'
                    ? t('accountant')
                    : ''}
              </Text>
              <Pressable onPress={closeModal} style={styles.modalClose}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('username')}</Text>
              <TextInput
                style={[styles.modalInput, loginError && styles.modalInputError]}
                value={username}
                onChangeText={(v) => { setUsername(v); setLoginError(false); }}
                placeholder={isUz ? 'Loginni kiriting' : 'Введите логин'}
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('password')}</Text>
              <TextInput
                style={[styles.modalInput, loginError && styles.modalInputError]}
                value={password}
                onChangeText={(v) => { setPassword(v); setLoginError(false); }}
                placeholder={isUz ? 'Parolni kiriting' : 'Введите пароль'}
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {loginError && (
              <Text style={styles.modalError}>
                {isUz ? 'Login yoki parol noto\'g\'ri!' : 'Неверный логин или пароль!'}
              </Text>
            )}

            <Pressable
              onPress={handleStaffLogin}
              style={({ pressed }) => [styles.staffBtn, pressed && styles.staffBtnPressed]}
            >
              <LogIn size={16} color={Colors.white} />
              <Text style={styles.staffBtnText}>{t('loginBtn')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
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
    maxWidth: 800,
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  bodyText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  footerNote: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerNoteText: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 24,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
      },
    }),
  },
  modalCardDesktop: {
    maxWidth: 420,
    padding: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  staffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  staffBtnPressed: {
    backgroundColor: Colors.primaryDark,
  },
  staffBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  modalSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  modalSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  modalSepText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  modalField: {
    gap: 5,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 48,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  modalInputError: {
    borderColor: Colors.danger,
  },
  modalError: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '500' as const,
  },
  clientBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  clientBtnPressed: {
    backgroundColor: 'rgba(203,17,171,0.06)',
  },
  clientBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
