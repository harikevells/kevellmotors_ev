import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/colors';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:       { label: 'Pending',       bg: '#1e293b', color: '#94a3b8' },
  onboarded:     { label: 'Onboarded',     bg: '#0f172a', color: '#818cf8' },
  diagnosis:     { label: 'Diagnosis',     bg: '#1a1200', color: '#fbbf24' },
  in_progress:   { label: 'In Progress',   bg: '#0f3460', color: '#38bdf8' },
  quality_check: { label: 'QC Check',      bg: '#1a1a00', color: '#facc15' },
  delivered:     { label: 'Delivered',     bg: '#052e16', color: '#4ade80' },
  cancelled:     { label: 'Cancelled',     bg: '#1c0505', color: '#ef4444' },
  active:        { label: 'Active',        bg: '#052e16', color: '#4ade80' },
  expired:       { label: 'Expired',       bg: '#1c0505', color: '#ef4444' },
  paid:          { label: 'Paid',          bg: '#052e16', color: '#4ade80' },
  failed:        { label: 'Failed',        bg: '#1c0505', color: '#ef4444' },
  refunded:      { label: 'Refunded',      bg: '#1a1700', color: '#fde68a' },
  confirmed:     { label: 'Confirmed',     bg: '#052e16', color: '#4ade80' },
  shipped:       { label: 'Shipped',       bg: '#0f3460', color: '#38bdf8' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const map = STATUS_MAP[status] ?? { label: status, bg: '#1e293b', color: '#94a3b8' };
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }, size === 'md' && styles.md]}>
      <Text style={[styles.text, { color: map.color }, size === 'md' && styles.textMd]}>
        {map.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  md: { paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  textMd: { fontSize: 13 },
});

export default StatusBadge;
