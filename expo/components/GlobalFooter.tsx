import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { Send, Instagram, Smartphone } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useResponsive } from '@/hooks/useResponsive';

interface FooterLinkProps {
  label: string;
  onPress?: () => void;
}

function FooterLink({ label, onPress }: FooterLinkProps) {
  const [hovered, setHovered] = React.useState<boolean>(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [linkStyles.wrap, (pressed || hovered) && linkStyles.pressed]}
    >
      <Text style={[linkStyles.text, hovered && linkStyles.textHover]}>{label}</Text>
    </Pressable>
  );
}

const linkStyles = StyleSheet.create({
  wrap: {
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#000000',
    lineHeight: 28,
    textAlign: 'center' as const,
  },
  textHover: {
    opacity: 0.7,
  },
});

function GlobalFooter() {
  const { t } = useAuth();
  const responsive = useResponsive();
  const { settings: ds } = useSiteSettings();
  const isDesktop = responsive.isWebDesktop;
  const isMobile = responsive.isMobile;

  if (Platform.OS !== 'web') return null;

  return (
    <View style={[styles.outer, { backgroundColor: ds.footerBgColor }]}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <View
          style={[
            styles.columnsWrap,
            isDesktop && styles.columnsWrapDesktop,
            isMobile && styles.columnsWrapMobile,
          ]}
        >
          <View style={styles.column}>
            <Text style={styles.columnTitle}>{t('footerServices')}</Text>
            <FooterLink label={t('footerCustomerCare')} />
            <FooterLink label={t('footerContactLink')} />
            <FooterLink label={t('footerDeliveryLink')} />
            <FooterLink label={t('footerReturns')} />
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>{t('footerCompanyCol')}</Text>
            <FooterLink label={t('footerAboutLink')} />
            <FooterLink label={t('footerCareersLink')} />
            <FooterLink label={t('footerStoresLink')} />
            <FooterLink label={t('footerSustainability')} />
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>{t('footerApps')}</Text>
            <View style={styles.appBadgesRow}>
              <Pressable style={styles.appBadge}>
                <Smartphone size={14} color="#FFFFFF" strokeWidth={1.4} />
                <Text style={styles.appBadgeText}>App Store</Text>
              </Pressable>
              <Pressable style={styles.appBadge}>
                <Smartphone size={14} color="#FFFFFF" strokeWidth={1.4} />
                <Text style={styles.appBadgeText}>Google Play</Text>
              </Pressable>
            </View>
            <View style={styles.socialRow}>
              <Pressable
                onPress={() => Linking.openURL('https://instagram.com/milanapremium').catch(() => {})}
                style={styles.socialBtn}
                accessibilityLabel="Instagram"
                {...(Platform.OS === 'web' ? ({ 'aria-label': 'Instagram' } as any) : {})}
              >
                <Instagram size={20} color="#000000" strokeWidth={1.4} />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL('https://t.me/milanapremium').catch(() => {})}
                style={styles.socialBtn}
                accessibilityLabel="Telegram"
                {...(Platform.OS === 'web' ? ({ 'aria-label': 'Telegram' } as any) : {})}
              >
                <Send size={20} color="#000000" strokeWidth={1.4} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.copyright}>
            {t('footerCopyright').replace('{year}', String(new Date().getFullYear()))}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default React.memo(GlobalFooter);

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#F2F2F2',
    width: '100%',
    marginTop: 'auto' as any,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 28,
  },
  containerDesktop: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
    paddingTop: 72,
    paddingBottom: 32,
  },
  columnsWrap: {
    gap: 40,
  },
  columnsWrapDesktop: {
    flexDirection: 'row' as const,
    gap: 0,
    justifyContent: 'space-around' as const,
    alignItems: 'flex-start' as const,
  },
  columnsWrapMobile: {
    gap: 36,
    paddingBottom: 20,
  },
  column: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 0,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
  },
  appBadgesRow: {
    flexDirection: 'row' as const,
    gap: 10,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
  },
  appBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  appBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  socialRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 16,
    marginTop: 24,
  },
  socialBtn: {
    padding: 4,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DCDCDC',
    marginTop: 56,
    paddingTop: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 20,
    flexWrap: 'wrap' as const,
  },
  copyright: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#555555',
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  staffLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  staffLinkText: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#555555',
    letterSpacing: 0.5,
  },
});
