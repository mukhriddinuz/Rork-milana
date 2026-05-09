import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

interface OrderStatusCardProps {
  orderNumber?: string;
  deliveryDate?: string;
  statusText?: string;
}

const PARCEL_IMAGE = 'https://r2-pub.rork.com/projects/sg2tk2u7ewsab1trx74ls/assets/5533382d-6cf2-4427-8716-238e3fc7c703.png';

export default function OrderStatusCard({
  orderNumber = '12345',
  deliveryDate = '06.04.2026',
  statusText,
}: OrderStatusCardProps) {
  const { t } = useAuth();
  const displayStatus = statusText ?? t('orderStatusCompleted');
  return (
    <View style={styles.card}>
      <Text style={styles.header}>{t('orderStatusTitle')}</Text>

      <View style={styles.contentRow}>
        <Image
          source={{ uri: PARCEL_IMAGE }}
          style={styles.parcelImage}
          contentFit="contain"
        />

        <View style={styles.infoColumn}>
          <Text style={styles.orderNumber}>{t('orderStatusNum').replace('{number}', orderNumber)}</Text>
          <Text style={styles.deliveryDate}>{t('orderStatusDelivered').replace('{date}', deliveryDate)}</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{displayStatus}</Text>
            <CheckCircle2 size={22} color="#2E7D32" fill="#A5D6A7" strokeWidth={2} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.2,
    borderColor: '#A5D6A7',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  header: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1B5E20',
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  parcelImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  infoColumn: {
    flex: 1,
    gap: 4,
  },
  orderNumber: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  deliveryDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500' as const,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1A1A2E',
    letterSpacing: 0.1,
  },
});
