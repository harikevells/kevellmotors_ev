import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { franchiseApi } from '../../api/franchiseApi';
import { Colors } from '../../utils/colors';
import { formatDate, formatINR, shortId } from '../../utils/helpers';
import type { RevenueData, Booking, WalletData, WalletTransaction } from '../../types';
import { Calendar, CalendarDays, Banknote, CreditCard, Upload, CheckCircle } from 'lucide-react-native';

// ── Revenue stat card ─────────────────────────────────────────────────────────
const RevCard = ({
  label,
  value,
  icon: IconComponent,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) => (
  <View style={[styles.revCard, { borderLeftColor: color }]}>
    <View style={styles.revIconContainer}>
      <IconComponent size={20} color={color} />
    </View>
    <Text style={[styles.revAmount, { color }]}>{formatINR(value)}</Text>
    <Text style={styles.revLabel}>{label}</Text>
  </View>
);

// ── Payment row ───────────────────────────────────────────────────────────────
const PayRow = ({ item }: { item: Booking }) => {
  const ps = item.paymentStatus || 'pending';
  const psStyle = ps === 'confirmed' ? Colors.green : ps === 'waived' ? Colors.yellow : Colors.textMuted;
  
  return (
    <View style={styles.payRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.payId}>{shortId(item._id)}</Text>
        <Text style={styles.payService}>{item.serviceType ?? '—'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.payAmount}>{formatINR(item.finalAmount)}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: psStyle, marginTop: 2, textTransform: 'capitalize' }}>
          {ps === 'confirmed' ? '✅ Confirmed' : ps === 'waived' ? '🔄 Waived' : '⏳ Pending'}
        </Text>
        <Text style={styles.payDate}>
          {formatDate(item.completedDate ?? (item as any).createdAt)}
        </Text>
      </View>
    </View>
  );
};

// ── Transaction row ───────────────────────────────────────────────────────────
const TransactionRow = ({ item }: { item: WalletTransaction }) => {
  const isCredit = item.type === 'credit';
  const isPending = item.status === 'pending';
  const color = isCredit ? Colors.green : item.type === 'redeem_request' ? Colors.yellow : Colors.blue;
  const IconComponent = isCredit ? CreditCard : item.type === 'redeem_request' ? Upload : CheckCircle;
  
  return (
    <View style={styles.payRow}>
      <View style={[styles.txIconBox, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
        <IconComponent size={16} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' }}>
          {item.type.replace(/_/g, ' ')}
        </Text>
        {item.note ? <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>{item.note}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color }}>
          {isCredit ? '+' : '-'}{formatINR(item.amount)}
        </Text>
        <Text style={[styles.txStatus, { color: isPending ? Colors.yellow : Colors.textMuted }]}>
          {item.status}
        </Text>
        <Text style={styles.payDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );
};

export default function FranchisePaymentsScreen() {
  const [revData, setRevData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getRevenue();
      setRevData(res.data);
    } catch {
      setError('Failed to load revenue data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { revenue = { today: 0, week: 0, month: 0 }, payments = [] } = revData ?? {};

  return (
    <View style={styles.screen}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}>
        <View style={styles.revGrid}>
          <RevCard label="Today" value={revenue.today} icon={Calendar as any} color="#0ea5e9" />
          <RevCard label="This Week" value={revenue.week} icon={CalendarDays as any} color="#8b5cf6" />
          <RevCard label="This Month" value={revenue.month} icon={Banknote as any} color={Colors.green} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Completed Payments</Text>
        </View>
        <View style={styles.list}>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payment records yet</Text>
          ) : (
            payments.map(item => <PayRow key={item._id} item={item} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  retryBtn: { borderWidth: 1, borderColor: Colors.cyan, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 20 },
  retryText: { color: Colors.cyan, fontWeight: '600' },

  tabContainer: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'center',
    gap: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0,229,255,0.15)',
  },
  tabText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: Colors.cyan,
  },

  revGrid: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  revCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  revIconContainer: { marginBottom: 6 },
  revAmount: { fontSize: 14, fontWeight: '800' },
  revLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  walletGrid: { flexDirection: 'row', gap: 10, padding: 14 },
  walletCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  walletAmount: { fontSize: 22, fontWeight: '800', marginTop: 8 },

  redeemBox: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  pendingBanner: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)', borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12 },
  pendingText: { color: Colors.yellow, fontSize: 12, fontWeight: '600' },
  fieldLabel: { color: Colors.textPrimary, fontWeight: '600', fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgInput,
  },
  primaryBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },

  sectionHeader: {
    padding: 14,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  list: { paddingHorizontal: 14, paddingBottom: 32 },
  payRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  payId: { fontSize: 11, fontFamily: 'monospace', color: Colors.textMuted },
  payService: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 2, textTransform: 'capitalize' },
  payAmount: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  payDate: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },

  txIconBox: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  txStatus: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },

  emptyText: { color: Colors.textMuted, textAlign: 'center', padding: 20 },
});
