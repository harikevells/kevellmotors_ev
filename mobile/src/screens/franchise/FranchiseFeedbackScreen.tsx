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
import { formatDate } from '../../utils/helpers';
import type { FeedbackData, Review, FeedbackItem } from '../../types';

// ── Star rating ───────────────────────────────────────────────────────────────
const Stars = ({ rating }: { rating: number }) => (
  <View style={{ flexDirection: 'row' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Text key={n} style={{ color: n <= rating ? Colors.yellow : 'rgba(255,255,255,0.15)', fontSize: 14 }}>
        ★
      </Text>
    ))}
  </View>
);

// ── Review card ───────────────────────────────────────────────────────────────
const ReviewCard = ({ item }: { item: Review }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <View>
        <Text style={styles.cardName}>{item.user?.name ?? 'Anonymous'}</Text>
        <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Stars rating={item.rating} />
    </View>
    {item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
    {item.comment && <Text style={styles.cardComment}>{item.comment}</Text>}
    {item.isVerified && (
      <View style={styles.verifiedBadge}>
        <Text style={styles.verifiedText}>✓ Verified</Text>
      </View>
    )}
  </View>
);

// ── Feedback card ─────────────────────────────────────────────────────────────
const FeedCard = ({ item }: { item: FeedbackItem }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <View>
        <Text style={styles.cardName}>{item.service?.owner?.name ?? 'Customer'}</Text>
        <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Stars rating={item.rating} />
    </View>
    {item.comment && <Text style={styles.cardComment}>{item.comment}</Text>}
  </View>
);

export default function FranchiseFeedbackScreen() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [tab, setTab] = useState<'reviews' | 'feedbacks'>('reviews');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getFeedback();
      setData(res.data);
    } catch {
      setError('Failed to load feedback.');
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

  const { reviews = [], feedbacks = [] } = data ?? {};
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const listData = tab === 'reviews' ? reviews : feedbacks;

  return (
    <View style={styles.screen}>
      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.yellow }]}>
          <Text style={[styles.summaryVal, { color: Colors.yellow }]}>{avgRating}</Text>
          <Stars rating={Math.round(parseFloat(avgRating) || 0)} />
          <Text style={styles.summaryLbl}>Avg Rating</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#0ea5e9' }]}>
          <Text style={[styles.summaryVal, { color: '#0ea5e9' }]}>{reviews.length}</Text>
          <Text style={styles.summaryLbl}>Reviews</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#8b5cf6' }]}>
          <Text style={[styles.summaryVal, { color: '#8b5cf6' }]}>{feedbacks.length}</Text>
          <Text style={styles.summaryLbl}>Feedbacks</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'reviews' as const, label: '⭐ Reviews' },
          { key: 'feedbacks' as const, label: '💬 Feedbacks' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* List */}
      <FlatList
        data={listData as (Review | FeedbackItem)[]}
        keyExtractor={(item) => item._id}
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
            <Text style={styles.emptyIcon}>{tab === 'reviews' ? '⭐' : '💬'}</Text>
            <Text style={styles.emptyText}>No {tab} yet</Text>
          </View>
        }
        renderItem={({ item }) =>
          tab === 'reviews' ? (
            <ReviewCard item={item as Review} />
          ) : (
            <FeedCard item={item as FeedbackItem} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.red, textAlign: 'center', padding: 12 },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: 10,
    alignItems: 'center',
  },
  summaryVal: { fontSize: 22, fontWeight: '800' },
  summaryLbl: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 12,
  },
  tabBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 4,
  },
  tabBtnActive: { borderBottomColor: Colors.cyan },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.cyan },

  list: { padding: 14, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  cardComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  verifiedBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  verifiedText: { fontSize: 11, color: Colors.green, fontWeight: '600' },

  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: Colors.textMuted, marginTop: 8 },
});
