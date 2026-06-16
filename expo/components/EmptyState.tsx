import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { FontFamily } from '@/constants/typography';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container} testID="empty-state">
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.divider} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 20,
    opacity: 0.35,
  },
  divider: {
    width: 24,
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
});
