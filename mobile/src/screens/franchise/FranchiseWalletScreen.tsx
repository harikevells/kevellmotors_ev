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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Wallet, History, ArrowUpCircle, Banknote } from 'lucide-react-native';
import { franchiseApi } from '../../api/franchiseApi';
import { Colors } from '../../utils/colors';
import { formatDate, formatINR } from '../../utils/helpers';
import type { WalletData, WalletTransaction } from '../../types';

// ── Transaction row ───────────────────────────────────────────────────────────
const TransactionRow = ({ item }: { item: WalletTransaction }) => {
  const isCredit = item.type === 'credit';
  const isPending = item.status === 'pending';
  const color = isCredit ? Colors.green : item.type === 'redeem_request' ? Colors.yellow : Colors.blue;
  const Icon = isCredit ? Banknote : item.type === 'redeem_request' ? ArrowUpCircle : History;
  
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconBox, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.txType}>{item.type.replace(/_/g, ' ')}</Text>
        {item.note ? <Text style={styles.txNote}>{item.note}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txAmount, { color }]}>
          {isCredit ? '+' : '-'}{formatINR(item.amount)}
        </Text>
        <Text style={[styles.txStatus, { color: isPending ? Colors.yellow : Colors.textMuted }]}>
          {item.status}
        </Text>
        <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );
};

export default function FranchiseWalletScreen() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemNote, setRedeemNote] = useState('');
  const [redeemSaving, setRedeemSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getWallet();
      setWallet(res.data.wallet);
    } catch {
      setError('Failed to load wallet data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const transactions = (wallet?.transactions || []).slice().reverse();
  const pendingRequestsTotal = (wallet?.transactions || [])
    .filter(t => t.type === 'redeem_request' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const actualAvailable = (wallet?.pendingBalance || 0) - pendingRequestsTotal;
  const hasPendingRedeem = transactions.some(t => t.type === 'redeem_request' && t.status === 'pending');

  const handleRedeem = async () => {
    const amt = Number(redeemAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    
    if (amt > actualAvailable) {
      Alert.alert('Error', 'Amount exceeds actual available balance after accounting for pending requests.');
      return;
    }

    setRedeemSaving(true);
    try {
      const res = await franchiseApi.requestRedeem({ amount: amt, note: redeemNote });
      setWallet(res.data.wallet);
      setRedeemAmount('');
      setRedeemNote('');
      Alert.alert('Success', 'Redemption request submitted successfully.');
    } catch (err: any) {
      Alert.alert('Redeem Failed', err.response?.data?.message || 'Unable to submit request.');
    } finally {
      setRedeemSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.screen} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        data={transactions}
        keyExtractor={(item, idx) => item._id || String(idx)}
        renderItem={({ item }) => <TransactionRow item={item} />}
        ListHeaderComponent={
          <View>
            <View style={styles.balanceGrid}>
              <View style={[styles.balanceCard, { borderLeftColor: Colors.green }]}>
                <View style={styles.balanceLabelRow}>
                  <Banknote size={16} color={Colors.green} />
                  <Text style={styles.balanceLabel}>Available</Text>
                </View>
                <Text style={[styles.balanceValue, { color: Colors.green }]}>{formatINR(actualAvailable)}</Text>
                {pendingRequestsTotal > 0 && (
                  <Text style={styles.balanceSubtext}>
                    (₹{pendingRequestsTotal} pending)
                  </Text>
                )}
              </View>
              <View style={[styles.balanceCard, { borderLeftColor: Colors.blue }]}>
                <View style={styles.balanceLabelRow}>
                  <History size={16} color={Colors.blue} />
                  <Text style={styles.balanceLabel}>Redeemed</Text>
                </View>
                <Text style={[styles.balanceValue, { color: Colors.blue }]}>{formatINR(wallet?.balance || 0)}</Text>
              </View>
            </View>

            <View style={styles.redeemSection}>
              <View style={styles.inputCard}>
                <View style={styles.sectionHeader}>
                  <ArrowUpCircle size={20} color={Colors.cyan} />
                  <Text style={styles.sectionTitle}>Request Redemption</Text>
                </View>
                
                {hasPendingRedeem && (
                  <View style={styles.pendingBanner}>
                    <Text style={styles.pendingText}>⏳ You have a pending request awaiting admin approval.</Text>
                  </View>
                )}

                <View style={styles.form}>
                  <Text style={styles.fieldLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={redeemAmount}
                    onChangeText={setRedeemAmount}
                    editable={!hasPendingRedeem}
                  />
                  
                  <Text style={styles.fieldLabel}>Note (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Monthly payout request"
                    placeholderTextColor={Colors.textMuted}
                    value={redeemNote}
                    onChangeText={setRedeemNote}
                    editable={!hasPendingRedeem}
                    maxLength={120}
                  />

                  <TouchableOpacity 
                    style={[
                      styles.redeemBtn, 
                      (redeemSaving || hasPendingRedeem || actualAvailable <= 0 || !redeemAmount) && styles.btnDisabled
                    ]}
                    onPress={handleRedeem}
                    disabled={redeemSaving || hasPendingRedeem || actualAvailable <= 0 || !redeemAmount}
                  >
                    <Text style={styles.redeemBtnText}>{redeemSaving ? 'Submitting...' : 'Request Redemption'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Transaction History</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <History size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 40 },
  
  balanceGrid: { flexDirection: 'row', gap: 12, padding: 16 },
  balanceCard: { 
    flex: 1, 
    backgroundColor: Colors.bgCard, 
    borderRadius: 14, 
    borderLeftWidth: 4, 
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceValue: { fontSize: 22, fontWeight: '800' },
  balanceSubtext: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },

  redeemSection: { paddingHorizontal: 16, marginBottom: 24 },
  inputCard: { 
    backgroundColor: Colors.bgCard, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: Colors.border,
    padding: 18,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  
  pendingBanner: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  pendingText: { color: Colors.yellow, fontSize: 12, fontWeight: '600', textAlign: 'center' },

  form: { gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 2 },
  input: { 
    backgroundColor: Colors.bgInput, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: Colors.borderLight, 
    padding: 12, 
    color: Colors.textPrimary,
    fontSize: 14,
  },
  redeemBtn: { 
    backgroundColor: Colors.cyan, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginTop: 8,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemBtnText: { color: '#000000', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.4, shadowOpacity: 0 },

  historyHeader: { paddingHorizontal: 16, marginBottom: 8 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },

  txRow: { 
    flexDirection: 'row', 
    backgroundColor: Colors.bgCard, 
    marginHorizontal: 16, 
    marginBottom: 10, 
    borderRadius: 14, 
    padding: 14, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txIconBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  txType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  txNote: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '800' },
  txStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  txDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  emptyWrap: { alignItems: 'center', paddingTop: 60, opacity: 0.6 },
  emptyText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600', marginTop: 12 },
});
