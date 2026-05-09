import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { useWebHeader } from '@/contexts/WebHeaderContext';
import { useHomepageConfig } from '@/contexts/HomepageConfigContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useDepartmentTheme } from '@/contexts/DepartmentThemeContext';
import GlobalFooter from '@/components/GlobalFooter';
import BrandPreFooter from '@/components/BrandPreFooter';
import HeroBanner from '@/components/HeroBanner';
import { globalWebScrollY } from '@/components/WebHeader';
import NewArrivalsCarousel from '@/components/NewArrivalsCarousel';
import EditorialGrid from '@/components/EditorialGrid';
import { useResponsive } from '@/hooks/useResponsive';
import { MAX_WIDTH } from '@/components/BoxedContainer';
import { Product, HeroDepartmentKey } from '@/types';

interface DepartmentShowroomContent {
  editorialLeft: { image: string; labelKey: string; titleKey: string; destKey: string };
  editorialRight: { image: string; labelKey: string; titleKey: string; destKey: string };
  seasonal: { image: string; overlineKey: string; headlineKey: string; destKey: string };
  masonryHero: { image: string; labelKey: string; sublabelKey: string; destKey: string };
  masonryTop: { image: string; labelKey: string; destKey: string };
  masonryBottom: { image: string; labelKey: string; destKey: string };
  collections: { url: string; labelKey: string; index: string; destKey: string }[];
}

const SHOWROOM_CONTENT: Record<string, DepartmentShowroomContent> = {
  all: {
    editorialLeft: { image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1100&fit=crop&q=80', labelKey: 'deptMen', titleKey: 'showroomMenClassic', destKey: 'editorial_men' },
    editorialRight: { image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1100&fit=crop&q=80', labelKey: 'deptWomen', titleKey: 'showroomWomenComfort', destKey: 'editorial_women' },
    seasonal: { image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&h=600&fit=crop&q=80', overlineKey: 'showroomKidsFor', headlineKey: 'showroomSeasonalHeadline', destKey: 'seasonal_kids' },
    masonryHero: { image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=900&h=1200&fit=crop&q=80', labelKey: 'masonryEssentials', sublabelKey: 'masonryEssentialsSub', destKey: 'masonry_hero' },
    masonryTop: { image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=700&fit=crop&q=80', labelKey: 'masonryNewArrivals', destKey: 'masonry_top' },
    masonryBottom: { image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=700&h=700&fit=crop&q=80', labelKey: 'masonryPremiumChoice', destKey: 'masonry_bottom' },
    collections: [
      { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&q=80', labelKey: 'collectionColMen', index: '01', destKey: 'staircase_men' },
      { url: 'https://images.unsplash.com/photo-1631947430066-48c30d57b943?w=600&h=800&fit=crop&q=80', labelKey: 'collectionColNight', index: '02', destKey: 'staircase_nightwear' },
      { url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&h=800&fit=crop&q=80', labelKey: 'collectionColKids', index: '03', destKey: 'staircase_kids' },
    ],
  },
  men: {
    editorialLeft: { image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=1100&fit=crop&q=80', labelKey: 'deptMen', titleKey: 'showroomMenSubOne', destKey: 'editorial_men' },
    editorialRight: { image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=800&h=1100&fit=crop&q=80', labelKey: 'deptMen', titleKey: 'showroomMenSubTwo', destKey: 'editorial_men' },
    seasonal: { image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1600&h=600&fit=crop&q=80', overlineKey: 'showroomMenSeasonOverline', headlineKey: 'showroomMenSeasonHeadline', destKey: 'seasonal_kids' },
    masonryHero: { image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=900&h=1200&fit=crop&q=80', labelKey: 'showroomMenEssentials', sublabelKey: 'showroomMenEssentialsSub', destKey: 'masonry_hero' },
    masonryTop: { image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=700&h=700&fit=crop&q=80', labelKey: 'showroomMenNewArrivals', destKey: 'masonry_top' },
    masonryBottom: { image: 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=700&h=700&fit=crop&q=80', labelKey: 'showroomMenPremium', destKey: 'masonry_bottom' },
    collections: [
      { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&q=80', labelKey: 'collectionMenBusiness', index: '01', destKey: 'staircase_men' },
      { url: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600&h=800&fit=crop&q=80', labelKey: 'collectionMenSport', index: '02', destKey: 'staircase_men' },
      { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=800&fit=crop&q=80', labelKey: 'collectionMenAccessories', index: '03', destKey: 'staircase_men' },
    ],
  },
  women: {
    editorialLeft: { image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1100&fit=crop&q=80', labelKey: 'deptWomen', titleKey: 'showroomWomenSubOne', destKey: 'editorial_women' },
    editorialRight: { image: 'https://images.unsplash.com/photo-1573612664822-d7d347da7b80?w=800&h=1100&fit=crop&q=80', labelKey: 'deptWomen', titleKey: 'showroomWomenSubTwo', destKey: 'editorial_women' },
    seasonal: { image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&h=600&fit=crop&q=80', overlineKey: 'showroomWomenSeasonOverline', headlineKey: 'showroomWomenSeasonHeadline', destKey: 'seasonal_kids' },
    masonryHero: { image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=900&h=1200&fit=crop&q=80', labelKey: 'showroomWomenEssentials', sublabelKey: 'showroomWomenEssentialsSub', destKey: 'masonry_hero' },
    masonryTop: { image: 'https://images.unsplash.com/photo-1631947430066-48c30d57b943?w=700&h=700&fit=crop&q=80', labelKey: 'showroomWomenNewArrivals', destKey: 'masonry_top' },
    masonryBottom: { image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=700&fit=crop&q=80', labelKey: 'showroomWomenPremium', destKey: 'masonry_bottom' },
    collections: [
      { url: 'https://images.unsplash.com/photo-1631947430066-48c30d57b943?w=600&h=800&fit=crop&q=80', labelKey: 'collectionWomenNight', index: '01', destKey: 'staircase_nightwear' },
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop&q=80', labelKey: 'collectionWomenDaily', index: '02', destKey: 'staircase_nightwear' },
      { url: 'https://images.unsplash.com/photo-1573612664822-d7d347da7b80?w=600&h=800&fit=crop&q=80', labelKey: 'collectionWomenRobes', index: '03', destKey: 'staircase_nightwear' },
    ],
  },
  kids: {
    editorialLeft: { image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&h=1100&fit=crop&q=80', labelKey: 'deptKids', titleKey: 'showroomKidsSubOne', destKey: 'staircase_kids' },
    editorialRight: { image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&h=1100&fit=crop&q=80', labelKey: 'deptKids', titleKey: 'showroomKidsSubTwo', destKey: 'staircase_kids' },
    seasonal: { image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1600&h=600&fit=crop&q=80', overlineKey: 'showroomKidsSeasonOverline', headlineKey: 'showroomSeasonalHeadline', destKey: 'seasonal_kids' },
    masonryHero: { image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=900&h=1200&fit=crop&q=80', labelKey: 'showroomKidsEssentials', sublabelKey: 'showroomKidsEssentialsSub', destKey: 'masonry_hero' },
    masonryTop: { image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=700&h=700&fit=crop&q=80', labelKey: 'showroomKidsNewArrivals', destKey: 'masonry_top' },
    masonryBottom: { image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=700&h=700&fit=crop&q=80', labelKey: 'showroomKidsPremium', destKey: 'masonry_bottom' },
    collections: [
      { url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=800&fit=crop&q=80', labelKey: 'collectionKidsSchool', index: '01', destKey: 'staircase_kids' },
      { url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&h=800&fit=crop&q=80', labelKey: 'collectionKidsHome', index: '02', destKey: 'staircase_kids' },
      { url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&h=800&fit=crop&q=80', labelKey: 'collectionKidsPlay', index: '03', destKey: 'staircase_kids' },
    ],
  },
};

interface EditorialShowroomProps {
  headerOffset: number;
  onScroll?: (e: any) => void;
  headerComponent?: React.ReactNode;
}

export default function EditorialShowroom({ headerOffset, onScroll, headerComponent }: EditorialShowroomProps) {
  const { t } = useAuth();
  const { products } = useProducts();
  const { enterCatalog, setSelectedTopCategory, navigateToSegment } = useWebHeader();
  const { getDestination } = useHomepageConfig();
  const { settings: ds } = useSiteSettings();
  const { theme: dt, activeDepartment } = useDepartmentTheme();

  const heroDeptKey: HeroDepartmentKey = useMemo(() => {
    if (activeDepartment === 'men' || activeDepartment === 'women' || activeDepartment === 'kids') {
      return activeDepartment;
    }
    return 'all';
  }, [activeDepartment]);

  const heroBanner = useMemo(
    () => ds.heroBanners?.[heroDeptKey] ?? ds.heroBanners?.all,
    [ds.heroBanners, heroDeptKey],
  );

  /**
   * Hero banner CMS payload.
   *
   * NOTE FOR FUTURE ADMIN PANEL INTEGRATION:
   * This object is the single source of truth for the hero banner content.
   * Currently it is hydrated from `SiteSettingsContext` (which already supports
   * admin edits via /accountant). When a real backend CMS is wired up, replace
   * the assignments below with a fetch (e.g. React Query) — the <HeroBanner />
   * component itself contains zero hardcoded copy and will update automatically.
   */
  const heroCMSData = useMemo(() => ({
    imageUrl: heroBanner?.imageUrl ?? '',
    title: heroBanner?.title ?? '',
    subtitle: heroBanner?.subtitle ?? '',
    buttonText: heroBanner?.buttonText ?? t('heroCTAText'),
    destinationUrl: heroBanner?.destinationUrl,
    videoUrl: (heroBanner as { videoUrl?: string | null } | undefined)?.videoUrl ?? null,
  }), [heroBanner, t]);

  const deptContent = useMemo(
    () => SHOWROOM_CONTENT[activeDepartment] ?? SHOWROOM_CONTENT.all,
    [activeDepartment],
  );

  /**
   * Image accessibility labels.
   * Exposed as variables so a future CMS layer can drive SEO-friendly alt text
   * per department/banner without touching markup.
   */
  const heroImageAlt: string = `${heroCMSData.title} — ${heroCMSData.subtitle}` || "Yangi mavsum ayollar kiyimlari kolleksiyasi";
  const secondaryImageAlt: string = `${t(deptContent.seasonal.headlineKey)} — ${t(deptContent.seasonal.overlineKey)}`;

  /**
   * Promo grid (masonry) image accessibility labels.
   * Defined as variables so a future CMS layer can drive SEO-friendly alt text
   * per department without touching markup.
   */
  const promoTallAlt: string = t('altPromoTall', "Mavsum tanlovi - Elegant paltolar");
  const promoTopSmallAlt: string = t('altPromoTopSmall', "Yangi xalatlar kolleksiyasi");
  const promoBottomSmallAlt: string = t('altPromoBottomSmall', "Kechki kolleksiya - Lyuks sumkalar");
  const promoTallAltTwo: string = t('altPromoTallTwo', "Kechki elegantlik - Premium kolleksiya");
  const promoTopSmallAltTwo: string = t('altPromoTopSmallTwo', "Yangi kolleksiya - Mavsumiy uslub");
  const promoBottomSmallAltTwo: string = t('altPromoBottomSmallTwo', "Tunggi nafosat - Lyuks kiyim");

  const responsive = useResponsive();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isDesktop = responsive.isDesktop && responsive.isWeb;
  const isMobile = responsive.isMobile;

  const editorialEntryAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: globalWebScrollY } } }],
    {
      useNativeDriver: false,
      listener: onScroll,
    }
  );

  useEffect(() => {
    Animated.timing(editorialEntryAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [editorialEntryAnim]);

  const buildContextualDestination = useCallback((segment: string, category?: string) => {
    const isDepartmentContext = activeDepartment === 'men' || activeDepartment === 'women' || activeDepartment === 'kids';
    if (isDepartmentContext) {
      return { segment: activeDepartment, category };
    }
    return { segment, category };
  }, [activeDepartment]);

  const navigateTo = useCallback((elementKey: string) => {
    const dest = getDestination(elementKey);
    const ctx = buildContextualDestination(dest.destination_segment, dest.destination_category);
    console.log(`[Showroom] ${elementKey} → dept=${activeDepartment} resolved=`, ctx.segment, ctx.category);
    navigateToSegment(ctx.segment, ctx.category);
  }, [getDestination, navigateToSegment, buildContextualDestination, activeDepartment]);

  const getHref = useCallback((elementKey: string) => {
    const dest = getDestination(elementKey);
    const ctx = buildContextualDestination(dest.destination_segment, dest.destination_category);
    return { pathname: '/(tabs)/catalog', params: { segment: ctx.segment, category: ctx.category } };
  }, [getDestination, buildContextualDestination]);

  const handleHeroCTA = useCallback(() => {
    const url = heroCMSData.destinationUrl || '/(tabs)/catalog';
    console.log('[Showroom] HeroBanner CTA navigating directly to:', url);
    router.push(url as any);
  }, [heroCMSData.destinationUrl]);
  const handleEditorialMen = useCallback(() => navigateTo('editorial_men'), [navigateTo]);
  const handleEditorialWomen = useCallback(() => navigateTo('editorial_women'), [navigateTo]);
  const handleSeasonalKids = useCallback(() => navigateTo('seasonal_kids'), [navigateTo]);
  const handleMasonryHero = useCallback(() => navigateTo('masonry_hero'), [navigateTo]);
  const handleMasonryTop = useCallback(() => navigateTo('masonry_top'), [navigateTo]);
  const handleMasonryBottom = useCallback(() => navigateTo('masonry_bottom'), [navigateTo]);
  const handleStaircaseMen = useCallback(() => navigateTo('staircase_men'), [navigateTo]);
  const handleStaircaseNightwear = useCallback(() => navigateTo('staircase_nightwear'), [navigateTo]);
  const handleStaircaseKids = useCallback(() => navigateTo('staircase_kids'), [navigateTo]);
  const handleExploreAll = useCallback(() => navigateTo('explore_all'), [navigateTo]);

  const staircaseHandlers = [handleStaircaseMen, handleStaircaseNightwear, handleStaircaseKids];

  const handleDeptAction = useCallback((destKey: string) => {
    const dest = getDestination(destKey);
    const ctx = buildContextualDestination(dest.destination_segment, dest.destination_category);
    navigateToSegment(ctx.segment, ctx.category);
  }, [getDestination, navigateToSegment, buildContextualDestination]);

  const heroHeight = Platform.OS === 'web'
    ? undefined
    : Math.min(screenHeight * 0.62, screenWidth * (625 / 1380));

  const editorialHeight = isDesktop ? 580 : isMobile ? 400 : 480;
  const collectionHeight = isDesktop ? 420 : isMobile ? 300 : 360;

  // TODO: Fetch these from Admin Panel / global translations in the future
  const pageStaticData = {
    viewAllBtn: "BARCHASINI KO'RISH",
  };

  const seasonPicks = React.useMemo(() => {
    const published = products.filter((p) => p.status === 'published' && p.price !== null && p.image);
    const trending = published.filter((p) => p.isTrending);
    const source = trending.length >= 4 ? trending : published;
    return source.slice(0, 4);
  }, [products]);



  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: dt.bgColor }}>
      {headerComponent}
      <Animated.ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerOffset },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      {/* HERO SECTION — single static banner driven by CMS */}
      <View style={[styles.heroContainer, Platform.OS === 'web' ? (styles.heroContainerWeb as any) : { height: heroHeight as any }]}>
        <HeroBanner
          imageUrl={heroCMSData.imageUrl}
          title={heroCMSData.title}
          subtitle={heroCMSData.subtitle}
          buttonText={heroCMSData.buttonText}
          destinationUrl={heroCMSData.destinationUrl}
          onPress={handleHeroCTA}
          overlayOpacity={dt.overlayOpacity}
          textAlignment={ds.heroTextAlignment}
          ctaBorderRadius={ds.ctaBorderRadius}
          ctaBgColor={ds.ctaBgColor}
          ctaTextColor={dt.ctaTextColor}
          headlineWeight={dt.heroHeadlineWeight}
          letterSpacing={dt.heroLetterSpacing}
          height={Platform.OS === 'web' ? ('100%' as unknown as number) : (heroHeight as number)}
          imageAlt={heroImageAlt}
          videoUrl={heroCMSData.videoUrl}
        />
      </View>

      {/* NEW ARRIVALS CAROUSEL (replaces editorial split) */}
      <Animated.View
        style={{
          opacity: editorialEntryAnim,
          transform: [{
            translateY: editorialEntryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            }),
          }],
        }}
      >
        <View style={{ width: '100%', maxWidth: 1380, alignSelf: 'center' }}>
          <NewArrivalsCarousel imageWidth={326.25} imageHeight={368.78} />
        </View>
        <View style={styles.viewAllWrap}>
          <Link href={getHref('explore_all') as any} asChild>
            <Pressable
              style={styles.viewAllButton}
              testID="showroom-view-all"
            >
              <Text style={styles.viewAllText}>{pageStaticData.viewAllBtn}</Text>
            </Pressable>
          </Link>
        </View>
      </Animated.View>

      {/* SECONDARY EDITORIAL BANNER — Mytheresa style: dual-hierarchy text above image */}
      <View style={styles.editorialBlock}>
        <View style={styles.secondaryEditorialTextWrap}>
          <Text style={styles.secondaryEditorialSubtitle}>{t(deptContent.seasonal.overlineKey)}</Text>
          <Text style={[styles.secondaryEditorialTitle, isMobile && styles.secondaryEditorialTitleMobile]}>{t(deptContent.seasonal.headlineKey)}</Text>
        </View>
        <Link href={getHref(deptContent.seasonal.destKey) as any} asChild>
        <Pressable
          style={StyleSheet.flatten([styles.seasonalBannerClean, isMobile ? styles.seasonalBannerRatioMobile : styles.seasonalBannerRatio])}
          testID="showroom-seasonal-banner"
        >
          <Image
            source={{ uri: deptContent.seasonal.image }}
            style={styles.seasonalImage}
            contentFit="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={secondaryImageAlt}
            alt={secondaryImageAlt}
            {...(Platform.OS === 'web' ? ({ role: 'img', 'aria-label': secondaryImageAlt } as any) : {})}
          />
        </Pressable>
        </Link>
      </View>

      {/* MAVSUM TANLOVI - ASYMMETRIC MASONRY (editorial, clean images) */}
      <EditorialGrid
        overline={t(deptContent.masonryHero.sublabelKey)}
        title={t('showroomSeasonChoice')}
        reverseLayout={false}
        marginTop={100}
        marginBottom={64}
        hero={{
          image: deptContent.masonryHero.image,
          caption: t(deptContent.masonryHero.labelKey),
          imageAlt: promoTallAlt,
          onPress: handleMasonryHero,
          href: getHref(deptContent.masonryHero.destKey),
          testID: 'masonry-hero',
        }}
        top={{
          image: deptContent.masonryTop.image,
          caption: t(deptContent.masonryTop.labelKey),
          imageAlt: promoTopSmallAlt,
          onPress: handleMasonryTop,
          href: getHref(deptContent.masonryTop.destKey),
          testID: 'masonry-top',
        }}
        bottom={{
          image: deptContent.masonryBottom.image,
          caption: t(deptContent.masonryBottom.labelKey),
          imageAlt: promoBottomSmallAlt,
          onPress: handleMasonryBottom,
          href: getHref(deptContent.masonryBottom.destKey),
          testID: 'masonry-bottom',
        }}
      />

      {/* YANGI KOLLEKSIYA - REVERSED ASYMMETRIC (Z-Pattern cascade) */}
      <EditorialGrid
        overline={t('showroomCollections')}
        title={t('showroomNewCollection')}
        reverseLayout={true}
        marginTop={0}
        marginBottom={20}
        hero={{
          image: deptContent.editorialLeft.image,
          caption: t(deptContent.editorialLeft.titleKey),
          imageAlt: promoTallAltTwo,
          onPress: handleEditorialMen,
          href: getHref(deptContent.editorialLeft.destKey),
          testID: 'editorial-reverse-hero',
        }}
        top={{
          image: deptContent.editorialRight.image,
          caption: t(deptContent.editorialRight.titleKey),
          imageAlt: promoTopSmallAltTwo,
          onPress: handleEditorialWomen,
          href: getHref(deptContent.editorialRight.destKey),
          testID: 'editorial-reverse-top',
        }}
        bottom={{
          image: deptContent.collections[0]?.url ?? deptContent.masonryTop.image,
          caption: t(deptContent.collections[0]?.labelKey ?? deptContent.masonryTop.labelKey),
          imageAlt: promoBottomSmallAltTwo,
          onPress: staircaseHandlers[0],
          href: getHref(deptContent.collections[0]?.destKey ?? deptContent.masonryTop.destKey),
          testID: 'editorial-reverse-bottom',
        }}
      />

      {/* KOLLEKSIYALAR - STAIRCASE */}
      <View style={[styles.collectionsSection, { backgroundColor: dt.bgColor }]}>
        <View style={styles.editorialTextAbove}>
          <Text style={[styles.editorialOverline, { color: dt.textMuted }]}>{t('showroomCollections')}</Text>
          <Text style={[styles.editorialTitle, { color: dt.textPrimary }, isMobile && styles.editorialTitleMobile]}>{t('showroomCollections')}</Text>
        </View>
        <View style={[
          styles.staircaseGrid,
          isMobile && styles.staircaseGridMobile,
        ]}>
          {deptContent.collections.map((col, idx) => {
            const collectionAlt = `${t(col.labelKey)} kolleksiyasi`;
            return (
              <Link key={idx} href={getHref(col.destKey) as any} asChild>
              <Pressable
                style={StyleSheet.flatten([styles.staircaseColumn, isMobile && styles.staircaseColumnMobile])}
                testID={`showroom-collection-${idx}`}
              >
                <View style={styles.staircaseImageWrap}>
                  <Image
                    source={{ uri: col.url }}
                    style={styles.staircaseImage}
                    contentFit="cover"
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={collectionAlt}
                    alt={collectionAlt}
                    {...(Platform.OS === 'web' ? ({ role: 'img', 'aria-label': collectionAlt } as any) : {})}
                  />
                </View>
                <Text
                  style={[styles.staircaseLabel, { color: dt.textPrimary }, isMobile && styles.staircaseLabelMobile]}
                  accessibilityRole="text"
                >
                  {t(col.labelKey)}
                </Text>
              </Pressable>
              </Link>
            );
          })}
        </View>

        {/* VIEW ALL — directly below the collection grid */}
        <View style={styles.collectionsViewAllWrap}>
          <Link href={getHref('explore_all') as any} asChild>
            <Pressable
              style={styles.viewAllButton}
              testID="showroom-collections-view-all"
            >
              <Text style={styles.viewAllText}>{pageStaticData.viewAllBtn}</Text>
            </Pressable>
          </Link>
        </View>

        {/* LUXURY DIVIDER */}
        <View style={[styles.luxuryDivider, { backgroundColor: dt.dividerColor ?? '#E5E5E5' }]} />
      </View>

      <BrandPreFooter />

      <GlobalFooter />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },

  heroContainer: {
    width: '100%',
    maxWidth: 1380,
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  heroContainerWeb: {
    aspectRatio: 1380 / 625,
    maxHeight: 625,
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTextBlockCenter: {
    alignItems: 'center' as const,
  },
  heroTextBlockRight: {
    alignItems: 'flex-end' as const,
  },
  topBanner: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  topBannerText: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 2.5,
    textAlign: 'center' as const,
  },
  heroTextBlock: {
    position: 'absolute' as const,
    bottom: 80,
    left: 64,
    right: 64,
  },
  heroTextBlockMobile: {
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center' as const,
  },
  heroOverline: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 4,
    marginBottom: 12,
  },
  heroOverlineMobile: {
    fontSize: 10,
    letterSpacing: 3,
    textAlign: 'center' as const,
  },
  heroHeadline: {
    fontSize: 42,
    fontWeight: '200' as const,
    color: '#FFFFFF',
    letterSpacing: 6,
    lineHeight: 52,
  },
  heroHeadlineMobile: {
    fontSize: 26,
    letterSpacing: 4,
    lineHeight: 34,
    textAlign: 'center' as const,
  },
  heroCTA: {
    marginTop: 32,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  heroCTAPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroCTAText: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  dotsRow: {
    position: 'absolute' as const,
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 12,
    zIndex: 10,
  },
  dot: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    height: 2,
  },

  editorialSection: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 20,
  },
  editorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    gap: 20,
  },
  editorialHeaderLine: {
    flex: 1,
    maxWidth: 80,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#CCCCCC',
  },
  editorialHeaderTitle: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#000000',
    letterSpacing: 6,
  },
  editorialGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  editorialGridMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  editorialCard: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  editorialImage: {
    ...StyleSheet.absoluteFillObject,
  },
  editorialCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  editorialCardText: {
    position: 'absolute' as const,
    bottom: 32,
    left: 28,
    right: 28,
  },
  editorialCardLabel: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 3,
    marginBottom: 8,
  },
  editorialCardTitle: {
    fontSize: 20,
    fontWeight: '300' as const,
    color: '#FFFFFF',
    letterSpacing: 3,
    lineHeight: 28,
  },
  editorialCardCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  editorialCardCTAText: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },

  seasonalBannerOuter: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  seasonalBanner: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  seasonalBannerClean: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  seasonalBannerRatio: {
    aspectRatio: 16 / 5,
  },
  seasonalBannerRatioMobile: {
    aspectRatio: 16 / 9,
  },
  editorialBlock: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 20,
  },
  editorialTextAbove: {
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  editorialOverline: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  editorialTitle: {
    fontSize: 38,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    textAlign: 'center' as const,
    width: '100%' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  editorialTitleMobile: {
    fontSize: 26,
  },
  viewAllWrap: {
    width: '100%' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 32,
    marginBottom: 16,
  },
  viewAllButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  viewAllButtonHover: {
    opacity: 0.85,
  },
  viewAllText: {
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
  secondaryEditorialTextWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
    marginBottom: 28,
    backgroundColor: 'transparent',
  },
  secondaryEditorialSubtitle: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '400' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  secondaryEditorialTitle: {
    fontSize: 26,
    color: '#000000',
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  secondaryEditorialTitleMobile: {
    fontSize: 20,
  },
  editorialCTABelow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 20,
  },
  editorialCTAText: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  masonryImageWrap: {
    width: '100%' as const,
    overflow: 'hidden' as const,
  },
  masonryCaption: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    marginTop: 14,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  seasonalImage: {
    ...StyleSheet.absoluteFillObject,
  },
  seasonalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  seasonalTextBlock: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonalOverline: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 4,
    marginBottom: 10,
  },
  seasonalOverlineMobile: {
    fontSize: 9,
    letterSpacing: 3,
  },
  seasonalHeadline: {
    fontSize: 24,
    fontWeight: '200' as const,
    color: '#FFFFFF',
    letterSpacing: 5,
    textAlign: 'center' as const,
  },
  seasonalHeadlineMobile: {
    fontSize: 18,
    letterSpacing: 3,
  },
  seasonalCTARow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  seasonalCTAText: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },

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

  seasonPicksSection: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: 100,
    paddingBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    paddingHorizontal: 24,
  },
  sectionHeaderLine: {
    flex: 1,
    maxWidth: 80,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#CCCCCC',
  },
  sectionHeaderTitle: {
    fontSize: 34,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: 0.2,
    textAlign: 'center' as const,
    width: '100%' as const,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Futura PT", "Trebuchet MS", "Century Gothic", "Avenir Next", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  masonryContainer: {
    flexDirection: 'row' as const,
    gap: 20,
    paddingHorizontal: 24,
  },
  masonryContainerMobile: {
    flexDirection: 'column' as const,
    gap: 14,
  },
  masonryHero: {
    flex: 6,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  masonryHeroMobile: {
    flex: undefined,
    width: '100%' as const,
  },
  masonryRight: {
    flex: 4,
    flexDirection: 'column' as const,
    gap: 20,
  },
  masonryRightMobile: {
    flex: undefined,
    flexDirection: 'row' as const,
    gap: 14,
  },
  masonrySmallCard: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  masonryImage: {
    ...StyleSheet.absoluteFillObject,
  },
  masonryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  masonryTextWrap: {
    position: 'absolute' as const,
    bottom: 36,
    left: 32,
    right: 32,
  },
  masonryLabel: {
    fontSize: 22,
    fontWeight: '200' as const,
    color: '#FFFFFF',
    letterSpacing: 5,
    lineHeight: 30,
  },
  masonryLabelMobile: {
    fontSize: 18,
    letterSpacing: 4,
    lineHeight: 26,
  },
  masonrySublabel: {
    fontSize: 12,
    fontWeight: '300' as const,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 2,
    marginTop: 8,
  },
  masonrySublabelMobile: {
    fontSize: 11,
  },
  masonryCTARow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 18,
  },
  masonryCTAText: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  masonrySmallTextWrap: {
    position: 'absolute' as const,
    bottom: 20,
    left: 20,
    right: 20,
  },
  masonrySmallLabel: {
    fontSize: 14,
    fontWeight: '300' as const,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  masonrySmallLabelMobile: {
    fontSize: 12,
    letterSpacing: 2,
  },

  collectionsSection: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: 100,
    paddingBottom: 60,
  },
  staircaseGrid: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 16,
    paddingHorizontal: 24,
    width: '100%' as const,
  },
  staircaseGridMobile: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 16,
  },
  staircaseColumn: {
    flex: 1,
  },
  staircaseColumnMobile: {
    flex: 1,
    marginTop: 0,
  },
  staircaseImageWrap: {
    width: '100%' as const,
    aspectRatio: 1,
    overflow: 'hidden' as const,
    backgroundColor: '#F5F5F5',
  },
  staircaseImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  staircaseIndexMobile: {
    fontSize: 10,
  },
  staircaseLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#000000',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
    marginTop: 12,
    fontFamily: Platform.select({
      web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
      ios: 'Futura-Medium',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }) as string,
  },
  staircaseLabelMobile: {
    fontSize: 11,
    letterSpacing: 0.2,
  },



  collectionsViewAllWrap: {
    width: '100%' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 32,
  },
  luxuryDivider: {
    width: '100%' as const,
    height: 1,
    backgroundColor: '#E5E5E5',
    marginTop: 32,
    marginBottom: 0,
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
  exploreSectionWrap: {
    alignItems: 'center' as const,
    paddingBottom: 80,
  },
  exploreAllBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: 'center' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  exploreAllBtnHover: {
    opacity: 0.85,
  },
  exploreAllText: {
    color: '#FFFFFF',
    fontSize: 11,
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
