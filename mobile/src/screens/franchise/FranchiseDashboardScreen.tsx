import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { franchiseApi } from '../../api/franchiseApi';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../utils/colors';
import { formatINR, formatDate, initials } from '../../utils/helpers';
import type { DashboardData, Booking } from '../../types';
import type { FranchiseTabParamList } from '../../navigation/FranchiseNavigator';
import { Wallet } from 'lucide-react-native';

type NavProp = BottomTabNavigationProp<FranchiseTabParamList, 'Dashboard'>;

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
//   icon,
  accentColor,
}: {
  label: string;
  value: string | number;
//   icon: string;
  accentColor: string;
}) => (
  <View style={[styles.statCard, { borderLeftColor: accentColor }]}>
    <View style={styles.statTopRow}>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      {/* <Text style={styles.statIcon}>{icon}</Text> */}
    </View>
    <Text style={[styles.statValue, { color: accentColor }]} numberOfLines={1}>{value}</Text>
  </View>
);

// ── Recent booking row ────────────────────────────────────────────────────────
const RecentRow = ({ booking }: { booking: Booking }) => {
  const color = Colors.statusColors[booking.status] ?? Colors.textMuted;
  const label = Colors.statusLabels[booking.status] ?? booking.status;
  return (
    <View style={styles.recentRow}>
      <View style={styles.recentLeft}>
        <Text style={styles.recentName}>{booking.owner?.name ?? '—'}</Text>
        <Text style={styles.recentSub}>
          {booking.vehicle?.registrationNumber} · {booking.serviceType}
        </Text>
      </View>
      <View>
        <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1a` }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
        <Text style={styles.recentDate}>{formatDate(booking.scheduledDate)}</Text>
      </View>
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function FranchiseDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getDashboard();
      setData(res.data);
    } catch {
      setError('Failed to load dashboard. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { stats, dailyBookings, recentServices } = data;
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? 'Good morning' : 'Good evening';
  const capacityPct = stats.capacityTotal
    ? Math.round((stats.capacityUsed / stats.capacityTotal) * 100)
    : 0;
  const capColor =
    capacityPct >= 90 ? Colors.red : capacityPct >= 70 ? Colors.yellow : Colors.green;
  const maxCount = Math.max(...dailyBookings.map((d) => d.count), 1);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.cyan}
          colors={[Colors.cyan]}
        />
      }
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greetingText},</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{initials(user?.name, 'F')}</Text>
        </View>
      </View>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Today's Bookings"
          value={stats.todayBookings}
          accentColor="#0ea5e9"
        />
        <StatCard
          label="Completed"
          value={stats.completedToday}
          accentColor={Colors.green}
        />
        <StatCard
          label="Pending"
          value={stats.pendingBookings}
          accentColor={Colors.yellow}
        />
        <StatCard
          label="Week Revenue"
          value={formatINR(stats.weekRevenue)}
          accentColor="#8b5cf6"
        />
      </View>

      {/* ── Wallet Card ────────────────────────────────────────────────────── */}
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: Colors.green, borderLeftWidth: 4 }]} 
        onPress={() => navigation.navigate('Wallet')}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Wallet Balance</Text>
          <Text style={styles.viewAll}>View Details →</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.walletDashRow}>
            <View>
              <Text style={styles.walletDashValue}>{formatINR(data.wallet?.pendingBalance || 0)}</Text>
              <Text style={styles.walletDashLabel}>Available to Redeem</Text>
            </View>
            <View style={styles.walletDashIconBg}>
              <Wallet size={24} color={Colors.textPrimary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Capacity bar ───────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Capacity</Text>
          <Text style={[styles.pctLabel, { color: capColor }]}>{capacityPct}% full</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.capacityRow}>
            <Text style={styles.capacityFraction}>
              {stats.capacityUsed} / {stats.capacityTotal}
            </Text>
            <Text style={styles.slotsLeft}>
              {Math.max(0, stats.capacityTotal - stats.capacityUsed)} slots free
            </Text>
          </View>
          {/* Progress bar */}
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: `${capacityPct}%` as any, backgroundColor: capColor },
              ]}
            />
          </View>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Queue')}
          >
            <Text style={styles.linkBtnText}>View Queue →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Mini bar chart ─────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Last 7 Days — Bookings</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.chartRow}>
            {dailyBookings.map((d, index) => {
              const heightPct = Math.round((d.count / maxCount) * 80) + 10;
              const day = d.label;
              return (
                <View key={`${d.label}-${index}`} style={styles.barCol}>
                  <Text style={styles.barCount}>{d.count}</Text>
                  <View style={[styles.chartBar, { height: heightPct, backgroundColor: Colors.blue }]} />
                  <Text style={styles.barDay}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Recent bookings ────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BookingsTab')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View>
          {recentServices.length === 0 ? (
            <Text style={styles.emptyText}>No bookings yet</Text>
          ) : (
            recentServices.map((s) => <RecentRow key={s._id} booking={s} />)
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cyan,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  retryBtnText: { color: Colors.cyan, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, color: Colors.textMuted },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Stat grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48.5%',
    minHeight: 110,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    justifyContent: 'space-between',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 30, fontWeight: '800' },
  statLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginRight: 8 },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardBody: { padding: 14 },
  viewAll: { fontSize: 12, color: Colors.cyan, fontWeight: '600' },

  // Capacity
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  capacityFraction: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  slotsLeft: { fontSize: 12, color: Colors.textMuted, alignSelf: 'flex-end' },
  pctLabel: { fontSize: 13, fontWeight: '700' },
  barBg: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 999 },
  linkBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 7,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  linkBtnText: { color: Colors.textSecondary, fontSize: 12 },

  // Mini bar chart
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 100,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barCount: { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  chartBar: { width: '80%', borderRadius: 3, minHeight: 6 },
  barDay: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },

  // Recent bookings
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  recentLeft: { flex: 1, marginRight: 8 },
  recentName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  recentSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  recentDate: { fontSize: 10, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-end',
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, textAlign: 'center', padding: 20 },

  // Wallet Dash Card
  walletDashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletDashValue: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  walletDashLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  walletDashIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
});
