import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Zap,
  Car,
  Wrench,
  UserCheck,
  Repeat,
  CreditCard,
  Star,
  Bell,
  Gift,
  FileText,
  ClipboardList,
  User,
  ChevronRight,
  Heart,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { serviceAPI, vehicleAPI, subscriptionAPI, reminderAPI, feedAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import EnergyBackground from '../components/EnergyBackground';
import type { Service, Vehicle, Subscription, Reminder, FeedPost } from '../types';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, highlight = false }) => (
  <View style={[statStyles.card, highlight && statStyles.highlight]}>
    <Text style={statStyles.value}>{String(value).padStart(2, '0')}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);
const statStyles = StyleSheet.create({
  card: {
    width: '48.5%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  highlight: { 
    borderColor: Colors.luxuryGold, 
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  value: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  label: { fontSize: 11, color: Colors.textSecondary, marginTop: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});

// ─── Quick Action ─────────────────────────────────────────────────────────────
interface QuickActionProps {
  icon: any;
  label: string;
  onPress: () => void;
  color?: string;
}
const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, onPress, color = Colors.primary }) => (
  <TouchableOpacity style={qaStyles.btn} onPress={onPress} activeOpacity={0.7}>
    <View style={[qaStyles.iconCircle, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={qaStyles.label} numberOfLines={2}>{label}</Text>
  </TouchableOpacity>
);
const qaStyles = StyleSheet.create({
  btn: {
    width: '33.3%',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  label: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
});

// ─── Feed Post Card ───────────────────────────────────────────────────────────
const POST_TYPE_COLOR: Record<string, string> = {
  announcement: Colors.primary,
  offer: '#10b981',
  news: Colors.accent,
  update: '#f59e0b',
};
const FeedCard: React.FC<{ post: FeedPost; onLike: () => void; userId: string }> = ({
  post, onLike, userId,
}) => {
  const liked = post.likes?.includes(userId);
  const color = POST_TYPE_COLOR[post.type] ?? Colors.accent;
  return (
    <Card style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <Text style={[styles.feedType, { color }]}>{post.type?.charAt(0).toUpperCase() + post.type?.slice(1)}</Text>
        <Text style={styles.feedDate}>{new Date(post.createdAt).toLocaleDateString('en-IN')}</Text>
      </View>
      <Text style={styles.feedContent} numberOfLines={4}>{post.content}</Text>
      <View style={styles.feedFooter}>
        <TouchableOpacity style={styles.likeBtn} onPress={onLike}>
          <Heart size={16} color={liked ? Colors.error : Colors.textMuted} fill={liked ? Colors.error : 'transparent'} />
          <Text style={styles.likeCt}>{post.likes?.length ?? 0}</Text>
        </TouchableOpacity>
        {post.author?.name && (
          <Text style={styles.feedAuthor}>By {post.author.name}</Text>
        )}
      </View>
    </Card>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sRes, vRes, subRes, remRes, feedRes] = await Promise.all([
        serviceAPI.list(),
        vehicleAPI.list(),
        subscriptionAPI.list(),
        reminderAPI.list(),
        feedAPI.list({ limit: 5 }),
      ]);
      setServices(sRes.data.services || []);
      setVehicles(vRes.data.vehicles || []);
      setSubscriptions(subRes.data.subscriptions || []);
      setReminders(remRes.data.reminders || []);
      setFeed(feedRes.data.posts || []);
    } catch (_err) {
      // silently fail — show whatever loaded
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleLike = async (postId: string) => {
    try {
      await feedAPI.like(postId);
      setFeed((prev: FeedPost[]) =>
        prev.map((p: FeedPost) => {
          if (p._id !== postId) return p;
          const likes = p.likes ? [...p.likes] : [];
          const idx = likes.indexOf(user!._id);
          if (idx === -1) likes.push(user!._id);
          else likes.splice(idx, 1);
          return { ...p, likes };
        }),
      );
    } catch { }
  };

  if (loading) return <Spinner fullScreen text="Loading dashboard…" />;

  const activeServices = services.filter(
    (s: Service) => !['delivered', 'cancelled'].includes(s.status),
  );
  const activeSubs = subscriptions.filter((s: Subscription) => s.status === 'active');
  const upcomingReminders = reminders.filter((r: Reminder) => !r.isAcknowledged);
  const recentServices = services.slice(0, 5);

  const colCount = width < 360 ? 2 : 4;

  return (
    <EnergyBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Redesigned Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatarBtn}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerSubtitle}>{getGreeting()}</Text>
          <Text style={styles.headerTitle}>Welcome to {user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <View style={styles.notifBadge} />
          <Bell size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Stat Cards (2x2 Grid) ── */}
        <View style={styles.statsGrid}>
          <StatCard label="Vehicles" value={vehicles.length} />
          <StatCard label="Active services" value={activeServices.length} highlight />
          <StatCard label="Active plans" value={activeSubs.length} />
          <StatCard label="Reminders" value={upcomingReminders.length} />
        </View>

        {/* ── Quick Actions Grid (3-column) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.qaGrid}>
            <QuickAction icon={Zap} label="Booking agent" onPress={() => navigation.navigate('AIAgent')} color={Colors.luxuryGold} />
            <QuickAction icon={Car} label="My vehicle" onPress={() => navigation.navigate('Vehicles')} color={Colors.luxuryGold} />
            <QuickAction icon={Wrench} label="Services" onPress={() => navigation.navigate('Services')} color={Colors.luxuryGold} />

            <QuickAction icon={UserCheck} label="Subscription" onPress={() => navigation.navigate('Subscriptions')} color={Colors.luxuryGold} />
            <QuickAction icon={Repeat} label="Spare parts" onPress={() => navigation.navigate('SpareParts')} color={Colors.luxuryGold} />
            <QuickAction icon={CreditCard} label="Payments" onPress={() => navigation.navigate('Payments')} color={Colors.luxuryGold} />

            <QuickAction icon={Star} label="Feedback" onPress={() => navigation.navigate('Feedback')} color={Colors.luxuryGold} />
            <QuickAction icon={Gift} label="Referrals" onPress={() => navigation.navigate('Referrals')} color={Colors.luxuryGold} />
            <QuickAction icon={FileText} label="Documents" onPress={() => navigation.navigate('Documents')} color={Colors.luxuryGold} />

            {/* <QuickAction icon={LayoutDashboard} label="Dashboard" onPress={() => {}} color={Colors.accent} />
            <QuickAction icon={Bell} label="Reminders" onPress={() => navigation.navigate('Reminders')} color={Colors.accent} />
            <QuickAction icon={User} label="Profile" onPress={() => navigation.navigate('Profile')} color={Colors.accent} /> */}
          </View>
        </View>

        {/* ── Upcoming Reminders ── */}
        {upcomingReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bell color={Colors.textPrimary} size={20} />
                <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Reminders')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {upcomingReminders.slice(0, 3).map((r: Reminder) => (
              <Card key={r._id} style={styles.reminderCard}>
                <View style={styles.reminderRow}>
                  <View style={styles.reminderDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitle}>{r.title}</Text>
                    <Text style={styles.reminderDate}>
                      Due: {new Date(r.dueDate).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles.reminderTypeTag}>{r.type}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ── Recent Services ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
              <Text style={styles.seeAll}>see all</Text>
            </TouchableOpacity>
          </View>
          {recentServices.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No services booked yet. Tap " Book Service"</Text>
              <Text style={styles.emptyText}>to get started.</Text>
            </View>
          ) : (
            recentServices.map((s: Service) => (
              <Card key={s._id} style={styles.serviceCard}>
                <View style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceType}>{capitalize(s.serviceType)} Service</Text>
                    {s.vehicle && (
                      <Text style={styles.serviceVehicle}>
                        {s.vehicle.make} {s.vehicle.model} — {s.vehicle.registrationNumber}
                      </Text>
                    )}
                    {s.franchise && (
                      <Text style={styles.serviceFranchise}>{s.franchise.name}</Text>
                    )}
                    <Text style={styles.serviceDate}>
                      {new Date(s.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <StatusBadge status={s.status} />
                </View>
                {s.status === 'in_progress' && (
                  <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                  </View>
                )}
              </Card>
            ))
          )}
        </View>

        {/* ── Active Plans ── */}
        {activeSubs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ClipboardList color={Colors.textPrimary} size={20} />
                <Text style={styles.sectionTitle}>Active Plans</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Subscriptions')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {activeSubs.map((sub: Subscription) => (
              <Card key={sub._id} style={styles.subCard}>
                <View style={styles.subRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subName}>
                      {typeof sub.plan === 'object' && sub.plan ? sub.plan.name : (sub.plan || 'Subscription Plan')}
                    </Text>
                    <Text style={styles.subExpiry}>
                      Expires: {new Date(sub.endDate).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.subBadge}>
                    <Text style={styles.subBadgeText}>Active</Text>
                  </View>
                </View>
                {(typeof sub.plan === 'object' && sub.plan ? sub.plan.highlights : sub.features)?.slice(0, 2).map((f: string, i: number) => (
                  <Text key={i} style={styles.subFeature}>✓ {f}</Text>
                ))}
              </Card>
            ))}
          </View>
        )}

        {/* ── Feed / Announcements ── */}
        {feed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Announcements & Offers</Text>
            {feed.map((post: FeedPost) => (
              <FeedCard
                key={post._id}
                post={post}
                userId={user?._id ?? ''}
                onLike={() => handleLike(post._id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </EnergyBackground>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
const capitalize = (s: string) => s?.charAt(0).toUpperCase() + s?.slice(1);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerSubtitle: { fontSize: 12, color: Colors.luxuryGold, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#162031',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#162031',
    zIndex: 1,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
  seeAll: { fontSize: 14, color: Colors.luxuryGold, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  reminderCard: { padding: 16, marginBottom: 10, borderRadius: 16 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.warning },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  reminderDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  reminderTypeTag: {
    fontSize: 10, color: Colors.textMuted,
    textTransform: 'capitalize', fontWeight: '600',
    backgroundColor: Colors.borderLight, paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 6,
  },
  serviceCard: { padding: 16, marginBottom: 10, borderRadius: 16 },
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  serviceType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  serviceVehicle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  serviceFranchise: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  serviceDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressFill: { width: '60%', height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  emptyBox: {
    height: 160,
    borderWidth: 1,
    borderColor: '#1e3050',
    borderRadius: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 27, 62, 0.4)',
  },
  emptyText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 22, textAlign: 'center' },
  subCard: { padding: 16, marginBottom: 10, borderRadius: 16 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  subName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  subExpiry: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  subBadge: { backgroundColor: Colors.successBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  subBadgeText: { fontSize: 11, color: Colors.success, fontWeight: '700' },
  subFeature: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  feedCard: { marginBottom: 16, padding: 20, borderRadius: 20 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  feedType: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  feedDate: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  feedContent: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24, marginBottom: 16 },
  feedFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCt: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  feedAuthor: { fontSize: 13, color: Colors.textMuted, marginLeft: 'auto' },
});

export default DashboardScreen;
