import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscriptionAPI, vehicleAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import type { Subscription, SubscriptionPlan, Vehicle } from '../types';
import { ClipboardList, Check, BadgeCheck, Car } from 'lucide-react-native';

const SubscriptionsScreen: React.FC = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [subRes, planRes, vehRes] = await Promise.all([
        subscriptionAPI.list(),
        subscriptionAPI.getPlans(),
        vehicleAPI.list(),
      ]);
      setSubs(subRes.data.subscriptions || []);
      setPlans(planRes.data.plans || []);
      setVehicles(vehRes.data.vehicles || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    if (!selectedVehicle) {
      Alert.alert('Required', 'Please select a vehicle first.');
      return;
    }

    Alert.alert(
      'Subscribe',
      `Subscribe to ${selectedPlan.name} for ₹${selectedPlan.amount.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', onPress: async () => {
            setSubscribing(true);
            try {
              await subscriptionAPI.create({ planId: selectedPlan._id, vehicleId: selectedVehicle });
              setPlanModal(false);
              setSelectedPlan(null);
              setSelectedVehicle('');
              load();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to subscribe');
            } finally { setSubscribing(false); }
          },
        },
      ],
    );
  };

  if (loading) return <Spinner fullScreen text="Loading subscriptions…" />;

  const activeSubs = subs.filter((s) => s.status === 'active');
  const expiredSubs = subs.filter((s) => s.status !== 'active');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Subscriptions" subtitle="Plans & service packages"
        right={
          <TouchableOpacity style={styles.viewPlansBtn} onPress={() => setPlanModal(true)}>
            <Text style={styles.viewPlansBtnText}>View Plans</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {activeSubs.length === 0 && expiredSubs.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <ClipboardList size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.empty, { padding: 0 }]}>You have no active subscriptions.</Text>
            </View>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => setPlanModal(true)}>
              <Text style={styles.upgradeBtnText}>Browse Plans</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {activeSubs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active Plans</Text>
            {activeSubs.map((s) => <SubCard key={s._id} sub={s} />)}
          </>
        )}
        {expiredSubs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Past Plans</Text>
            {expiredSubs.map((s) => <SubCard key={s._id} sub={s} />)}
          </>
        )}
      </ScrollView>

      <Modal visible={planModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setPlanModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Available Plans</Text>
            <TouchableOpacity onPress={() => setPlanModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.modalSectionTitle}>Choose a Plan</Text>
            {plans.length === 0 && <Text style={styles.empty}>No plans available</Text>}
            <View style={styles.planGrid}>
              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan._id}
                  style={[styles.planCard, selectedPlan?._id === plan._id && styles.planCardActive]}
                  onPress={() => setSelectedPlan(plan)}
                  activeOpacity={0.8}
                >
                  {plan.badge ? (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.planName, selectedPlan?._id === plan._id && { color: Colors.accentLight }]}>{plan.name}</Text>
                  <Text style={styles.planPrice}>₹{plan.amount?.toLocaleString('en-IN')}</Text>
                  <Text style={styles.planServices}>
                    {plan.duration} days · {plan.services} service{plan.services !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.featureList}>
                    {plan.highlights?.map((h, i) => (
                      <View key={i} style={styles.featureItem}>
                        <Check size={12} color={Colors.accentLight} style={{ marginTop: 2 }} />
                        <Text style={styles.featureText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>Select Vehicle *</Text>
            {vehicles.length === 0 ? (
              <Text style={styles.noVehicles}>Please add a vehicle from 'My Vehicles' first.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleScroll}>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v._id}
                    style={[styles.vehicleChip, selectedVehicle === v._id && styles.vehicleChipActive]}
                    onPress={() => setSelectedVehicle(v._id)}
                  >
                    <Car size={14} color={selectedVehicle === v._id ? '#fff' : Colors.textSecondary} />
                    <Text style={[styles.vehicleChipText, selectedVehicle === v._id && styles.vehicleChipTextActive]}>
                      {v.make} {v.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[
                styles.subscribeBtn,
                (subscribing || !selectedPlan || !selectedVehicle) && styles.subscribeBtnDisabled
              ]}
              onPress={handleSubscribe}
              disabled={subscribing || !selectedPlan || !selectedVehicle}
            >
              <Text style={styles.subscribeBtnText}>
                {subscribing ? 'Processing…' : selectedPlan ? `Subscribe for ₹${selectedPlan.amount?.toLocaleString('en-IN')}` : 'Select a Plan'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SubCard: React.FC<{ sub: Subscription }> = ({ sub }) => {
  const sc = sub.status === 'active' ? Colors.success : Colors.textMuted;
  const servicesIncluded = (sub.plan as any)?.services || sub.servicesIncluded || 0;
  const servicesUsed = sub.servicesUsed || 0;
  const usedPct = servicesIncluded > 0 ? Math.min(Math.round((servicesUsed / servicesIncluded) * 100), 100) : 0;

  return (
    <Card style={sub.status === 'active' ? { borderColor: Colors.success } : undefined}>
      <View style={styles.subCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subPlanTitle}>{sub.plan?.name}</Text>
          <Text style={styles.subVehicleText}>
            {sub.vehicle?.make} {sub.vehicle?.model} · {sub.vehicle?.registrationNumber}
          </Text>
        </View>
        <StatusBadge status={sub.status} size="sm" />
      </View>

      <Text style={styles.subAmountText}>₹{sub.amount?.toLocaleString('en-IN')}</Text>

      <View style={styles.subDatesRow}>
        <Text style={styles.subDateItem}>📅 {new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
        <Text style={styles.subDateItem}>⏱ {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Services used</Text>
          <Text style={styles.progressValue}>{servicesUsed} / {servicesIncluded}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${usedPct}%` as any, backgroundColor: usedPct >= 100 ? Colors.error : Colors.accentLight }]} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 32 },
  viewPlansBtn: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary },
  viewPlansBtnText: { color: Colors.primaryLight, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 24 },
  upgradeBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Sub Card (Active/Past)
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

  // Modal
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 16, paddingBottom: 60 },
  modalSectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },

  // Plan Grid
  planGrid: { gap: 12 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 20,
    position: 'relative',
  },
  planCardActive: {
    borderColor: Colors.accentLight,
    backgroundColor: 'rgba(6,182,212,0.05)',
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -45, // approx half width
    backgroundColor: '#fb923c',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  planName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  planPrice: { fontSize: 24, fontWeight: '800', color: Colors.accentLight, marginBottom: 4 },
  planServices: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  featureList: { gap: 6 },
  featureItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },

  // Vehicle Selection
  noVehicles: { color: Colors.error, fontSize: 12, fontStyle: 'italic' },
  vehicleScroll: { gap: 8, paddingBottom: 10 },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  vehicleChipTextActive: { color: '#fff' },

  subscribeBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  subscribeBtnDisabled: { opacity: 0.5 },
  subscribeBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default SubscriptionsScreen;
