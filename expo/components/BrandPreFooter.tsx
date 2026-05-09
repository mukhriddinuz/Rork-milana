import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  TextInput,
} from 'react-native';
import { Package } from 'lucide-react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useDepartmentTheme } from '@/contexts/DepartmentThemeContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useResponsive } from '@/hooks/useResponsive';
import { MAX_WIDTH } from '@/components/BoxedContainer';

/** Custom thin-line mannequin form with integrated needle & thread spool. */
function MannequinIcon({ size = 28, color = '#000000', label }: { size?: number; color?: string; label?: string }) {
  const webA11y = Platform.OS === 'web' ? ({ 'aria-label': label, role: 'img' } as any) : {};
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessibilityLabel={label} {...webA11y}>
      <Path d="M10 7 C10 5 12 4 16 4 C20 4 22 5 22 7 L24 11 C24 13 22 14 20 14 L20 19 C20 21 18 22 16 22 C14 22 12 21 12 19 L12 14 C10 14 8 13 8 11 Z" stroke={color} strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" />
      <Line x1="16" y1="4" x2="16" y2="2" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Circle cx="16" cy="12" r="2" stroke={color} strokeWidth={1} />
      <Line x1="14.5" y1="12" x2="17.5" y2="12" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Path d="M18 12 C20 13 21 15 20 17" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="16" y1="22" x2="16" y2="28" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Path d="M11 30 L16 28 L21 30" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="28" x2="16" y2="30" stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

/** Custom thin-line aerodynamic delivery truck with motion trails. */
function DeliveryTruckIcon({ size = 28, color = '#000000', label }: { size?: number; color?: string; label?: string }) {
  const webA11y = Platform.OS === 'web' ? ({ 'aria-label': label, role: 'img' } as any) : {};
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessibilityLabel={label} {...webA11y}>
      <Path d="M11 11 L24 11 L24 22 L11 22 Z" stroke={color} strokeWidth={1} strokeLinejoin="round" />
      <Path d="M24 14 L28 14 C29 14 30 15 30 16 L30 22 L24 22 Z" stroke={color} strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M25 15.5 L28.5 15.5 L29 18 L25 18 Z" stroke={color} strokeWidth={1} strokeLinejoin="round" />
      <Circle cx="15" cy="23" r="2" stroke={color} strokeWidth={1} />
      <Circle cx="26" cy="23" r="2" stroke={color} strokeWidth={1} />
      <Line x1="2" y1="13" x2="9" y2="13" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="4" y1="17" x2="9" y2="17" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Line x1="1" y1="21" x2="9" y2="21" stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

const pageStaticData = {
  philosophyTitle: "MILANA PREMIUM",
  philosophyDescUz: "Biz faqat eng sifatli tabiiy materiallardan — paxta, viskoza, ipak va bambuk tolasidan — tikish uchun foydalanmiz. Har bir kiyim nafisligi, qulayligi va uzoq muddat xizmat qilishi bilan ajralib turadi. Milana Premium — bu sizning kundalik hayotingizga hashamat olib keluvchi brend.",
  philosophyDescRu: "Мы используем только лучшие натуральные материалы — хлопок, вискозу, шёлк и бамбуковое волокно. Каждое изделие отличается утончённостью, комфортом и долговечностью. Milana Premium — бренд, привносящий роскошь в вашу повседневную жизнь.",
  uspDesignTitle: "EKSKLYUZIV DIZAYN",
  uspDesignDesc: "Xaridor istagiga ko'ra individual modellar yaratish va premium darajada tikish xizmati.",
  uspWholesaleTitle: "ULGURJI HAMKORLIK",
  uspWholesaleDesc: "Biznesingiz uchun yuqori sifatli kiyimlarni eng qulay shartlarda yetkazib berish.",
  uspLogisticsTitle: "MDH BO'YLAB LOGISTIKA",
  uspLogisticsDesc: "Har qanday davlatga ishonchli, tezkor va xavfsiz yetkazib berish kafolati.",
  newsletterTitle: "YANGILIKLARDAN XABARDOR BO'LING",
  newsletterDesc: "Yangi kolleksiyalar va eksklyuziv takliflarni birinchi bo'lib oling.",
  newsletterBtn: "A'ZO BO'LISH",
};

/**
 * Brand pre-footer block: Philosophy, USP grid, and Newsletter signup.
 * Designed to appear directly above <GlobalFooter /> on key landing surfaces
 * (showroom + catalog) to reinforce brand trust.
 */
export default function BrandPreFooter() {
  const { theme: dt } = useDepartmentTheme();
  const { settings: ds } = useSiteSettings();
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;

  const philosophyEntryAnim = useRef(new Animated.Value(0)).current;
  const [newsletterValue, setNewsletterValue] = useState<string>('');

  const handleNewsletterSignup = useCallback(() => {
    const trimmed = newsletterValue.trim();
    if (!trimmed) {
      console.log('[BrandPreFooter] Newsletter signup skipped: empty input');
      return;
    }
    console.log('[BrandPreFooter] Newsletter signup submitted');
    setNewsletterValue('');
  }, [newsletterValue]);

  useEffect(() => {
    Animated.timing(philosophyEntryAnim, { toValue: 1, duration: 700, delay: 150, useNativeDriver: true }).start();
  }, [philosophyEntryAnim]);

  const designIconAlt = "Eksklyuziv dizayn manekeni";
  const wholesaleIconAlt = "Ulgurji hamkorlik qutisi";
  const logisticsIconAlt = "MDH bo'ylab logistika yuk mashinasi";

  return (
    <View>
      {/* BRAND PHILOSOPHY */}
      {ds.philosophySectionVisible && (
        <Animated.View
          style={[
            styles.philosophySection,
            { paddingTop: 24, paddingBottom: ds.sectionSpacing + 8 },
            {
              opacity: philosophyEntryAnim,
              transform: [{
                translateY: philosophyEntryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.philosophyInner}>
            <View style={[styles.philosophyAccent, { backgroundColor: dt.dividerColor }]} />
            <Text style={[styles.philosophyTitle, { color: dt.textPrimary }, isMobile && styles.philosophyTitleMobile]}>
              {pageStaticData.philosophyTitle}
            </Text>
            <Text style={[styles.philosophyBody, { color: dt.textSecondary }, isMobile && styles.philosophyBodyMobile]}>
              {pageStaticData.philosophyDescUz}
            </Text>
            <Text style={[styles.philosophyBody, { color: dt.textSecondary }, isMobile && styles.philosophyBodyMobile, { marginTop: 16 }]}>
              {pageStaticData.philosophyDescRu}
            </Text>
            <View style={[styles.philosophyAccentBottom, { backgroundColor: dt.dividerColor }]} />
          </View>
        </Animated.View>
      )}

      {/* USP — UNIQUE SELLING PROPOSITIONS */}
      <View style={styles.uspContainer}>
        <View style={styles.uspColumn}>
          <View style={styles.uspIconWrap}>
            <MannequinIcon size={40} color={dt.textPrimary ?? '#000000'} label={designIconAlt} />
          </View>
          <Text
            style={[styles.uspTitle, { color: dt.textPrimary ?? '#000000' }]}
            accessibilityRole="header"
            {...(Platform.OS === 'web' ? ({ 'aria-level': 4 } as any) : {})}
          >
            {pageStaticData.uspDesignTitle}
          </Text>
          <Text style={styles.uspSubtitle}>{pageStaticData.uspDesignDesc}</Text>
        </View>
        <View style={styles.uspColumn}>
          <View style={styles.uspIconWrap}>
            <Package
              size={40}
              strokeWidth={1}
              color={dt.textPrimary ?? '#000000'}
              accessibilityLabel={wholesaleIconAlt}
              {...(Platform.OS === 'web' ? ({ 'aria-label': wholesaleIconAlt, role: 'img' } as any) : {})}
            />
          </View>
          <Text
            style={[styles.uspTitle, { color: dt.textPrimary ?? '#000000' }]}
            accessibilityRole="header"
            {...(Platform.OS === 'web' ? ({ 'aria-level': 4 } as any) : {})}
          >
            {pageStaticData.uspWholesaleTitle}
          </Text>
          <Text style={styles.uspSubtitle}>{pageStaticData.uspWholesaleDesc}</Text>
        </View>
        <View style={styles.uspColumn}>
          <View style={styles.uspIconWrap}>
            <DeliveryTruckIcon size={40} color={dt.textPrimary ?? '#000000'} label={logisticsIconAlt} />
          </View>
          <Text
            style={[styles.uspTitle, { color: dt.textPrimary ?? '#000000' }]}
            accessibilityRole="header"
            {...(Platform.OS === 'web' ? ({ 'aria-level': 4 } as any) : {})}
          >
            {pageStaticData.uspLogisticsTitle}
          </Text>
          <Text style={styles.uspSubtitle}>{pageStaticData.uspLogisticsDesc}</Text>
        </View>
      </View>

      {/* NEWSLETTER */}
      <View style={styles.newsletterSection}>
        <Text
          style={styles.newsletterTitle}
          accessibilityRole="header"
          {...(Platform.OS === 'web' ? ({ 'aria-level': 3 } as any) : {})}
        >
          {pageStaticData.newsletterTitle}
        </Text>
        <Text style={styles.newsletterSubtitle}>{pageStaticData.newsletterDesc}</Text>
        <TextInput
          value={newsletterValue}
          onChangeText={setNewsletterValue}
          placeholder="Email yoki Telefon raqam *"
          placeholderTextColor="#999999"
          style={styles.newsletterInput}
          autoCapitalize="none"
          keyboardType="email-address"
          testID="prefooter-newsletter-input"
        />
        <Pressable
          onPress={handleNewsletterSignup}
          style={({ pressed, hovered }: any) => [
            styles.newsletterButton,
            (pressed || hovered) && styles.newsletterButtonHover,
          ]}
          testID="prefooter-newsletter-submit"
        >
          <Text style={styles.newsletterButtonText}>{pageStaticData.newsletterBtn}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  philosophySection: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  philosophyInner: {
    alignItems: 'center',
    maxWidth: 700,
    alignSelf: 'center',
  },
  philosophyAccent: {
    width: 1,
    height: 24,
    backgroundColor: '#CCCCCC',
    marginBottom: 16,
  },
  philosophyAccentBottom: {
    width: 1,
    height: 32,
    backgroundColor: '#CCCCCC',
    marginTop: 16,
  },
  philosophyTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 3,
    marginBottom: 16,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  philosophyTitleMobile: {
    fontSize: 11,
    letterSpacing: 3,
  },
  philosophyBody: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#555555',
    lineHeight: 22,
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    maxWidth: 700,
    alignSelf: 'center' as const,
    marginBottom: 32,
  },
  philosophyBodyMobile: {
    fontSize: 13,
    lineHeight: 22,
  },
  uspContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    flexWrap: 'wrap' as const,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center' as const,
    marginTop: 48,
    marginBottom: 64,
    paddingHorizontal: 16,
  },
  uspColumn: {
    width: '30%',
    minWidth: 200,
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  uspIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  uspTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#000000',
    marginTop: 0,
    marginBottom: 8,
    textAlign: 'center' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  uspSubtitle: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  newsletterSection: {
    width: '100%' as const,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center' as const,
    paddingHorizontal: 24,
    paddingBottom: 80,
    alignItems: 'center' as const,
  },
  newsletterTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 2,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    marginTop: 48,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  newsletterSubtitle: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center' as const,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  newsletterInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: '100%' as const,
    maxWidth: 400,
    alignSelf: 'center' as const,
    marginBottom: 16,
    fontSize: 13,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  newsletterButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%' as const,
    maxWidth: 400,
    alignSelf: 'center' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  newsletterButtonHover: {
    opacity: 0.85,
  },
  newsletterButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
});
