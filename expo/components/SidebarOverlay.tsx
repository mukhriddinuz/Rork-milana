import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { Category } from '@/types';

interface SidebarOverlayProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

function SidebarOverlay({ visible, onClose, selectedCategory, onSelectCategory }: SidebarOverlayProps) {
  const { language, t } = useAuth();
  const { categories } = useCategories();
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -320, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleSelect = useCallback((id: string) => {
    onSelectCategory(id);
    onClose();
  }, [onSelectCategory, onClose]);

  if (!visible && Platform.OS === 'web') {
    return null;
  }

  const allItems: { id: string; label: string }[] = [
    { id: 'all', label: t('all') },
    ...categories.map((c: Category) => ({ id: c.id, label: c[language] })),
  ];

  return (
    <View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.panelHeader} />
        {allItems.map((item) => {
          const isActive = selectedCategory === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={[
                styles.item,
                isActive && styles.itemActive,
              ]}
              testID={`sidebar-cat-${item.id}`}
            >
              <Text style={[
                styles.itemText,
                isActive && styles.itemTextActive,
              ]}>
                {item.label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

export default React.memo(SidebarOverlay);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
    top: Platform.OS === 'web' ? 100 : 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
  },
  panelHeader: {
    height: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 10,
  },
  itemActive: {
    backgroundColor: '#F5F5F5',
  },
  itemText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '400' as const,
    letterSpacing: 2,
  },
  itemTextActive: {
    fontWeight: '600' as const,
  },
});
