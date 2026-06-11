import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, TextInput, PermissionsAndroid, Platform,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { SafeAreaView } from 'react-native-safe-area-context';
import { serviceAPI, vehicleAPI, franchiseAPI, subscriptionAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import type { Service, Vehicle, Franchise, Subscription } from '../types';
import { Wrench, MapPin, Clock } from 'lucide-react-native';

const SERVICE_TYPES = ['general', 'battery', 'motor', 'software', 'accident', 'amc', 'custom'];
const STATUS_STEPS = ['pending', 'onboarded', 'diagnosis', 'in_progress', 'quality_check', 'delivered'];

const ServicesScreen: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookModal, setBookModal] = useState(false);
  const [detailModal, setDetailModal] = useState<Service | null>(null);
  const [form, setForm] = useState({ vehicle: '', serviceType: 'general', description: '', franchise: '', scheduledDate: '', pickupRequested: false });
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearbyFranchises, setNearbyFranchises] = useState<Franchise[] | null>(null);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'EVserv needs access to your location to find the nearest service centres.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    if (!bookModal) {
      setNearbyFranchises(null);
      return;
    }

    const getLocation = async () => {
      setLocationLoading(true);
      try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setNearbyFranchises(null);
          setLocationLoading(false);
          return;
        }

        Geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await franchiseAPI.nearby(latitude, longitude, 500);
              setNearbyFranchises(res.data.franchises || []);
            } catch (err) {
              setNearbyFranchises(null);
            } finally {
              setLocationLoading(false);
            }
          },
          (error) => {
            console.log(error);
            setNearbyFranchises(null);
            setLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (err) {
        setNearbyFranchises(null);
        setLocationLoading(false);
      }
    };

    getLocation();
  }, [bookModal]);

  const load = useCallback(async () => {
    try {
      const [sRes, vRes, fRes, subRes] = await Promise.all([
        serviceAPI.list(), vehicleAPI.list(), franchiseAPI.listActive(), subscriptionAPI.list(),
      ]);
      setServices(sRes.data.services || []);
      setVehicles(vRes.data.vehicles || []);
      setFranchises(fRes.data.franchises || []);
      setSubscriptions(subRes.data.subscriptions?.filter((s: Subscription) => s.status === 'active') || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBook = async () => {
    if (!form.vehicle || !form.franchise) {
      Alert.alert('Required', 'Please select a vehicle and service centre.');
      return;
    }
    setSaving(true);
    try {
      await serviceAPI.create(form);
      setBookModal(false);
      setForm({ vehicle: '', serviceType: 'general', description: '', franchise: '', scheduledDate: '', pickupRequested: false });
      load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to book service');
    } finally { setSaving(false); }
  };

  const progressPercent = (status: string) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx < 0 ? 0 : Math.round(((idx + 1) / STATUS_STEPS.length) * 100);
  };

  if (loading) return <Spinner fullScreen text="Loading services…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="My Services" subtitle={`${services.length} total`}
        right={
          <TouchableOpacity style={styles.bookBtn} onPress={() => setBookModal(true)}>
            <Text style={styles.bookBtnText}>+ Book</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {services.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Wrench size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.empty, { padding: 0 }]}>No services yet. Tap "+ Book" to get started.</Text>
            </View>
          </Card>
        ) : (
          services.map((s) => (
            <TouchableOpacity key={s._id} onPress={() => setDetailModal(s)} activeOpacity={0.8}>
              <Card>
                <View style={styles.svcRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.svcType}>{capitalize(s.serviceType)} Service</Text>
                    {s.vehicle && (
                      <Text style={styles.svcVehicle}>
                        {s.vehicle.make} {s.vehicle.model} — {s.vehicle.registrationNumber}
                      </Text>
                    )}
                    {s.franchise && <Text style={styles.svcFranchise}>{s.franchise.name}</Text>}
                    <Text style={styles.svcDate}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <StatusBadge status={s.status} />
                </View>
                {!['delivered', 'cancelled'].includes(s.status) && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progressPercent(s.status)}%` as any }]} />
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Book Modal */}
      <Modal visible={bookModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setBookModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book a Service</Text>
            <TouchableOpacity onPress={() => setBookModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Select Vehicle *</Text>
            <View style={styles.chipRow}>
              {vehicles.map((v) => (
                <TouchableOpacity key={v._id} style={[styles.chip, form.vehicle === v._id && styles.chipActive]} onPress={() => setForm(p => ({ ...p, vehicle: v._id }))}>
                  <Text style={[styles.chipText, form.vehicle === v._id && styles.chipTextActive]}>{v.make} {v.model}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.vehicle ? (() => {
              const activeSub = subscriptions.find(s => s.vehicle?._id === form.vehicle);
              if (!activeSub) return null;
              const planName = typeof activeSub.plan === 'object' && activeSub.plan ? activeSub.plan.name : (activeSub.plan || 'Plan');
              return (
                <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', padding: 12, borderRadius: 10, marginTop: 14, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>💎</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.success, fontWeight: '700', fontSize: 13 }}>Active Subscription Applied</Text>
                    <Text style={{ color: Colors.success, fontSize: 11, marginTop: 2, opacity: 0.9 }}>{planName} - Eligible for free service/labour</Text>
                  </View>
                </View>
              );
            })() : null}

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Service Type *</Text>
            <View style={styles.chipRow}>
              {SERVICE_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, form.serviceType === t && styles.chipActive]} onPress={() => setForm(p => ({ ...p, serviceType: t }))}>
                  <Text style={[styles.chipText, form.serviceType === t && styles.chipTextActive]}>{capitalize(t)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
              <Text style={[styles.fieldLabel, { marginTop: 0, marginBottom: 0 }]}>Select Service Centre * </Text>
              {nearbyFranchises && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                  <MapPin size={10} color={Colors.success} />
                  <Text style={styles.sortedBy}> Sorted by distance</Text>
                </View>
              )}
            </View>
            {locationLoading && <Text style={styles.loadingText}>Finding nearest centres…</Text>}
            {(nearbyFranchises || franchises).map((f) => (
              <TouchableOpacity key={f._id} style={[styles.centreCard, form.franchise === f._id && styles.centreCardActive]}
                onPress={() => setForm(p => ({ ...p, franchise: f._id }))} activeOpacity={0.7}>
                <View style={styles.centreHeader}>
                  <Text style={styles.centreName}>{f.name}</Text>
                  {f.distanceKm != null && (
                    <View style={styles.distBadge}>
                      <Text style={styles.distText}>{f.distanceKm} km</Text>
                    </View>
                  )}
                </View>
                {f.address && <Text style={styles.centreAddr}>{f.address.street}, {f.address.city}</Text>}
                {f.workingHours && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Clock size={11} color={Colors.textMuted} />
                    <Text style={[styles.centreHours, { marginTop: 0, marginLeft: 4 }]}>{f.workingHours.open} – {f.workingHours.close}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <View style={[styles.field, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, { height: 80 }]} multiline value={form.description}
                onChangeText={(v) => setForm(p => ({ ...p, description: v }))}
                placeholder="Describe the issue…" placeholderTextColor={Colors.textMuted} textAlignVertical="top" />
            </View>

            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10, padding: 12, backgroundColor: Colors.bgCard, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
              onPress={() => setForm(p => ({ ...p, pickupRequested: !p.pickupRequested }))}
            >
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: form.pickupRequested ? Colors.primary : Colors.border, backgroundColor: form.pickupRequested ? Colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {form.pickupRequested && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✓</Text>}
              </View>
              <View>
                <Text style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Request Vehicle Pickup</Text>
                <Text style={{ color: Colors.textMuted, fontSize: 11 }}>We will collect your vehicle from your location.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleBook} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Booking…' : 'Confirm Booking'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Detail Modal */}
      {detailModal && (
        <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={() => setDetailModal(null)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Service Details</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.detailRow}><Text style={styles.detailKey}>Type</Text><Text style={styles.detailVal}>{capitalize(detailModal.serviceType)}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailKey}>Status</Text><StatusBadge status={detailModal.status} size="md" /></View>
              {detailModal.vehicle && <View style={styles.detailRow}><Text style={styles.detailKey}>Vehicle</Text><Text style={styles.detailVal}>{detailModal.vehicle.make} {detailModal.vehicle.model}</Text></View>}
              {detailModal.franchise && <View style={styles.detailRow}><Text style={styles.detailKey}>Centre</Text><Text style={styles.detailVal}>{detailModal.franchise.name}</Text></View>}
              {detailModal.scheduledDate && <View style={styles.detailRow}><Text style={styles.detailKey}>Scheduled</Text><Text style={styles.detailVal}>{new Date(detailModal.scheduledDate).toLocaleDateString('en-IN')}</Text></View>}
              {detailModal.finalAmount && <View style={styles.detailRow}><Text style={styles.detailKey}>Amount</Text><Text style={[styles.detailVal, { color: Colors.success }]}>₹{detailModal.finalAmount.toLocaleString('en-IN')}</Text></View>}
              {detailModal.description && <><Text style={[styles.fieldLabel, { marginTop: 16 }]}>Description</Text><Text style={styles.detailBody}>{detailModal.description}</Text></>}

              {detailModal.status === 'delivered' && (
                <View style={{ marginTop: 20, padding: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight }}>
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' }}
                    onPress={async () => {
                      const newValue = !detailModal.dropRequested;
                      try {
                        await serviceAPI.updateDropRequest(detailModal._id, newValue);
                        setDetailModal({ ...detailModal, dropRequested: newValue });
                      } catch {
                        Alert.alert('Error', 'Failed to update drop request');
                      }
                    }}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: detailModal.dropRequested ? Colors.success : Colors.border, backgroundColor: detailModal.dropRequested ? Colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {detailModal.dropRequested && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 14 }}>Deliver vehicle back to me</Text>
                      <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Confirm if you want your bike dropped back after service.</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const capitalize = (s: string) => s?.charAt(0).toUpperCase() + s?.slice(1);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 32 },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16 },
  svcRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  svcType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  svcVehicle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  svcFranchise: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  svcDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  centreCard: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard, marginBottom: 8 },
  centreCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(99,102,241,0.1)' },
  centreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  centreName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  distBadge: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  distText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  loadingText: { fontSize: 12, color: Colors.primary, fontStyle: 'italic', marginBottom: 10 },
  sortedBy: { fontSize: 10, color: Colors.success, textTransform: 'none' },
  centreAddr: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  centreHours: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailKey: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  detailVal: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' },
  detailBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginTop: 6 },
  updateCard: { backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  updateNote: { fontSize: 13, color: Colors.textSecondary },
  updateDate: { fontSize: 11, color: Colors.textMuted },
});

export default ServicesScreen;
