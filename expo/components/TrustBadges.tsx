import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Truck, ShieldCheck, RotateCcw, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FontFamily } from '@/constants/typography';

const BADGES = [
  { Icon: Truck, label: "Bepul yetkazish", sub: "O'zbekiston bo'ylab" },
  { Icon: ShieldCheck, label: "Xavfsiz to'lov", sub: "Ma'lumotlar himoyalangan" },
  { Icon: RotateCcw, label: "14 kun qaytarish", sub: "Kafolatlangan qaytarish" },
  { Icon: Award, label: "Premium sifat", sub: "Asl brendlar" },
] as const;

export default function TrustBadges() {
  return (
    <View style={styles.container}>
      {BADGES.map(({ Icon, label, sub }) => (
        <View key={label} style={styles.badge}>
          <View style={styles.iconWrap}>
            <Icon size={20} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  badge: {
    alignItems: 'center',
    minWidth: 120,
    maxWidth: 160,
    gap: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  sub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    letterSpacing: 0.2,
  },
});
