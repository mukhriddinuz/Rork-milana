import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Link } from 'expo-router';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Package } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';
import NewArrivalsCarousel from '@/components/NewArrivalsCarousel';
import GlobalFooter from '@/components/GlobalFooter';
import { useDepartmentTheme } from '@/contexts/DepartmentThemeContext';
import { globalWebScrollY } from '@/components/WebHeader';

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

/**
 * Editorial showroom dedicated to the Men's department.
 * Architectural pattern (contrast to Women's masonry): strict horizontal product
 * carousels separated by heavy 50/50 split editorial blocks (image vs solid black
 * text panel). Alternating image side gives the section its masculine rhythm.
 */

interface CarouselHeaderProps {
  title: string;
  ctaLabel?: string;
  onPressCta?: () => void;
  href?: any;
}

/** Title + small bordered "View All" CTA placed inline next to it. */
function CarouselHeader({ title, ctaLabel = "BARCHASINI KO'RISH", href }: CarouselHeaderProps) {
  const destination = href || '/catalog';
  return (
    <View style={styles.carouselHeader} testID="mens-carousel-header">
      <Link href={destination} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={title} style={({ pressed }) => [pressed && styles.pressed]}>
          <Text style={styles.carouselTitle}>{title}</Text>
        </Pressable>
      </Link>
      <Link href={destination} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={ctaLabel}>
          {({ pressed }) => (
            <View style={[styles.viewAllSmall, pressed && styles.pressed]}>
              <Text style={styles.viewAllSmallText}>{ctaLabel}</Text>
            </View>
          )}
        </Pressable>
      </Link>
    </View>
  );
}

interface SplitBlockProps {
  image: string;
  imageAlt: string;
  title: string;
  subtitle: string;
  linkLabel?: string;
  href?: any;
  /** When true, the black text panel is on the left and image on the right. */
  reversed?: boolean;
}

/** 50/50 split: editorial image next to a pure-black text panel. */
function SplitEditorialBlock({
  image,
  imageAlt,
  title,
  subtitle,
  linkLabel = "Ko'proq kashf eting",
  href,
  reversed = false,
}: SplitBlockProps) {
  const { isMobile } = useResponsive();
  const destination = href || '/catalog';

  const ImagePane = (
    <View style={[styles.splitPane, isMobile && styles.splitPaneMobile]}>
      <Link href={destination} asChild>
        <Pressable style={styles.splitImagePressable} accessibilityRole="link" accessibilityLabel={imageAlt}>
          <Image
            source={{ uri: image }}
            style={styles.splitImage}
            contentFit="cover"
            accessibilityLabel={imageAlt}
            {...(Platform.OS === 'web' ? ({ alt: imageAlt } as object) : {})}
          />
        </Pressable>
      </Link>
    </View>
  );

  const TextPane = (
    <View style={[styles.splitPane, styles.splitPaneBlack, isMobile && styles.splitPaneMobile]}>
      <Text style={styles.splitTitle}>{title}</Text>
      <Text style={styles.splitSubtitle}>{subtitle}</Text>
      <Link href={destination} asChild>
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          accessibilityRole="link"
          accessibilityLabel={linkLabel}
        >
          <Text style={styles.splitLink}>{linkLabel}</Text>
        </Pressable>
      </Link>
    </View>
  );

  return (
    <View
      style={[
        styles.splitWrapper,
        isMobile && styles.splitWrapperMobile,
      ]}
      testID="mens-split-block"
    >
      {reversed ? (
        <>
          {TextPane}
          {ImagePane}
        </>
      ) : (
        <>
          {ImagePane}
          {TextPane}
        </>
      )}
    </View>
  );
}

interface MensEditorialShowroomProps {
  headerOffset?: number;
}

export default function MensEditorialShowroom({ headerOffset = 0 }: MensEditorialShowroomProps) {
  const { theme: dt } = useDepartmentTheme();
  const [newsletterValue, setNewsletterValue] = useState<string>('');

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: globalWebScrollY } } }],
    { useNativeDriver: false }
  );

  const handleNewsletterSignup = useCallback(() => {
    const trimmed = newsletterValue.trim();
    if (!trimmed) return;
    console.log('[MensShowroom] newsletter signup:', trimmed);
    setNewsletterValue('');
  }, [newsletterValue]);

  // TODO: Fetch these values from Admin Panel / DB / Global State in the future
  const brandInfoData = {
    title: 'MILANA PREMIUM',
    descUz: "Biz faqat eng sifatli tabiiy materiallardan — paxta, viskoza, ipak va bambuk tolasidan — tikish uchun foydalanamiz. Har bir kiyim nafisligi, qulayligi va uzoq muddat xizmat qilishi bilan ajralib turadi. Milana Premium — bu sizning kundalik hayotingizga hashamat olib keluvchi brend.",
    descRu: 'Мы используем только лучшие натуральные материалы — хлопок, вискозу, шёлк и бамбуковое волокно. Каждое изделие отличается утончённостью, комфортом и долговечностью. Milana Premium — бренд, приносящий роскошь в вашу повседневную жизнь.',
  };

  // TODO: Fetch these values from Admin Panel / DB / Global State in the future
  const heroBannerData = {
    imageUri: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=2000&h=900&fit=crop&q=80',
    videoUri: 'https://cdn.pixabay.com/video/2020/05/25/40141-424785461_large.mp4' as string | null,
    overline: "TO'LQINLAR YARATISH",
    title: "Hovuz bo'yidagi yangilanish",
    altText: "Hovuz bo'yidagi yangilanish. Kolleksiyaga o'tish.",
    linkHref: { pathname: '/(tabs)/catalog', params: { segment: 'men', collection: 'summer-refresh' } },
    textAlignment: 'right' as 'left' | 'center' | 'right',
  };

  // TODO: Fetch these from Admin Panel / DB in the future
  const editorialBlockAData = {
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1400&h=900&fit=crop&q=80',
    imageAlt: 'Moncler kayfiyati editorialiga rasm',
    title: 'Moncler kayfiyati',
    subtitle: "Shahar ritmi va alp havosi uyg'un bo'lgan yangi kapsulalar.",
    href: { pathname: '/(tabs)/catalog', params: { segment: 'men', collection: 'moncler' } },
  };

  // TODO: Fetch these from Admin Panel / DB in the future
  const carouselSectionData = {
    newArrivals: { title: 'YANGI KELGANLAR', href: { pathname: '/(tabs)/catalog', params: { segment: 'men', sort: 'new' } } },
    puffy: { title: 'PUFFY KOLLEKSIYA', href: { pathname: '/(tabs)/catalog', params: { segment: 'men', collection: 'puffy' } } },
    tailoring: { title: 'BICHIM VA KOSTYUMLAR', href: { pathname: '/(tabs)/catalog', params: { segment: 'men', category: 'suits' } } },
  };

  const editorialBlockBData = {
    image: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1400&h=900&fit=crop&q=80',
    imageAlt: 'Premium aksessuarlar editorialiga rasm',
    title: 'Premium aksessuarlar',
    subtitle: "Charm, ipak va metallning ehtiyotkorona uyg'unligi.",
    href: { pathname: '/(tabs)/catalog', params: { segment: 'men', collection: 'accessories' } },
  };

  return (
    <Animated.ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingTop: headerOffset }]}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      testID="mens-editorial-showroom"
    >
      {/* Hero banner (Dynamic) — bleeds out to wider 1380px editorial bound */}
      <Link href={heroBannerData.linkHref as any} asChild>
        <Pressable
          style={styles.hero}
          accessibilityRole="link"
          accessibilityLabel={heroBannerData.altText}
          testID="mens-hero-banner"
        >
          {heroBannerData.videoUri ? (
            <Video
              source={{ uri: heroBannerData.videoUri }}
              style={StyleSheet.absoluteFillObject}
              shouldPlay
              isLooping
              isMuted
              resizeMode={ResizeMode.COVER}
              accessibilityLabel={heroBannerData.title}
            />
          ) : (
            <Image
              source={{ uri: heroBannerData.imageUri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              accessibilityLabel={heroBannerData.title}
              {...(Platform.OS === 'web'
                ? ({ alt: heroBannerData.title, role: 'img' } as object)
                : {})}
            />
          )}
          <View style={[
            styles.heroOverlay,
            heroBannerData.textAlignment === 'left' && styles.heroOverlayLeft,
            heroBannerData.textAlignment === 'center' && styles.heroOverlayCenter,
            heroBannerData.textAlignment === 'right' && styles.heroOverlayRight,
          ]}>
            <Text style={[
              styles.heroOverline,
              heroBannerData.textAlignment === 'left' && styles.textLeft,
              heroBannerData.textAlignment === 'center' && styles.textCenter,
            ]}>{heroBannerData.overline}</Text>
            <Text style={[
              styles.heroTitle,
              heroBannerData.textAlignment === 'left' && styles.textLeft,
              heroBannerData.textAlignment === 'center' && styles.textCenter,
            ]}>{heroBannerData.title}</Text>
          </View>
        </Pressable>
      </Link>

      {/* Carousel 1: New Arrivals */}
      <View style={styles.carouselSection}>
        <CarouselHeader title={carouselSectionData.newArrivals.title} href={carouselSectionData.newArrivals.href as any} />
        <View style={styles.carouselClip}>
          <NewArrivalsCarousel hideTitle={true} strictBounds={true} imageWidth={326.25} imageHeight={368.78} />
        </View>
      </View>

      {/* Split block A (Dynamic) */}
      <SplitEditorialBlock
        image={editorialBlockAData.image}
        imageAlt={editorialBlockAData.imageAlt}
        title={editorialBlockAData.title}
        subtitle={editorialBlockAData.subtitle}
        href={editorialBlockAData.href as any}
      />

      {/* Carousel 2: Puffy Collection */}
      <View style={styles.carouselSection}>
        <CarouselHeader title={carouselSectionData.puffy.title} href={carouselSectionData.puffy.href as any} />
        <View style={styles.carouselClip}>
          <NewArrivalsCarousel hideTitle={true} strictBounds={true} imageWidth={326.25} imageHeight={368.78} />
        </View>
      </View>

      {/* Split block B (Dynamic) */}
      <SplitEditorialBlock
        reversed
        image={editorialBlockBData.image}
        imageAlt={editorialBlockBData.imageAlt}
        title={editorialBlockBData.title}
        subtitle={editorialBlockBData.subtitle}
        href={editorialBlockBData.href as any}
      />

      {/* Carousel 3: Tailoring */}
      <View style={styles.carouselSection}>
        <CarouselHeader title={carouselSectionData.tailoring.title} href={carouselSectionData.tailoring.href as any} />
        <View style={styles.carouselClip}>
          <NewArrivalsCarousel hideTitle={true} strictBounds={true} imageWidth={326.25} imageHeight={368.78} />
        </View>
      </View>

      {/* BRAND INFO (Dynamic) */}
      <View style={styles.brandInfoSection}>
        <View style={styles.brandInfoDivider} />
        <Text style={styles.brandInfoTitle}>{brandInfoData.title}</Text>
        <Text style={styles.brandInfoText}>{brandInfoData.descUz}</Text>
        <Text style={styles.brandInfoTextRu}>{brandInfoData.descRu}</Text>
        <View style={styles.brandInfoDivider} />
      </View>

      {/* USP — UNIQUE SELLING PROPOSITIONS */}
      <View style={styles.uspContainer}>
        <View style={styles.uspColumn}>
          <View style={styles.uspIconWrap}>
            <MannequinIcon size={40} color={dt.textPrimary ?? '#000000'} label="Eksklyuziv dizayn" />
          </View>
          <Text
            style={[styles.uspTitle, { color: dt.textPrimary ?? '#000000' }]}
            accessibilityRole="header"
            {...(Platform.OS === 'web' ? ({ 'aria-level': 4 } as any) : {})}
          >
            EKSKLYUZIV DIZAYN
          </Text>
          <Text style={styles.uspSubtitle}>
            Xaridor istagiga ko&apos;ra individual modellar yaratish va premium darajada tikish xizmati.
          </Text>
        </View>
        <View style={styles.uspColumn}>
          <View style={styles.uspIconWrap}>
            <Package
              size={40}
              strokeWidth={1}
              color={dt.textPrimary ?? '#000000'}
              accessibilityLabel="Ulgurji hamkorlik"
              {...(Platform.OS === 'web' ? ({ 'aria-label': 'Ulgurji hamkorlik', role: 'img' } as any) : {})}
            />
          </View>
          <Text
            style={[styles.uspTitle, { color: dt.textPrimary ?? '#000000' }]}
            accessibilityRole="header"
            {...(Platform.OS === 'web' ? ({ 'aria-level': 4 } as any) : {})}
          >
            ULGURJI HAMKORLIK
          </Text>
          <Text style={styles.uspSubtitle}>
            Biznesingiz uchun yuqori sifatli kiyimlarni eng qulay shartlarda yetkazib berish.
          </Text>
        </View>
        <View style={styles.uspColumn}>
          <View style={styles.uspIconWrap}>
            <DeliveryTruckIcon size={40} color={dt.textPrimary ?? '#000000'} label="MDH bo'ylab logistika" />
          </View>
          <Text
            style={[styles.uspTitle, { color: dt.textPrimary ?? '#000000' }]}
            accessibilityRole="header"
            {...(Platform.OS === 'web' ? ({ 'aria-level': 4 } as any) : {})}
          >
            MDH BO&apos;YLAB LOGISTIKA
          </Text>
          <Text style={styles.uspSubtitle}>
            Har qanday davlatga ishonchli, tezkor va xavfsiz yetkazib berish kafolati.
          </Text>
        </View>
      </View>

      {/* NEWSLETTER SIGN UP */}
      <View style={styles.newsletterSection}>
        <Text
          style={styles.newsletterTitle}
          accessibilityRole="header"
          {...(Platform.OS === 'web' ? ({ 'aria-level': 3 } as any) : {})}
        >
          YANGILIKLARDAN XABARDOR BO&apos;LING
        </Text>
        <Text style={styles.newsletterSubtitle}>
          Yangi kolleksiyalar va eksklyuziv takliflarni birinchi bo&apos;lib oling.
        </Text>
        <TextInput
          value={newsletterValue}
          onChangeText={setNewsletterValue}
          placeholder="Email yoki Telefon raqam *"
          placeholderTextColor="#999999"
          style={styles.newsletterInput}
          autoCapitalize="none"
          keyboardType="email-address"
          testID="mens-newsletter-input"
        />
        <Pressable
          onPress={handleNewsletterSignup}
          style={({ pressed, hovered }: any) => [
            styles.newsletterButton,
            (pressed || hovered) && styles.newsletterButtonHover,
          ]}
          testID="mens-newsletter-submit"
        >
          <Text style={styles.newsletterButtonText}>A&apos;ZO BO&apos;LISH</Text>
        </Pressable>
      </View>

      <GlobalFooter />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    width: '100%',
    maxWidth: 1380,
    aspectRatio: 1380 / 624.19,
    alignSelf: 'center',
    backgroundColor: '#111111',
    overflow: 'hidden',
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 40,
    zIndex: 2,
  },
  heroOverlayRight: {
    right: 40,
    alignItems: 'flex-end',
  },
  heroOverlayLeft: {
    left: 40,
    alignItems: 'flex-start',
  },
  heroOverlayCenter: {
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
  textCenter: {
    textAlign: 'center',
  },
  heroOverline: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#000000',
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '500',
    textAlign: 'right',
    paddingTop: 10,
  },

  carouselSection: {
    width: '100%',
    maxWidth: 1380,
    alignSelf: 'center',
    paddingTop: 56,
    paddingBottom: 24,
  },
  carouselClip: {
    width: '100%',
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1.5,
    color: '#000000',
    textTransform: 'uppercase',
    fontFamily: Platform.select({ web: 'Futura, "Futura-Medium", sans-serif', default: 'sans-serif' }),
  },
  viewAllSmall: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllSmallText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ web: 'Futura, "Futura-Medium", sans-serif', default: 'sans-serif' }),
  },
  pressed: {
    opacity: 0.7,
  },

  splitWrapper: {
    width: '100%',
    maxWidth: 1380,
    alignSelf: 'center',
    flexDirection: 'row',
    marginVertical: 32,
  },
  splitWrapperMobile: {
    flexDirection: 'column',
    marginVertical: 24,
  },
  splitPane: {
    flex: 1,
    maxWidth: 690,
    height: 623.75,
  },
  splitPaneMobile: {
    width: '100%',
    maxWidth: undefined as unknown as number,
    height: undefined as unknown as number,
    aspectRatio: 16 / 9,
    flex: undefined as unknown as number,
  },
  splitPaneBlack: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 0,
    paddingHorizontal: 30,
  },
  splitImagePressable: {
    width: '100%',
    height: '100%',
  },
  splitImage: {
    width: '100%',
    height: '100%',
  },
  splitTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '400',
    marginBottom: 16,
    textAlign: 'left',
  },
  splitSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'left',
    opacity: 0.85,
    maxWidth: 420,
  },
  splitLink: {
    color: '#FFFFFF',
    fontSize: 12,
    textDecorationLine: 'underline',
    fontWeight: '600',
    letterSpacing: 1,
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
  brandInfoSection: {
    width: '100%' as const,
    maxWidth: 800,
    alignSelf: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 64,
    paddingHorizontal: 24,
  },
  brandInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DDDDDD',
    marginVertical: 16,
  },
  brandInfoTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 2,
    color: '#000000',
    marginBottom: 16,
  },
  brandInfoText: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 16,
  },
  brandInfoTextRu: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  newsletterSection: {
    width: '100%' as const,
    maxWidth: 1380,
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
