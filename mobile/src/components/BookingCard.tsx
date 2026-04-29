import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../utils/colors';
import { formatDate, shortId } from '../utils/helpers';
import type { Booking } from '../types';

interface Props {
  booking: Booking;
  onAdvance?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  onViewInvoice?: (booking: Booking) => void;
  onAddInvoice?: (booking: Booking) => void;
  onChangePaymentStatus?: (booking: Booking) => void;
  onJobCard?: (booking: Booking) => void;
  onViewDetails?: (booking: Booking) => void;
  onLogisticsUpdate?: (booking: Booking, type: 'pickup' | 'drop', current: string) => void;
  busy?: boolean;
}

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  onboarded:     { status: 'diagnosis',     label: 'Accept' },
  diagnosis:     { status: 'in_progress',   label: 'Start Service' },
  in_progress:   { status: 'quality_check', label: 'QC Check' },
  quality_check: { status: 'delivered',     label: 'Mark Complete' },
};

export default function BookingCard({
  booking,
  onAdvance,
  onCancel,
  onViewInvoice,
  onAddInvoice,
  onChangePaymentStatus,
  onJobCard,
  onViewDetails,
  onLogisticsUpdate,
  busy,
}: Props) {
  const statusColor = Colors.statusColors[booking.status] ?? Colors.textMuted;
  const statusLabel = Colors.statusLabels[booking.status] ?? booking.status;
  const next = NEXT_STATUS[booking.status];
  const nextLabel = next?.status === 'delivered' ? 'Mark Complete' : next?.label;
  const hasInvoice = (booking.invoiceItems?.length ?? 0) > 0;

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ownerName}>{booking.owner?.name ?? '—'}</Text>
          <Text style={styles.subText}>
            {booking.vehicle?.registrationNumber} · {booking.vehicle?.make} {booking.vehicle?.model}
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: statusColor, backgroundColor: `${statusColor}1a` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Details row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>SERVICE</Text>
          <Text style={styles.detailValue}>{booking.serviceType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>DATE</Text>
          <Text style={styles.detailValue}>{formatDate(booking.scheduledDate)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>ID</Text>
          <Text style={styles.detailValue}>{shortId(booking._id)}</Text>
        </View>
        {booking.finalAmount != null && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>AMOUNT</Text>
            <Text style={[styles.detailValue, { color: Colors.green }]}>
              ₹{booking.finalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        )}
      </View>

      {booking.pickupRequested && (() => {
        const pickupDone = booking.pickupStatus === 'completed';
        const dropDone   = booking.dropStatus   === 'completed';

        if (!pickupDone) {
          return (
            <View style={styles.logisticsRow}>
              <TouchableOpacity
                style={[styles.logisticsBtn, styles.logisticsBtnPending, busy && styles.actionBtnDisabled]}
                onPress={() => onLogisticsUpdate?.(booking, 'pickup', booking.pickupStatus ?? 'none')}
                disabled={busy}
              >
                <Text style={[styles.logisticsBtnText, { color: Colors.yellow }]}>
                  🚛 Pickup
                </Text>
              </TouchableOpacity>
            </View>
          );
        }

        if (!dropDone) {
          return (
            <View style={styles.logisticsRow}>
              <TouchableOpacity
                style={[styles.logisticsBtn, styles.logisticsBtnDrop, busy && styles.actionBtnDisabled]}
                onPress={() => onLogisticsUpdate?.(booking, 'drop', booking.dropStatus ?? 'none')}
                disabled={busy}
              >
                <Text style={[styles.logisticsBtnText, { color: Colors.cyan }]}>
                  🏠 Drop
                </Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <View style={styles.logisticsRow}>
            <View style={[styles.logisticsBtn, styles.logisticsBtnSuccess]}>
              <Text style={[styles.logisticsBtnText, { color: Colors.green }]}>✅ Done</Text>
            </View>
          </View>
        );
      })()}

      <View style={styles.actionsRow}>
        {next && onAdvance && (
          <TouchableOpacity
            style={[styles.actionBtn, busy && styles.actionBtnDisabled]}
            onPress={() => onAdvance(booking)}
            disabled={busy}
          >
            <Text style={styles.actionBtnText}>{busy ? 'Updating…' : nextLabel}</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'delivered' && hasInvoice && onViewInvoice && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => onViewInvoice(booking)}
          >
            <Text style={styles.secondaryBtnText}>Invoice</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'delivered' && !hasInvoice && onAddInvoice && (
          <TouchableOpacity
            style={styles.warnBtn}
            onPress={() => onAddInvoice(booking)}
          >
            <Text style={styles.warnBtnText}>Add Invoice</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'delivered' && onChangePaymentStatus && (
          <TouchableOpacity
            style={[
              booking.paymentStatus === 'confirmed' ? styles.successBtn :
              booking.paymentStatus === 'waived' ? styles.warnBtn : styles.secondaryBtn
            ]}
            onPress={() => onChangePaymentStatus(booking)}
            disabled={busy}
          >
            <Text style={[
              booking.paymentStatus === 'confirmed' ? styles.successBtnText :
              booking.paymentStatus === 'waived' ? styles.warnBtnText : styles.secondaryBtnText
            ]}>
              {booking.paymentStatus === 'confirmed' ? '✅ Paid' :
               booking.paymentStatus === 'waived' ? '🔄 Waived' : '⏳ Pending'}
            </Text>
          </TouchableOpacity>
        )}

        {booking.status === 'onboarded' && onJobCard && (
          <TouchableOpacity
            style={styles.jobCardBtn}
            onPress={() => onJobCard(booking)}
          >
            <Text style={styles.jobCardBtnText}>Job Card</Text>
          </TouchableOpacity>
        )}

        {onViewDetails && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => onViewDetails(booking)}
          >
            <Text style={styles.secondaryBtnText}>View</Text>
          </TouchableOpacity>
        )}

        {booking.status !== 'delivered' && booking.status !== 'cancelled' && onCancel && (
          <TouchableOpacity
            style={[styles.dangerBtn, busy && styles.actionBtnDisabled]}
            onPress={() => onCancel(booking)}
            disabled={busy}
          >
            <Text style={styles.dangerBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ownerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  subText: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  detailItem: {},
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    backgroundColor: 'rgba(26,110,247,0.15)',
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { color: Colors.blue, fontWeight: '700', fontSize: 13 },
  secondaryBtn: {
    backgroundColor: 'rgba(26,110,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(26,110,247,0.35)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.blue, fontWeight: '700', fontSize: 13 },
  warnBtn: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  warnBtnText: { color: Colors.yellow, fontWeight: '700', fontSize: 13 },
  dangerBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dangerBtnText: { color: Colors.red, fontWeight: '700', fontSize: 13 },
  successBtn: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  successBtnText: { color: Colors.green, fontWeight: '700', fontSize: 13 },
  jobCardBtn: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  jobCardBtnText: { color: '#38bdf8', fontWeight: '700', fontSize: 13 },
  logisticsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  logisticsBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logisticsBtnPending: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  logisticsBtnDrop: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderColor: 'rgba(56,189,248,0.25)',
  },
  logisticsBtnSuccess: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  logisticsBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
