import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscriptionAPI, vehicleAPI, paymentAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import type { Subscription, SubscriptionPlan, Vehicle } from '../types';
import { ClipboardList, Check, Car, ChevronRight } from 'lucide-react-native';

// ──────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────
const SubscriptionsScreen: React.FC = () => {
  const [mySubs, setMySubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // tab: 'plans' | 'my'
  const [tab, setTab] = useState<'plans' | 'my'>('plans');

  // Modal state
  const [modalPlan, setModalPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [subRes, planRes, vehRes] = await Promise.all([
        subscriptionAPI.list(),
        subscriptionAPI.getPlans(),
        vehicleAPI.list(),
      ]);
      setMySubs(subRes.data.subscriptions || []);
      setPlans(planRes.data.plans || []);
      setVehicles(vehRes.data.vehicles || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openSubscribeModal = (plan: SubscriptionPlan) => {
    if (vehicles.length === 0) {
      Alert.alert('No Vehicle', "Please add a vehicle from 'My Vehicles' first.");
      return;
    }
    setSelectedVehicle(vehicles[0]._id);
    setModalPlan(plan);
  };

  const handleSubscribeAndPay = async () => {
    if (!modalPlan || !selectedVehicle) return;
    setProcessing(true);
    try {
      // 1. Create subscription (status: pending)
      const subRes = await subscriptionAPI.create({
        planId: modalPlan._id,
        vehicleId: selectedVehicle,
      });
      const subId = subRes.data.subscription._id;

      // 2. Create Razorpay order (mock)
      const orderRes = await paymentAPI.createOrder({
        amount: modalPlan.amount,
        paymentFor: 'subscription',
        referenceId: subId,
      });

      // 3. Verify payment (mock signature)
      await paymentAPI.verify({
        razorpayOrderId: orderRes.data.orderId,
        razorpayPaymentId: 'mock_pay_' + Date.now(),
        razorpaySignature: 'mock',
        paymentDbId: orderRes.data.paymentId,
      });

      setModalPlan(null);
      Alert.alert('🎉 Subscribed!', `You are now subscribed to ${modalPlan.name}.`);
      load();
      setTab('my');
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Spinner fullScreen text="Loading…" />;

  const activeSubs   = mySubs.filter(s => s.status === 'active');
  const pendingSubs  = mySubs.filter(s => s.status === 'pending');
  const expiredSubs  = mySubs.filter(s => !['active', 'pending'].includes(s.status));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Subscriptions" subtitle="Pick a plan & subscribe" />

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'plans' && styles.tabActive]}
          onPress={() => setTab('plans')}
        >
          <Text style={[styles.tabText, tab === 'plans' && styles.tabTextActive]}>Available Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'my' && styles.tabActive]}
          onPress={() => setTab('my')}
        >
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>
            My Subscriptions{mySubs.length > 0 ? ` (${mySubs.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── PLANS TAB ── */}
        {tab === 'plans' && (
          <>
            {plans.length === 0 ? (
              <Card>
                <Text style={styles.empty}>No plans available right now.</Text>
              </Card>
            ) : (
              plans.map(plan => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  onSubscribe={() => openSubscribeModal(plan)}
                />
              ))
            )}
          </>
        )}

        {/* ── MY SUBSCRIPTIONS TAB ── */}
        {tab === 'my' && (
          <>
            {mySubs.length === 0 ? (
              <Card>
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <ClipboardList size={32} color={Colors.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.empty}>No subscriptions yet.</Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
                    Go to "Available Plans" and subscribe!
                  </Text>
                </View>
                <TouchableOpacity style={styles.browseBtn} onPress={() => setTab('plans')}>
                  <Text style={styles.browseBtnText}>Browse Plans</Text>
                </TouchableOpacity>
              </Card>
            ) : (
              <>
                {activeSubs.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Active Plans</Text>
                    {activeSubs.map(s => <SubCard key={s._id} sub={s} />)}
                  </>
                )}
                {pendingSubs.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: activeSubs.length > 0 ? 20 : 0 }]}>
                      Pending Approval
                    </Text>
                    {pendingSubs.map(s => <SubCard key={s._id} sub={s} />)}
                  </>
                )}
                {expiredSubs.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: (activeSubs.length > 0 || pendingSubs.length > 0) ? 20 : 0 }]}>
                      Past Plans
                    </Text>
                    {expiredSubs.map(s => <SubCard key={s._id} sub={s} />)}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Subscribe Modal ── */}
      <Modal
        visible={!!modalPlan}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => { if (!processing) setModalPlan(null); }}
      >
        {modalPlan && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subscribe to {modalPlan.name}</Text>
              <TouchableOpacity onPress={() => { if (!processing) setModalPlan(null); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Plan Summary */}
              <View style={styles.planSummaryBox}>
                <Text style={styles.planSummaryAmount}>₹{modalPlan.amount?.toLocaleString('en-IN')}</Text>
                <Text style={styles.planSummaryMeta}>
                  {modalPlan.duration} days · {modalPlan.services} service{modalPlan.services !== 1 ? 's' : ''}
                </Text>
                {modalPlan.highlights?.map((h, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Check size={12} color={Colors.accentLight} />
                    <Text style={styles.featureText}>{h}</Text>
                  </View>
                ))}
              </View>

              {/* Vehicle Selection */}
              <Text style={styles.modalSectionTitle}>Select Vehicle *</Text>
              {vehicles.map(v => (
                <TouchableOpacity
                  key={v._id}
                  style={[styles.vehicleRow, selectedVehicle === v._id && styles.vehicleRowActive]}
                  onPress={() => setSelectedVehicle(v._id)}
                >
                  <Car size={18} color={selectedVehicle === v._id ? '#fff' : Colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleName, selectedVehicle === v._id && { color: '#fff' }]}>
                      {v.make} {v.model}
                    </Text>
                    <Text style={[styles.vehicleReg, selectedVehicle === v._id && { color: 'rgba(255,255,255,0.7)' }]}>
                      {v.registrationNumber}
                    </Text>
                  </View>
                  {selectedVehicle === v._id && (
                    <View style={styles.selectedDot} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Pay Button */}
              <TouchableOpacity
                style={[styles.payBtn, (!selectedVehicle || processing) && styles.payBtnDisabled]}
                onPress={handleSubscribeAndPay}
                disabled={!selectedVehicle || processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payBtnText}>
                    Subscribe Now · ₹{modalPlan.amount?.toLocaleString('en-IN')}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.payNote}>
                Payment will be processed securely. Subscription activates immediately after payment.
              </Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

// ──────────────────────────────────────────────
// Plan Card (Available Plans list)
// ──────────────────────────────────────────────
const PlanCard: React.FC<{ plan: SubscriptionPlan; onSubscribe: () => void }> = ({ plan, onSubscribe }) => (
  <View style={styles.planCard}>
    {plan.badge ? (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{plan.badge}</Text>
      </View>
    ) : null}
    <View style={styles.planCardTop}>
      <View style={{ flex: 1 }}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planMeta}>{plan.duration} days · {plan.services} service{plan.services !== 1 ? 's' : ''}</Text>
      </View>
      <Text style={styles.planPrice}>₹{plan.amount?.toLocaleString('en-IN')}</Text>
    </View>
    {plan.highlights?.length > 0 && (
      <View style={styles.featureList}>
        {plan.highlights.map((h, i) => (
          <View key={i} style={styles.featureItem}>
            <Check size={12} color={Colors.accentLight} />
            <Text style={styles.featureText}>{h}</Text>
          </View>
        ))}
      </View>
    )}
    <TouchableOpacity style={styles.subscribeBtn} onPress={onSubscribe} activeOpacity={0.8}>
      <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
      <ChevronRight size={16} color="#fff" />
    </TouchableOpacity>
  </View>
);

// ──────────────────────────────────────────────
// My Subscription Card
// ──────────────────────────────────────────────
const SubCard: React.FC<{ sub: Subscription }> = ({ sub }) => {
  const servicesIncluded = (sub.plan as any)?.services || sub.servicesIncluded || 0;
  const servicesUsed = sub.servicesUsed || 0;
  const usedPct = servicesIncluded > 0 ? Math.min(Math.round((servicesUsed / servicesIncluded) * 100), 100) : 0;

  return (
    <Card style={sub.status === 'active' ? { borderColor: Colors.success } : undefined}>
      <View style={styles.subCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subPlanTitle}>
            {typeof sub.plan === 'object' && sub.plan ? sub.plan.name : (sub.plan || 'Subscription Plan')}
          </Text>
          <Text style={styles.subVehicleText}>
            {sub.vehicle?.make} {sub.vehicle?.model} · {sub.vehicle?.registrationNumber}
          </Text>
        </View>
        <StatusBadge status={sub.status} size="sm" />
      </View>

      <Text style={styles.subAmountText}>₹{sub.amount?.toLocaleString('en-IN')}</Text>

      {sub.startDate && (
        <View style={styles.subDatesRow}>
          <Text style={styles.subDateItem}>📅 {new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
          <Text style={styles.subDateItem}>⏱ {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Services used</Text>
          <Text style={styles.progressValue}>{servicesUsed} / {servicesIncluded}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, {
            width: `${usedPct}%` as any,
            backgroundColor: usedPct >= 100 ? Colors.error : Colors.accentLight,
          }]} />
        </View>
      </View>

      {sub.features?.length > 0 && (
        <View style={styles.subFeats}>
          {sub.features.map((f: string, i: number) => (
            <View key={i} style={styles.featRowSmall}>
              <Check size={10} color={Colors.accentLight} />
              <Text style={styles.featTextSmall}>{f}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 40 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16 },

  // Browse button
  browseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Plan Card
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#fb923c',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  planName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  planMeta: { fontSize: 12, color: Colors.textSecondary },
  planPrice: { fontSize: 22, fontWeight: '800', color: Colors.accentLight },
  featureList: { gap: 6, marginBottom: 16 },
  featureItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },

  subscribeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  subscribeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 20, paddingBottom: 60 },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 20,
  },

  // Plan Summary box
  planSummaryBox: {
    backgroundColor: 'rgba(6,182,212,0.07)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    gap: 6,
    marginBottom: 4,
  },
  planSummaryAmount: { fontSize: 28, fontWeight: '800', color: Colors.accentLight },
  planSummaryMeta: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },

  // Vehicle row
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
  },
  vehicleRowActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  vehicleReg: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },

  // Pay button
  payBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  payNote: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // My Subscription Card
  subCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  subPlanTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  subVehicleText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  subAmountText: { fontSize: 18, fontWeight: '800', color: Colors.accentLight, marginBottom: 8 },
  subDatesRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  subDateItem: { fontSize: 11, color: Colors.textMuted },
  progressContainer: { marginBottom: 10 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 11, color: Colors.textSecondary },
  progressValue: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  progressBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999 },
  subFeats: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 8, gap: 4 },
  featRowSmall: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  featTextSmall: { color: Colors.textMuted, fontSize: 11 },
});

export default SubscriptionsScreen;
