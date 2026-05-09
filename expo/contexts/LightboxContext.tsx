import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import createContextHook from '@nkzw/create-context-hook';
import * as ReactDOM from 'react-dom';

export const [LightboxProvider, useLightbox] = createContextHook(() => {
  const [uri, setUri] = useState<string | null>(null);

  const open = useCallback((next: string) => {
    if (!next) return;
    console.log('[Lightbox] open', next.slice(0, 80));
    setUri(next);
  }, []);

  const close = useCallback(() => {
    console.log('[Lightbox] close');
    setUri(null);
  }, []);

  return {
    open,
    close,
    uri,
    isOpen: !!uri,
  };
});

export function LightboxOverlay() {
  const { isOpen, close, uri } = useLightbox();
  const { width, height } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const zoom = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const zoomVal = useRef(1);
  const baseZoom = useRef(1);
  const basePinch = useRef(0);
  const panOffset = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  useEffect(() => {
    if (isOpen) {
      opacity.setValue(0);
      scale.setValue(0.96);
      zoom.setValue(1);
      tx.setValue(0);
      ty.setValue(0);
      zoomVal.current = 1;
      panOffset.current = { x: 0, y: 0 };
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 9 }),
      ]).start();
    }
  }, [isOpen, opacity, scale, zoom, tx, ty]);

  useEffect(() => {
    const listener = zoom.addListener(({ value }) => {
      zoomVal.current = value;
    });
    return () => zoom.removeListener(listener);
  }, [zoom]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0025;
      const next = Math.max(1, Math.min(4, zoomVal.current + delta));
      zoom.setValue(next);
      zoomVal.current = next;
      if (next === 1) {
        Animated.parallel([
          Animated.spring(tx, { toValue: 0, useNativeDriver: true }),
          Animated.spring(ty, { toValue: 0, useNativeDriver: true }),
        ]).start();
        panOffset.current = { x: 0, y: 0 };
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isOpen, zoom, tx, ty]);

  const handleDoubleTap = useCallback(() => {
    if (zoomVal.current > 1.1) {
      Animated.parallel([
        Animated.spring(zoom, { toValue: 1, useNativeDriver: true }),
        Animated.spring(tx, { toValue: 0, useNativeDriver: true }),
        Animated.spring(ty, { toValue: 0, useNativeDriver: true }),
      ]).start();
      zoomVal.current = 1;
      panOffset.current = { x: 0, y: 0 };
    } else {
      Animated.spring(zoom, { toValue: 2.3, useNativeDriver: true }).start();
      zoomVal.current = 2.3;
    }
  }, [zoom, tx, ty]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTap.current < 280) {
          handleDoubleTap();
        }
        lastTap.current = now;
        baseZoom.current = zoomVal.current;
        basePinch.current = 0;
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          const [t1, t2] = touches;
          const dx = t2.pageX - t1.pageX;
          const dy = t2.pageY - t1.pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (basePinch.current === 0) {
            basePinch.current = dist;
            return;
          }
          const next = Math.max(1, Math.min(4, baseZoom.current * (dist / basePinch.current)));
          zoom.setValue(next);
        } else if (zoomVal.current > 1.05) {
          tx.setValue(panOffset.current.x + gs.dx);
          ty.setValue(panOffset.current.y + gs.dy);
        }
      },
      onPanResponderRelease: () => {
        if (zoomVal.current <= 1) {
          Animated.parallel([
            Animated.spring(tx, { toValue: 0, useNativeDriver: true }),
            Animated.spring(ty, { toValue: 0, useNativeDriver: true }),
          ]).start();
          panOffset.current = { x: 0, y: 0 };
        } else {
          panOffset.current = {
            x: (tx as any).__getValue?.() ?? 0,
            y: (ty as any).__getValue?.() ?? 0,
          };
        }
      },
    }),
  ).current;

  if (!isOpen || !uri) return null;

  const imgMaxW = Math.min(width * 0.9, 1400);
  const imgMaxH = height * 0.9;

  const content = (
    <Animated.View style={[styles.root, { opacity }]} pointerEvents="auto" testID="lightbox-root">
      <Pressable style={styles.backdrop} onPress={close} testID="lightbox-backdrop" />

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.imageWrap,
            {
              width: imgMaxW,
              height: imgMaxH,
              transform: [{ scale }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={{
              width: '100%',
              height: '100%',
              transform: [{ translateX: tx }, { translateY: ty }, { scale: zoom }],
            }}
          >
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
              transition={180}
            />
          </Animated.View>
        </Animated.View>
      </View>

      <Pressable
        onPress={close}
        style={({ hovered }: any) => [
          styles.closeBtn,
          hovered && styles.closeBtnHover,
        ]}
        testID="lightbox-close"
      >
        <X size={20} color="#FFFFFF" strokeWidth={1.5} />
      </Pressable>
    </Animated.View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined' && document.body) {
    return ReactDOM.createPortal(content, document.body);
  }
  return content;
}

const styles = StyleSheet.create({
  root: {
    ...(Platform.OS === 'web'
      ? ({ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0 } as any)
      : StyleSheet.absoluteFillObject),
    backgroundColor: 'rgba(0,0,0,0.88)',
    zIndex: 2147483647,
    elevation: 9999,
    ...(Platform.OS === 'web' ? ({ cursor: 'zoom-out' } as any) : {}),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  imageWrap: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  image: {
    width: '100%' as const,
    height: '100%' as const,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 24,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    ...(Platform.OS === 'web'
      ? ({ transition: 'background-color 0.2s ease, border-color 0.2s ease', cursor: 'pointer' } as any)
      : {}),
  },
  closeBtnHover: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
