import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { paymentAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import type { Payment } from '../types';
import { ClipboardList, Wrench, Settings, CreditCard } from 'lucide-react-native';

const PURPOSE_ICON: Record<string, React.ElementType> = {
  subscription: ClipboardList,
  service:      Wrench,
  part:         Settings,
  other:        CreditCard,
};

const PaymentsScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await paymentAPI.list();
      setPayments(res.data.payments || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner fullScreen text="Loading payments…" />;

  const totalPaid = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Payments" subtitle="Transaction history" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount Paid</Text>
          <Text style={styles.summaryAmount}>₹{totalPaid.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryCount}>{payments.filter((p) => p.status === 'success').length} successful transactions</Text>
        </Card>

        {payments.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <CreditCard size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.empty, { padding: 0 }]}>No payment records found.</Text>
            </View>
          </Card>
        ) : (
          payments.map((p) => {
            const IconComponent = PURPOSE_ICON[p.purpose] || CreditCard;
            return (
            <Card key={p._id} style={styles.payCard}>
              <View style={styles.payRow}>
                <View style={styles.payIcon}>
                  <IconComponent size={22} color={Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payPurpose}>{capitalize(p.purpose)} Payment</Text>
                  <Text style={styles.payDate}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  {p.razorpayPaymentId && (
                    <Text style={styles.payId} numberOfLines={1}>ID: {p.razorpayPaymentId}</Text>
                  )}
                </View>
                <View style={styles.payRight}>
                  <Text style={[styles.payAmount, p.status === 'success' ? styles.payAmountPaid : styles.payAmountFailed]}>
                    {p.status === 'refunded' ? '-' : ''}₹{p.amount.toLocaleString('en-IN')}
                  </Text>
                  <StatusBadge status={p.status} />
                </View>
              </View>
              {p.refundAmount && (
                <View style={styles.refundBadge}>
                  <Text style={styles.refundText}>Refunded ₹{p.refundAmount.toLocaleString('en-IN')}</Text>
                </View>
              )}
            </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const capitalize = (s: string) => s?.charAt(0).toUpperCase() + s?.slice(1);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 32 },
  summaryCard: {
    background: Colors.bgCard,
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
    borderColor: Colors.success,
  } as any,
  summaryLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryAmount: { fontSize: 36, fontWeight: '800', color: Colors.success, marginTop: 6 },
  summaryCount: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16 },
  payCard: { padding: 12 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgCardAlt, alignItems: 'center', justifyContent: 'center' },
  payPurpose: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  payDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  payId: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontFamily: 'monospace' },
  payRight: { alignItems: 'flex-end', gap: 4 },
  payAmount: { fontSize: 16, fontWeight: '800' },
  payAmountPaid: { color: Colors.success },
  payAmountFailed: { color: Colors.error },
  refundBadge: { marginTop: 8, backgroundColor: Colors.warningBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  refundText: { fontSize: 11, color: Colors.warning, fontWeight: '600' },
});

export default PaymentsScreen;
