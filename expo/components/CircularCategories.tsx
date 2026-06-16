import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import { BREAKPOINTS } from '@/hooks/useResponsive';

interface CircularCategory {
  id: string;
  labelKey: string;
  image: string;
}

const circularCategories: CircularCategory[] = [
  {
    id: 'xalat',
    labelKey: 'catRobes',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=200&fit=crop',
  },
  {
    id: 'pijama',
    labelKey: 'catPajamas',
    image: 'https://images.unsplash.com/photo-1617331140180-e8262094733a?w=200&h=200&fit=crop',
  },
  {
    id: 'koylak',
    labelKey: 'catShirts',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&h=200&fit=crop',
  },
  {
    id: 'futbolka',
    labelKey: 'catTshirts',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
  },
  {
    id: 'shim',
    labelKey: 'catPants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&h=200&fit=crop',
  },
  {
    id: 'ichki_kiyim',
    labelKey: 'catUnderwear',
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=200&h=200&fit=crop',
  },
  {
    id: 'sochiq',
    labelKey: 'catTowels',
    image: 'https://images.unsplash.com/photo-1583845112203-29329902332e?w=200&h=200&fit=crop',
  },
  {
    id: 'choyshablar',
    labelKey: 'catBedsheets',
    image: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=200&h=200&fit=crop',
  },
];

interface CircularCategoriesProps {
  onSelect?: (categoryId: string) => void;
}

function CategoryItem({ cat, onSelect }: { cat: CircularCategory; onSelect?: (id: string) => void }) {
  const { t } = useAuth();
  const [hovered, setHovered] = useState(false);

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <Pressable
      key={cat.id}
      style={({ pressed }) => [
        styles.item,
        pressed && styles.itemPressed,
      ]}
      onPress={() => onSelect?.(cat.id)}
      testID={`category-circle-${cat.id}`}
      {...webHoverProps}
    >
      <View
        style={[
          styles.circle,
          hovered && styles.circleHovered,
          Platform.OS === 'web' && ({ transition: 'transform 0.2s ease, box-shadow 0.2s ease' } as any),
        ]}
      >
        <Image
          source={{ uri: cat.image }}
          style={styles.circleImage}
          contentFit="cover"
          transition={200}
        />
      </View>
      <Text
        style={[
          styles.label,
          hovered && styles.labelHovered,
          Platform.OS === 'web' && ({ transition: 'transform 0.2s ease' } as any),
        ]}
        numberOfLines={1}
      >
        {t(cat.labelKey)}
      </Text>
    </Pressable>
  );
}

export default function CircularCategories({ onSelect }: CircularCategoriesProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= BREAKPOINTS.mobile;

  if (isDesktop) {
    return (
      <View style={styles.desktopWrapper}>
        <View style={styles.desktopRow}>
          {circularCategories.map((cat) => (
            <CategoryItem key={cat.id} cat={cat} onSelect={onSelect} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {circularCategories.map((cat) => (
          <CategoryItem key={cat.id} cat={cat} onSelect={onSelect} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  desktopWrapper: {
    maxWidth: 1800,
    width: '96%',
    alignSelf: 'center',
  },
  desktopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 24,
  },
  item: {
    alignItems: 'center',
    width: 130,
  },
  itemPressed: {
    opacity: 0.75,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  circleHovered: {
    borderColor: '#DDDDDD',
  },
  circleImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A2E',
    textAlign: 'center',
  },
  labelHovered: {
    transform: [{ translateY: -4 }],
  },
});
