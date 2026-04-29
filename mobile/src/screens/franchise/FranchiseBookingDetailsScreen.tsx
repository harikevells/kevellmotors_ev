import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Colors } from '../../utils/colors';
import { franchiseApi } from '../../api/franchiseApi';
import type { Booking } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FranchiseBookingDetailsScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await franchiseApi.getBookings();
        const b = res.data.bookings?.find((x: any) => x._id === bookingId);
        if (b) setBooking(b);
        else setError('Booking not found');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [bookingId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.cyan} />
        <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading details...</Text>
      </View>
    );
  }

  if (!booking || error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors.red }}>{error || 'Booking not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: Colors.cyan }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = booking.invoiceItems?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const total = subtotal + cgst + sgst;

  const isDelivered = booking?.status === 'delivered';
  const showInvoice = isDelivered && (booking?.invoiceItems?.length ?? 0) > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: isDelivered ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
        <Text style={[styles.statusText, { color: isDelivered ? Colors.green : Colors.yellow }]}>
          Status: {booking.status.replace(/_/g, ' ').toUpperCase()}
        </Text>
      </View>

      {/* Detail Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <DetailRow label="Name" value={booking.jobCard?.customerName || booking.owner?.name} />
        <DetailRow label="Phone" value={booking.jobCard?.customerContact || booking.owner?.phone} />
        <DetailRow label="Email" value={booking.owner?.email} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <DetailRow label="Registration" value={booking.jobCard?.regNo || booking.vehicle?.registrationNumber} />
        <DetailRow label="Make/Model" value={`${booking.jobCard?.make || booking.vehicle?.make} ${booking.jobCard?.model || booking.vehicle?.model}`} />
        <DetailRow label="Year" value={booking.jobCard?.year || booking.vehicle?.year} />
        <DetailRow label="Colour" value={booking.jobCard?.colour} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Information</Text>
        <DetailRow label="Type" value={booking.serviceType.toUpperCase()} />
        <DetailRow label="Scheduled" value={booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : '—'} />
        <DetailRow label="Odometer" value={booking.jobCard?.speedo ? `${booking.jobCard.speedo} KM` : '—'} />
      </View>

      {/* Professional Invoice Section */}
      {booking.invoiceNumber && (
        <View style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceHeaderTitle}>TAX INVOICE #{booking.invoiceNumber}</Text>
          </View>

          {/* Services */}
          <Text style={styles.tableTitle}>SERVICE DETAILS</Text>
          {booking.invoiceItems?.filter(i => i.type === 'service').map((item, idx) => (
            <View key={idx} style={styles.invoiceRow}>
              <Text style={styles.itemName}>{item.description}</Text>
              <Text style={styles.itemAmount}>₹{item.amount.toLocaleString()}</Text>
            </View>
          ))}

          {/* Parts */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.tableTitle}>SPARE PARTS</Text>
            {booking.invoiceItems?.filter(i => i.type === 'part').map((item, idx) => (
              <View key={idx} style={styles.partRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.itemName}>{item.description}</Text>
                  <Text style={styles.itemAmount}>₹{item.amount.toLocaleString()}</Text>
                </View>
                <Text style={styles.partMeta}>Qty: {item.quantity || 1}  |  Rate: ₹{item.rate?.toLocaleString() || '-'}</Text>
              </View>
            ))}
          </View>

          {/* Totals Box */}
          <View style={styles.totalsBox}>
            <SummaryRow label="Subtotal" value={subtotal} />
            <SummaryRow label="CGST (9%)" value={cgst} />
            <SummaryRow label="SGST (9%)" value={sgst} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
            </View>
          </View>

          {/* Banking */}
          <View style={styles.bankingSection}>
            <Text style={styles.bankingTitle}>BANKING DETAILS</Text>
            <Text style={styles.bankingText}>Indian Bank  |  Kevell Corp</Text>
            <Text style={styles.bankingText}>Acc: 7642668853  |  IFSC: IDIB000T003</Text>
          </View>
        </View>
      )}

      {booking.jobCard?.vehicleInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repair Instructions</Text>
          <Text style={styles.instructionText}>{booking.jobCard.vehicleInfo}</Text>
        </View>
      )}

      {booking.technicianNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technician Notes</Text>
          <Text style={styles.instructionText}>{booking.technicianNotes}</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string, value: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string, value: number }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>₹{value.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  
  statusBanner: { padding: 12, borderRadius: 10, marginBottom: 20, alignItems: 'center' },
  statusText: { fontWeight: '800', fontSize: 14, letterSpacing: 1 },

  section: { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { color: Colors.cyan, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: Colors.textSecondary, fontSize: 14 },
  detailValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  
  instructionText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },

  // Professional Invoice Styles
  invoiceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 16, borderWidth: 1, borderColor: '#e1e7ee' },
  invoiceHeader: { backgroundColor: '#007b7c', padding: 10, borderRadius: 6, marginBottom: 16 },
  invoiceHeaderTitle: { color: '#fff', fontWeight: '900', fontSize: 14, textAlign: 'center' },
  
  tableTitle: { color: '#007b7c', fontWeight: '800', fontSize: 12, marginBottom: 8, letterSpacing: 0.5 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemName: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '500' },
  itemAmount: { fontWeight: '700', color: '#1e293b', fontSize: 14 },
  
  partRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  partMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  
  totalsBox: { marginTop: 20, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '900', color: '#007b7c' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#007b7c' },
  
  bankingSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#e1e7ee', paddingTop: 12 },
  bankingTitle: { fontSize: 11, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  bankingText: { fontSize: 12, color: '#475569', marginBottom: 2 },
});
