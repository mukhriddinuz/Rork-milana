import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { MAX_WIDTH } from '@/components/BoxedContainer';
import { useResponsive } from '@/hooks/useResponsive';
import { useDepartmentTheme } from '@/contexts/DepartmentThemeContext';

export interface EditorialGridItem {
  image: string;
  caption: string;
  imageAlt?: string;
  onPress?: () => void;
  testID?: string;
  href?: any;
}

interface EditorialGridProps {
  overline: string;
  /**
   * Section macro title — kept in the props for backward compatibility, but
   * intentionally NOT rendered. The Mytheresa benchmark only uses per-card
   * captions; an overarching group title broke the visual rhythm and added
   * dead vertical space between consecutive grids.
   */
  title: string;
  hero: EditorialGridItem;
  top: EditorialGridItem;
  bottom: EditorialGridItem;
  reverseLayout?: boolean;
  marginTop?: number;
  marginBottom?: number;
}

export default function EditorialGrid({
  overline,
  title,
  hero,
  top,
  bottom,
  reverseLayout = false,
  marginTop = 100,
  marginBottom = 20,
}: EditorialGridProps) {
  const responsive = useResponsive();
  const { theme: dt } = useDepartmentTheme();
  const isMobile = responsive.isMobile;

  // Exact Mytheresa benchmark proportions for the masonry promo grid.
  const heroAspect = 677.5 / 930;
  const smallAspect = 677.5 / 352.3;

  /**
   * Renders the centered "subtitle + title" pair above an image card.
   * Pure black, uppercase tracked subtitle, and a refined title — no left-aligned text.
   */
  const renderCardCaption = (cardSubtitle: string, cardTitle: string) => (
    <View style={styles.cardCaptionWrap}>
      <Text style={styles.cardSubtitle} numberOfLines={1}>
        {cardSubtitle}
      </Text>
      <Text
        style={styles.cardTitle}
        numberOfLines={2}
        accessibilityRole="header"
        {...(Platform.OS === 'web' ? ({ 'aria-level': 3 } as any) : {})}
      >
        {cardTitle}
      </Text>
    </View>
  );

  const heroImage = (
    <Link href={hero.href || '/catalog'} asChild>
    <Pressable
      onPress={hero.onPress}
      style={StyleSheet.flatten([styles.heroCol, isMobile && styles.heroColMobile])}
      testID={hero.testID}
    >
      {renderCardCaption(overline, hero.caption)}
      <View style={[styles.imageWrap, { aspectRatio: isMobile ? 3 / 4 : heroAspect }]}>
        <Image
          source={{ uri: hero.image }}
          style={styles.image}
          contentFit="cover"
          accessible
          accessibilityRole="image"
          accessibilityLabel={hero.imageAlt ?? hero.caption}
          alt={hero.imageAlt ?? hero.caption}
          {...(Platform.OS === 'web' ? ({ role: 'img', 'aria-label': hero.imageAlt ?? hero.caption } as any) : {})}
        />
      </View>
    </Pressable>
    </Link>
  );

  const rightSandwich = (
    <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>
      <Link href={top.href || '/catalog'} asChild>
      <Pressable
        onPress={top.onPress}
        style={StyleSheet.flatten([styles.smallCard, !isMobile && styles.smallCardDesktop])}
        testID={top.testID}
      >
        {renderCardCaption(overline, top.caption)}
        <View style={[styles.imageWrap, { aspectRatio: smallAspect }]}>
          <Image
            source={{ uri: top.image }}
            style={styles.image}
            contentFit="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={top.imageAlt ?? top.caption}
            alt={top.imageAlt ?? top.caption}
            {...(Platform.OS === 'web' ? ({ role: 'img', 'aria-label': top.imageAlt ?? top.caption } as any) : {})}
          />
        </View>
      </Pressable>
      </Link>

      <Link href={bottom.href || '/catalog'} asChild>
      <Pressable
        onPress={bottom.onPress}
        style={StyleSheet.flatten([styles.smallCard, !isMobile && styles.smallCardDesktop])}
        testID={bottom.testID}
      >
        {renderCardCaption(overline, bottom.caption)}
        <View style={[styles.imageWrap, { aspectRatio: smallAspect }]}>
          <Image
            source={{ uri: bottom.image }}
            style={styles.image}
            contentFit="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={bottom.imageAlt ?? bottom.caption}
            alt={bottom.imageAlt ?? bottom.caption}
            {...(Platform.OS === 'web' ? ({ role: 'img', 'aria-label': bottom.imageAlt ?? bottom.caption } as any) : {})}
          />
        </View>
      </Pressable>
      </Link>
    </View>
  );

  return (
    <View style={[styles.section, { backgroundColor: dt.bgColor, marginTop, marginBottom }]}>
      <View
        style={[
          styles.container,
          { gap: dt.masonryGap },
          isMobile && styles.containerMobile,
        ]}
      >
        {reverseLayout && !isMobile ? (
          <>
            {rightSandwich}
            {heroImage}
          </>
        ) : (
          <>
            {heroImage}
            {rightSandwich}
          </>
        )}
      </View>
    </View>
  );
}

const FUTURA = Platform.select({
  web: 'Futura, "Futura-Medium", "Trebuchet MS", Arial, sans-serif',
  ios: 'Futura-Medium',
  android: 'sans-serif-medium',
  default: 'sans-serif',
}) as string;

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  textAbove: {
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: '#000000',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
    fontFamily: FUTURA,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '400' as const,
    color: '#000000',
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    fontFamily: FUTURA,
  },
  sectionTitleMobile: {
    fontSize: 22,
  },
  cardCaptionWrap: {
    width: '100%' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: '#000000',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    textAlign: 'center' as const,
    fontFamily: FUTURA,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '400' as const,
    color: '#000000',
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    marginBottom: 20,
    fontFamily: FUTURA,
  },
  container: {
    flexDirection: 'row' as const,
    gap: 24,
    paddingHorizontal: 24,
    alignItems: 'stretch' as const,
  },
  containerMobile: {
    flexDirection: 'column' as const,
    gap: 14,
    alignItems: 'stretch' as const,
  },
  heroCol: {
    flex: 1,
    flexBasis: 0,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  heroColMobile: {
    flex: undefined,
    flexBasis: 'auto' as const,
    width: '100%' as const,
  },
  rightCol: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
    alignSelf: 'stretch' as const,
  },
  rightColMobile: {
    flex: undefined,
    flexBasis: 'auto' as const,
    flexDirection: 'column' as const,
    justifyContent: 'flex-start' as const,
    gap: 14,
    alignSelf: 'auto' as const,
  },
  smallCard: {
    width: '100%' as const,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  smallCardDesktop: {
    flexDirection: 'column' as const,
  },
  imageWrap: {
    width: '100%' as const,
    overflow: 'hidden' as const,
  },
  imageWrapFlex: {
    flex: 1,
    width: '100%' as const,
    minHeight: 0,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
});
