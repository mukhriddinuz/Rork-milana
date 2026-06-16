import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BREAKPOINTS } from '@/hooks/useResponsive';

export default function ProductImageScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(1);
  const baseScale = useRef(1);
  const basePinchDist = useRef(0);
  const lastTap = useRef(0);
  const panOffset = useRef({ x: 0, y: 0 });

  const isDesktop = Platform.OS === 'web' && width >= BREAKPOINTS.mobile;
  const maxImageSize = isDesktop ? Math.min(width * 0.55, height * 0.75) : Math.min(width - 48, height - insets.top - insets.bottom - 120);

  useEffect(() => {
    const listener = scale.addListener(({ value }) => {
      scaleValue.current = value;
    });
    return () => scale.removeListener(listener);
  }, [scale]);

  const handleClose = useCallback(() => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  }, [router, overlayOpacity]);

  const resetZoom = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    scaleValue.current = 1;
    panOffset.current = { x: 0, y: 0 };
  }, [scale, translateX, translateY]);

  const handleDoubleTap = useCallback(() => {
    if (scaleValue.current > 1.1) {
      resetZoom();
    } else {
      Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }).start();
      scaleValue.current = 2.5;
    }
  }, [scale, resetZoom]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,
      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          handleDoubleTap();
        }
        lastTap.current = now;
        baseScale.current = scaleValue.current;
        basePinchDist.current = 0;
        panOffset.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          const dx = t2.pageX - t1.pageX;
          const dy = t2.pageY - t1.pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (basePinchDist.current === 0) {
            basePinchDist.current = dist;
            return;
          }
          const newScale = Math.max(0.5, Math.min(5, baseScale.current * (dist / basePinchDist.current)));
          scale.setValue(newScale);
        } else if (scaleValue.current > 1.05) {
          translateX.setValue(panOffset.current.x + gs.dx);
          translateY.setValue(panOffset.current.y + gs.dy);
        }
      },
      onPanResponderRelease: () => {
        if (scaleValue.current < 1) {
          resetZoom();
        } else {
          panOffset.current = {
            x: (translateX as any).__getValue?.() ?? 0,
            y: (translateY as any).__getValue?.() ?? 0,
          };
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.003;
      const newScale = Math.max(1, Math.min(5, scaleValue.current + delta));
      scale.setValue(newScale);
      scaleValue.current = newScale;
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [scale]);

  return (
    <Animated.View style={[styles.container, { opacity: overlayOpacity }]}>
      <Pressable style={styles.backdrop} onPress={handleClose} testID="lightbox-backdrop" />

      <View style={styles.centerWrap} pointerEvents="box-none">
        <View
          style={[
            styles.imageCard,
            {
              width: maxImageSize,
              height: maxImageSize,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={handleClose} style={styles.imagePressable} testID="lightbox-image-press">
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                transform: [{ translateX }, { translateY }, { scale }],
              }}
            >
              <Image
                source={{ uri: uri ?? '' }}
                style={styles.image}
                contentFit="contain"
                transition={250}
              />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  imagePressable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
