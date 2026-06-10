import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../utils/colors';
import { franchiseApi } from '../../api/franchiseApi';
import { ShieldCheck, Plus, X, Search, User, Car, ClipboardList } from 'lucide-react-native';

const STATUS_BADGE = {
  active:    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', label: 'Approved ✓' },
  expired:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Expired ✕' },
  cancelled: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Rejected ✕' },
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Pending Approval' },
};

const fmt = (d: any) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function FranchiseSubscriptionsScreen() {
  const [tab, setTab] = useState<'plans' | 'requests'>('plans');
  const [plans, setPlans] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [creating, setCreating] = useState(false);

  // Modal selector states
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showVehicleSelect, setShowVehicleSelect] = useState(false);
  const [showPlanSelect, setShowPlanSelect] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [plansRes, subsRes] = await Promise.all([
        franchiseApi.getPlans(),
        franchiseApi.getSubscriptions(),
      ]);
      setPlans(plansRes.data.plans || []);
      setRequests(subsRes.data.subscriptions || []);
    } catch (err) {
      setError('Failed to load subscription data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Fetch users list for custom creation
  const handleOpenForm = async () => {
    setShowFormModal(true);
    try {
      const res = await franchiseApi.getUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch customer list.');
    }
  };

  // Fetch vehicles when customer is selected
  const handleSelectUser = async (userId: string) => {
    setSelectedUser(userId);
    setSelectedVehicle('');
    setShowUserSelect(false);
    try {
      const res = await franchiseApi.getUserVehicles(userId);
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch vehicles for customer.');
    }
  };

  const handleCreate = async () => {
    if (!selectedUser || !selectedVehicle || !selectedPlan) {
      Alert.alert('Validation Error', 'Please select customer, vehicle and plan.');
      return;
    }
    setCreating(true);
    try {
      await franchiseApi.createSubscription({
        planId: selectedPlan,
        vehicleId: selectedVehicle,
        userId: selectedUser,
      });
      Alert.alert('Success', 'Subscription request submitted successfully for Admin approval.');
      setShowFormModal(false);
      // reset states
      setSelectedUser('');
      setSelectedVehicle('');
      setSelectedPlan('');
      loadData(true);
      setTab('requests');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.phone?.includes(userQuery) ||
    u.email?.toLowerCase().includes(userQuery.toLowerCase())
  );

  const getSelectedUserLabel = () => {
    const found = users.find(u => u._id === selectedUser);
    return found ? `${found.name} (${found.phone})` : 'Select Customer';
  };

  const getSelectedVehicleLabel = () => {
    const found = vehicles.find(v => v._id === selectedVehicle);
    return found ? `${found.make} ${found.model} [${found.registrationNumber}]` : 'Select Vehicle';
  };

  const getSelectedPlanLabel = () => {
    const found = plans.find(p => p._id === selectedPlan);
    return found ? `${found.name} - ₹${found.amount}` : 'Select Plan';
  };

  const renderPlanCard = ({ item }: { item: any }) => (
    <View style={[styles.planCard, !item.isActive && { opacity: 0.5 }]}>
      <View style={styles.planHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.planName}>{item.name}</Text>
            {item.badge ? (
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.planKey}>Key: {item.key}</Text>
        </View>
        <Text style={styles.planPrice}>₹{item.amount.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.planDetailsGrid}>
        <View style={styles.planDetailItem}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailVal}>{item.duration} Days</Text>
        </View>
        <View style={styles.planDetailItem}>
          <Text style={styles.detailLabel}>Services</Text>
          <Text style={styles.detailVal}>{item.services} Included</Text>
        </View>
      </View>

      {item.highlights && item.highlights.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.detailLabel}>Plan Features</Text>
          {item.highlights.map((h: string, idx: number) => (
            <Text key={idx} style={styles.featureText}>✓ {h}</Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderRequestCard = ({ item }: { item: any }) => {
    const badge = STATUS_BADGE[item.status as keyof typeof STATUS_BADGE] || {
      bg: 'rgba(255,255,255,0.06)',
      color: '#94a3b8',
      label: item.status,
    };
    return (
      <View style={styles.requestCard}>
        <View style={styles.reqHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reqUserName}>{item.user?.name || 'Unknown'}</Text>
            <Text style={styles.reqUserPhone}>{item.user?.phone || ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.reqBody}>
          <View style={styles.reqRow}>
            <Car size={16} color={Colors.textSecondary} />
            <Text style={styles.reqVal}>
              {item.vehicle?.make} {item.vehicle?.model} ({item.vehicle?.registrationNumber || 'N/A'})
            </Text>
          </View>
          <View style={styles.reqRow}>
            <ClipboardList size={16} color={Colors.textSecondary} />
            <Text style={styles.reqVal}>
              Plan: <Text style={{ color: Colors.cyan, fontWeight: '700' }}>
                {item.planName || (typeof item.plan === 'object' && item.plan ? item.plan.name : item.plan) || 'Subscription Plan'}
              </Text> (₹{item.amount})
            </Text>
          </View>
        </View>

        {item.startDate && (
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>🟢 Start: {fmt(item.startDate)}</Text>
            <Text style={styles.dateLabel}>🔴 Expire: {fmt(item.endDate)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'plans' && styles.tabActive]}
          onPress={() => setTab('plans')}
        >
          <Text style={[styles.tabText, tab === 'plans' && styles.tabTextActive]}>Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'requests' && styles.tabActive]}
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>Requests Log</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.cyan} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tab === 'plans' ? (
        <FlatList
          data={plans}
          renderItem={renderPlanCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No subscription plans available.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No subscription requests found.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenForm}>
        <Plus size={26} color="#06071a" />
      </TouchableOpacity>

      {/* Subscription Creation Form Modal */}
      <Modal visible={showFormModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Customer Subscription</Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              {/* Select Customer */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Customer *</Text>
                <TouchableOpacity style={styles.selectorField} onPress={() => setShowUserSelect(true)}>
                  <Text style={[styles.selectorVal, selectedUser === '' && { color: Colors.textMuted }]}>
                    {getSelectedUserLabel()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Select Vehicle */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Vehicle *</Text>
                <TouchableOpacity
                  style={[styles.selectorField, !selectedUser && { opacity: 0.5 }]}
                  disabled={!selectedUser}
                  onPress={() => setShowVehicleSelect(true)}
                >
                  <Text style={[styles.selectorVal, selectedVehicle === '' && { color: Colors.textMuted }]}>
                    {getSelectedVehicleLabel()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Select Plan */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Subscription Plan *</Text>
                <TouchableOpacity style={styles.selectorField} onPress={() => setShowPlanSelect(true)}>
                  <Text style={[styles.selectorVal, selectedPlan === '' && { color: Colors.textMuted }]}>
                    {getSelectedPlanLabel()}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, creating && { opacity: 0.5 }]}
                disabled={creating}
                onPress={handleCreate}
              >
                {creating ? (
                  <ActivityIndicator color="#06071a" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Dynamic Nested Selectors */}
        {/* 1. Customer Select List Modal */}
        <Modal visible={showUserSelect} animationType="fade" transparent>
          <View style={styles.selectorOverlay}>
            <View style={styles.selectorContent}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorTitle}>Select Customer</Text>
                <TouchableOpacity onPress={() => setShowUserSelect(false)}>
                  <X size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.searchBar}>
                <Search size={16} color={Colors.textMuted} />
                <TextInput
                  placeholder="Search customer by name or phone..."
                  placeholderTextColor={Colors.textMuted}
                  style={styles.searchInput}
                  value={userQuery}
                  onChangeText={setUserQuery}
                />
              </View>
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.selectOption} onPress={() => handleSelectUser(item._id)}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionSub}>{item.phone} · {item.email}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.optionEmpty}>No customers found.</Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* 2. Vehicle Select List Modal */}
        <Modal visible={showVehicleSelect} animationType="fade" transparent>
          <View style={styles.selectorOverlay}>
            <View style={styles.selectorContent}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorTitle}>Select Vehicle</Text>
                <TouchableOpacity onPress={() => setShowVehicleSelect(false)}>
                  <X size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={vehicles}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.selectOption}
                    onPress={() => {
                      setSelectedVehicle(item._id);
                      setShowVehicleSelect(false);
                    }}
                  >
                    <Text style={styles.optionName}>{item.make} {item.model}</Text>
                    <Text style={styles.optionSub}>{item.registrationNumber} · {item.year}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.optionEmpty}>No vehicles found for this customer.</Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* 3. Plan Select List Modal */}
        <Modal visible={showPlanSelect} animationType="fade" transparent>
          <View style={styles.selectorOverlay}>
            <View style={styles.selectorContent}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorTitle}>Select Plan</Text>
                <TouchableOpacity onPress={() => setShowPlanSelect(false)}>
                  <X size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={plans.filter(p => p.isActive)}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.selectOption}
                    onPress={() => {
                      setSelectedPlan(item._id);
                      setShowPlanSelect(false);
                    }}
                  >
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionSub}>Price: ₹{item.amount} · Duration: {item.duration} Days</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.optionEmpty}>No active plans available.</Text>
                }
              />
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  retryBtn: { borderWidth: 1, borderColor: Colors.cyan, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 20 },
  retryText: { color: Colors.cyan, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.cyan,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.cyan,
  },

  listContent: { padding: 14, paddingBottom: 84 },

  // Plan Card
  planCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  planKey: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: '800', color: Colors.cyan },
  badgeWrap: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 9, color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  planDetailsGrid: { flexDirection: 'row', gap: 24 },
  planDetailItem: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailVal: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  featureText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },

  // Request Card
  requestCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqUserName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  reqUserPhone: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 12, paddingVertical: 2, paddingHorizontal: 10 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  reqBody: { gap: 8 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqVal: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  dateBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  formScroll: { paddingBottom: 24 },
  formField: { marginBottom: 16 },
  formLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectorField: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectorVal: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  submitBtn: {
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: '#06071a', fontWeight: '800', fontSize: 15 },

  // Nested Selectors
  selectorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  selectorContent: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    maxHeight: '75%',
  },
  selectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  selectorTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 13, height: 40 },
  selectOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  optionName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  optionSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  optionEmpty: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
});
