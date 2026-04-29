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
import QueueItem from '../../components/QueueItem';
import { Colors } from '../../utils/colors';
import type { Booking, ServiceStatus, QueueData } from '../../types';

export default function FranchiseQueueScreen() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getQueue();
      setData(res.data);
    } catch {
      setError('Failed to load queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleAdvance = async (id: string, currentStatus: string) => {
    const nextMap: Record<string, ServiceStatus> = {
      onboarded:     'diagnosis',
      diagnosis:     'in_progress',
      in_progress:   'quality_check',
      quality_check: 'delivered',
    };
    const next = nextMap[currentStatus];
    if (!next) return;
    setAdvancing(id);
    try {
      await franchiseApi.updateBookingStatus(id, { status: next });
      await load(true);
    } catch {
      // silent
    } finally {
      setAdvancing(null);
    }
  };

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

  const { queue = [], capacity = 0, occupied = 0, availableSlots = 0 } = data ?? {};
  const pct = capacity ? Math.round((occupied / capacity) * 100) : 0;
  const capColor = pct >= 90 ? Colors.red : pct >= 70 ? Colors.yellow : Colors.green;

  return (
    <View style={styles.screen}>
      {/* Capacity summary */}
      <View style={styles.capCard}>
        <View style={styles.capRow}>
          <View>
            <Text style={styles.capFraction}>{occupied} / {capacity}</Text>
            <Text style={styles.capLabel}>{availableSlots} slots available</Text>
          </View>
          <Text style={[styles.capPct, { color: capColor }]}>{pct}% full</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: capColor }]} />
        </View>
      </View>

      {/* Queue list */}
      <FlatList
        data={queue}
        keyExtractor={(b) => b._id}
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
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>No vehicles in queue</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <QueueItem
            item={item}
            position={index + 1}
            onAdvance={handleAdvance}
            advancing={advancing === item._id}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  retryBtn: { borderWidth: 1, borderColor: Colors.cyan, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 20 },
  retryText: { color: Colors.cyan, fontWeight: '600' },

  capCard: {
    backgroundColor: Colors.bgCard,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  capRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  capFraction: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  capLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  capPct: { fontSize: 16, fontWeight: '700' },
  barBg: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },

  list: { padding: 14, paddingBottom: 32 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: Colors.textMuted, marginTop: 8 },
});
