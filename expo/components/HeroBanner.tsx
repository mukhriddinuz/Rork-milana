import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

interface HeroBannerProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  destinationUrl?: string;
  onPress?: () => void;
  overlayOpacity?: number;
  textAlignment?: 'left' | 'center' | 'right';
  ctaBorderRadius?: number;
  ctaBgColor?: string;
  ctaTextColor?: string;
  headlineWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700';
  letterSpacing?: number;
  height?: number | string;
  imageAlt?: string;
  videoUrl?: string | null;
}

export default function HeroBanner({
  imageUrl,
  title,
  subtitle,
  buttonText,
  destinationUrl,
  onPress,
  overlayOpacity = 0.32,
  textAlignment = 'left',
  ctaBorderRadius = 0,
  ctaBgColor = 'transparent',
  ctaTextColor = '#FFFFFF',
  headlineWeight = '200',
  letterSpacing = 6,
  height,
  imageAlt,
  videoUrl,
}: HeroBannerProps) {
  const resolvedAlt = imageAlt ?? `${title} — ${subtitle}`;
  const { height: screenHeight } = useWindowDimensions();
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [entryAnim, imageUrl]);

  const bannerHeight: number | string =
    height !== undefined
      ? (height as number | string)
      : Platform.OS === 'web'
        ? ('100%' as unknown as number)
        : screenHeight * 0.7;

  const isWeb = Platform.OS === 'web';
  const srOnlyStyle = isWeb
    ? ({
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      } as any)
    : undefined;

  return (
    <Animated.View
      style={[
        styles.container,
        { height: bannerHeight as any },
        {
          opacity: entryAnim,
          transform: [
            {
              translateY: entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
      ]}
      testID="hero-banner"
    >
      <Pressable
        onPress={onPress}
        style={styles.fullLink}
        accessibilityLabel={`${title} — ${subtitle}`}
        {...(isWeb
          ? ({
              accessibilityRole: 'link',
              href: destinationUrl,
              style: [styles.fullLink, { cursor: 'pointer' } as any],
            } as any)
          : {})}
        testID="hero-banner-link"
      >
        <View style={styles.imageWrap}>
          {videoUrl ? (
            <Video
              source={{ uri: videoUrl }}
              style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}
              shouldPlay
              isLooping
              isMuted
              resizeMode={ResizeMode.COVER}
              accessibilityLabel={resolvedAlt}
            />
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              contentPosition="center"
              transition={300}
              accessible
              accessibilityRole="image"
              accessibilityLabel={resolvedAlt}
              alt={resolvedAlt}
              {...(isWeb
                ? ({ role: 'img', 'aria-label': resolvedAlt } as any)
                : {})}
            />
          )}
        </View>
        <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity * 0.3})` }]} />
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
          locations={[0, 0.55, 1]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />

        <View
          style={[
            styles.textBlock,
            textAlignment === 'center' && styles.textBlockCenter,
            textAlignment === 'right' && styles.textBlockRight,
          ]}
          pointerEvents="none"
        >
          <Text
            style={isWeb ? srOnlyStyle : styles.subtitleHidden}
            {...(isWeb
              ? ({ accessibilityRole: 'header', 'aria-level': 2 } as any)
              : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const })}
          >
            {subtitle}
          </Text>
          <Text
            style={[
              styles.title,
              { fontWeight: headlineWeight, letterSpacing },
            ]}
            {...(isWeb
              ? ({ accessibilityRole: 'header', 'aria-level': 1 } as any)
              : {})}
          >
            {title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  imageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  textBlock: {
    position: 'absolute' as const,
    bottom: 80,
    left: 64,
    right: 64,
  },
  textBlockCenter: {
    alignItems: 'center' as const,
  },
  textBlockRight: {
    alignItems: 'flex-end' as const,
  },
  fullLink: {
    ...StyleSheet.absoluteFillObject,
  },
  subtitleHidden: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  title: {
    fontSize: 42,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    lineHeight: 52,
  },
});
