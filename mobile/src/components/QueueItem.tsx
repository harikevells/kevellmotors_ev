import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../utils/colors';
import { formatDate } from '../utils/helpers';
import type { Booking } from '../types';

interface Props {
  item: Booking;
  position: number;
  onAdvance?: (id: string, currentStatus: string) => void;
  advancing?: boolean;
}

const NEXT_MAP: Record<string, string> = {
  onboarded:     'diagnosis',
  diagnosis:     'in_progress',
  in_progress:   'quality_check',
  quality_check: 'delivered',
};

const NEXT_LABEL: Record<string, string> = {
  onboarded:     'Accept',
  diagnosis:     'Start Service',
  in_progress:   'QC Check',
  quality_check: 'Complete',
};

export default function QueueItem({ item, position, onAdvance, advancing }: Props) {
  const statusColor = Colors.statusColors[item.status] ?? Colors.textMuted;
  const statusLabel = Colors.statusLabels[item.status] ?? item.status;
  const nextStatus = NEXT_MAP[item.status];
  const nextLabel = NEXT_LABEL[item.status];

  return (
    <View style={styles.container}>
      {/* Position badge */}
      <View style={[styles.posBadge, { backgroundColor: `${Colors.blue}1a`, borderColor: Colors.blue }]}>
        <Text style={[styles.posText, { color: Colors.blue }]}>#{position}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerName}>{item.owner?.name ?? '—'}</Text>
            <Text style={styles.vehicleText}>
              {item.vehicle?.registrationNumber} · {item.serviceType}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.scheduledDate)}</Text>
          </View>
          <View style={[styles.badge, { borderColor: statusColor, backgroundColor: `${statusColor}1a` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Advance button */}
        {nextStatus && onAdvance && (
          <TouchableOpacity
            style={[styles.advBtn, advancing && styles.advBtnDisabled]}
            onPress={() => onAdvance(item._id, item.status)}
            disabled={advancing}
          >
            <Text style={styles.advBtnText}>
              {advancing ? 'Updating…' : `→ ${nextLabel}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  posBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  posText: { fontSize: 13, fontWeight: '800' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ownerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  vehicleText: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  dateText: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  advBtn: {
    backgroundColor: 'rgba(26,110,247,0.12)',
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: 7,
    paddingVertical: 7,
    alignItems: 'center',
  },
  advBtnDisabled: { opacity: 0.45 },
  advBtnText: { color: Colors.blue, fontWeight: '700', fontSize: 12 },
});
