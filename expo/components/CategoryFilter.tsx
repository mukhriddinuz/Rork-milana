import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Language, Category } from '@/types';

interface CategoryFilterProps {
  selected: string;
  onSelect: (categoryId: string) => void;
  language: Language;
  isDesktop: boolean;
  allLabel: string;
  categories: Category[];
}

function CategoryFilter({
  selected,
  onSelect,
  language,
  isDesktop,
  allLabel,
  categories,
}: CategoryFilterProps) {
  const allCategories = [{ id: 'all', uz: allLabel, ru: allLabel }, ...categories];

  const renderItem = useCallback(
    (cat: { id: string; uz: string; ru: string }) => {
      const isActive = selected === cat.id;
      const label = cat.id === 'all' ? allLabel : cat[language];
      return (
        <Pressable
          key={cat.id}
          onPress={() => onSelect(cat.id)}
          style={[
            isDesktop ? styles.sidebarItem : styles.chip,
            isActive && (isDesktop ? styles.sidebarItemActive : styles.chipActive),
          ]}
          testID={`category-${cat.id}`}
        >
          <Text
            style={[
              isDesktop ? styles.sidebarText : styles.chipText,
              isActive &&
                (isDesktop ? styles.sidebarTextActive : styles.chipTextActive),
            ]}
          >
            {label.toUpperCase()}
          </Text>
        </Pressable>
      );
    },
    [selected, language, isDesktop, allLabel, onSelect],
  );

  if (isDesktop) {
    return (
      <View style={styles.sidebar}>
        {allCategories.map(renderItem)}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipContainer}
    >
      {allCategories.map(renderItem)}
    </ScrollView>
  );
}

export default React.memo(CategoryFilter);

const styles = StyleSheet.create({
  sidebar: {
    paddingVertical: 4,
    gap: 1,
  },
  sidebarItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    borderLeftColor: '#000000',
  },
  sidebarText: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '400' as const,
    letterSpacing: 1.5,
  },
  sidebarTextActive: {
    color: '#000000',
  },
  chipContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  chipText: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '400' as const,
    letterSpacing: 1.5,
  },
  chipTextActive: {
    color: '#000000',
  },
});
