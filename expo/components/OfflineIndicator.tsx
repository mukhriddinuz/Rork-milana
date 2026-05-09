import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { WifiOff, CloudOff, Check } from 'lucide-react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import Colors from '@/constants/colors';

export default function OfflineIndicator() {
  const { isOnline, wasOffline, dismissReconnected } = useNetwork();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showBanner = !isOnline || (isOnline && wasOffline);

  useEffect(() => {
    if (showBanner) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 80,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showBanner, slideAnim, opacityAnim]);

  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        dismissReconnected();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, dismissReconnected]);

  const isReconnected = isOnline && wasOffline;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.banner,
          isReconnected ? styles.reconnectedBanner : styles.offlineBanner,
        ]}
      >
        <View style={styles.iconContainer}>
          {isReconnected ? (
            <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <WifiOff size={16} color="#FFFFFF" strokeWidth={2} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isReconnected ? 'Qayta ulandi' : 'Oflayn rejim'}
          </Text>
          <Text style={styles.subtitle}>
            {isReconnected
              ? "Internet qayta tiklandi"
              : "Saqlangan ma'lumotlar ko'rsatilmoqda"}
          </Text>
        </View>
        {!isOnline && (
          <View style={styles.cloudIconWrap}>
            <CloudOff size={18} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        {isReconnected && (
          <Pressable
            onPress={dismissReconnected}
            style={styles.dismissBtn}
            testID="dismiss-reconnect"
          >
            <Text style={styles.dismissText}>OK</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 40,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    maxWidth: 360,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  offlineBanner: {
    backgroundColor: '#2C2C2E',
  },
  reconnectedBanner: {
    backgroundColor: '#2E7D32',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 1,
  },
  cloudIconWrap: {
    marginLeft: 8,
  },
  dismissBtn: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  dismissText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
