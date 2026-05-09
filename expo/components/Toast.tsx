import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

function Toast({ message, visible, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
    }
  }, [visible, translateY, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.dot} />
        <Text style={styles.message}>{message}</Text>
        <Pressable onPress={onDismiss} style={styles.dismiss}>
          <X size={14} color={Colors.white} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default React.memo(Toast);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.text,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  dismiss: {
    padding: 4,
  },
});
