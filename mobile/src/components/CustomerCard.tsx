import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/colors';
import { formatDate, initials } from '../utils/helpers';
import type { Customer } from '../types';

interface Props {
  customer: Customer;
  index: number;
}

export default function CustomerCard({ customer, index }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(customer.name)}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.email}>{customer.email}</Text>
          <Text style={styles.phone}>{customer.phone}</Text>
        </View>

        {/* Visit count badge */}
        <View style={styles.visitBadge}>
          <Text style={styles.visitCount}>{customer.totalVisits}</Text>
          <Text style={styles.visitLabel}>visits</Text>
          {customer.totalVisits >= 5 && <Text style={styles.loyal}>⭐ Loyal</Text>}
        </View>
      </View>

      {/* Vehicles */}
      {customer.vehicles.length > 0 && (
        <View style={styles.vehiclesRow}>
          {customer.vehicles.map((v) => (
            <View key={v} style={styles.vehicleChip}>
              <Text style={styles.vehicleChipText}>{v}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Last service */}
      {customer.lastServiceDate && (
        <Text style={styles.lastService}>
          Last service: {formatDate(customer.lastServiceDate)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.green },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  phone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  visitBadge: { alignItems: 'center' },
  visitCount: { fontSize: 20, fontWeight: '800', color: Colors.green },
  visitLabel: { fontSize: 10, color: Colors.textMuted },
  loyal: { fontSize: 10, marginTop: 2 },
  vehiclesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  vehicleChip: {
    backgroundColor: 'rgba(14,165,233,0.15)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  vehicleChipText: { fontSize: 11, color: '#0ea5e9', fontWeight: '600' },
  lastService: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
});
