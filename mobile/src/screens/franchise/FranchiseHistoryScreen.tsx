import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { franchiseApi } from '../../api/franchiseApi';
import { Colors } from '../../utils/colors';
import { formatDate, formatINR, shortId } from '../../utils/helpers';
import type { Booking } from '../../types';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
] as const;

type Period = typeof PERIODS[number]['key'];

const HistoryRow = ({ item }: { item: Booking }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowName}>{item.owner?.name ?? '—'}</Text>
      <Text style={styles.rowSub}>
        {item.vehicle?.registrationNumber} · {item.serviceType}
      </Text>
      <Text style={styles.rowDate}>{formatDate(item.completedDate)}</Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={styles.rowId}>{shortId(item._id)}</Text>
      <Text style={styles.rowAmount}>{formatINR(item.finalAmount)}</Text>
    </View>
  </View>
);

export default function FranchiseHistoryScreen() {
  const [history, setHistory] = useState<Booking[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getHistory({ period });
      setHistory(res.data.history ?? []);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  return (
    <View style={styles.screen}>
      {/* Period filter */}
      <View style={styles.filterRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.filterBtn, period === p.key && styles.filterBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.filterText, period === p.key && styles.filterTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.cyan} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(h) => h._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.cyan}
              colors={[Colors.cyan]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No completed services for this period</Text>
            </View>
          }
          renderItem={({ item }) => <HistoryRow item={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  retryBtn: { borderWidth: 1, borderColor: Colors.cyan, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 20 },
  retryText: { color: Colors.cyan, fontWeight: '600' },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: Colors.bgInput,
  },
  filterBtnActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },

  list: { padding: 14, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  rowName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowId: { fontSize: 11, fontFamily: 'monospace', color: Colors.textMuted },
  rowAmount: { fontSize: 15, fontWeight: '800', color: Colors.green, marginTop: 4 },

  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
});
