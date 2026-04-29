import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vehicleAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Vehicle } from '../types';
import { Car, Bike, Truck, Tag, Battery, Palette, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';

const MAKE_OPTIONS = ['Tesla', 'Tata', 'MG', 'Ather', 'OLA Electric', 'Hero Electric', 'Other'];

const EMPTY_FORM = { make: '', model: '', year: '', registrationNumber: '', batteryCapacity: '', color: '', chargingType: '', vehicleType: '' };

const VehiclesScreen: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await vehicleAPI.list();
      setVehicles(res.data.vehicles || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setModalVisible(true); };
  const openEdit = (v: Vehicle) => {
    setEditTarget(v);
    setForm({
      make: v.make, model: v.model, year: String(v.year),
      registrationNumber: v.registrationNumber,
      batteryCapacity: v.batteryCapacity ? String(v.batteryCapacity) : '',
      color: v.color ?? '', chargingType: v.chargingType ?? '',
      vehicleType: (v as any).vehicleType ?? '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.registrationNumber) {
      Alert.alert('Required', 'Make, model and registration number are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        make: form.make, model: form.model, year: Number(form.year) || new Date().getFullYear(),
        registrationNumber: form.registrationNumber.toUpperCase(),
        batteryCapacity: form.batteryCapacity ? Number(form.batteryCapacity) : undefined,
        color: form.color || undefined,
        chargingType: form.chargingType || undefined,
        vehicleType: form.vehicleType || undefined,
      };
      if (editTarget) await vehicleAPI.update(editTarget._id, payload);
      else await vehicleAPI.create(payload);
      setModalVisible(false);
      load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save vehicle');
    } finally { setSaving(false); }
  };

  const handleDelete = (v: Vehicle) => {
    Alert.alert('Delete Vehicle', `Remove ${v.make} ${v.model}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await vehicleAPI.remove(v._id); load(); }
          catch { Alert.alert('Error', 'Failed to delete vehicle'); }
        },
      },
    ]);
  };

  const upd = (key: keyof typeof EMPTY_FORM) => (val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  if (loading) return <Spinner fullScreen text="Loading vehicles…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="My Vehicles" subtitle={`${vehicles.length} registered`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {vehicles.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Car size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.empty, { padding: 0 }]}>No vehicles registered yet. Tap "+ Add" to add your first EV.</Text>
            </View>
          </Card>
        ) : (
          vehicles.map((v) => (
            <Card key={v._id}>
              <View style={styles.vcRow}>
                <View style={styles.vcIcon}>
                  {(v as any).vehicleType === '2-wheeler' ? <Bike size={24} color={Colors.textPrimary} /> :
                   (v as any).vehicleType === '3-wheeler' ? <Truck size={24} color={Colors.textPrimary} /> :
                   <Car size={24} color={Colors.textPrimary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vcName}>{v.make} {v.model} {v.year}</Text>
                  <Text style={styles.vcReg}>{v.registrationNumber}</Text>
                  {(v as any).vehicleType && <View style={styles.metaRow}><Tag size={12} color={Colors.textMuted} /><Text style={styles.vcMeta}>{(v as any).vehicleType}</Text></View>}
                  {v.batteryCapacity && <View style={styles.metaRow}><Battery size={12} color={Colors.textMuted} /><Text style={styles.vcMeta}>{v.batteryCapacity} kWh</Text></View>}
                  {v.color && <View style={styles.metaRow}><Palette size={12} color={Colors.textMuted} /><Text style={styles.vcMeta}>{v.color}</Text></View>}
                </View>
                <View style={styles.vcActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(v)}>
                    <Pencil size={14} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(v)}>
                    <Trash2 size={14} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editTarget ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {[
              { key: 'make', label: 'Make *', placeholder: 'e.g. Tesla' },
              { key: 'model', label: 'Model *', placeholder: 'e.g. Model 3' },
              { key: 'vehicleType', label: 'Vehicle Type *', type: 'dropdown', options: ['2-wheeler', '3-wheeler', '4-wheeler'], placeholder: 'Select Vehicle Type' },
              { key: 'year', label: 'Year', placeholder: '2024', keyboard: 'numeric' },
              { key: 'registrationNumber', label: 'Registration Number *', placeholder: 'TN01AB1234' },
              { key: 'batteryCapacity', label: 'Battery Capacity (kWh)', placeholder: '75', keyboard: 'numeric' },
              { key: 'color', label: 'Color', placeholder: 'Pearl White' },
              { key: 'chargingType', label: 'Charging Type', placeholder: 'Type 2 / CCS / CHAdeMO' },
            ].map(({ key, label, placeholder, keyboard, type, options }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {type === 'dropdown' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.input, dropdownOpen === key && { borderColor: Colors.primary }]}
                      onPress={() => setDropdownOpen(dropdownOpen === key ? null : key)}
                    >
                      <Text style={{ color: form[key as keyof typeof EMPTY_FORM] ? Colors.textPrimary : Colors.textMuted }}>
                        {form[key as keyof typeof EMPTY_FORM] || placeholder}
                      </Text>
                      <View style={{ position: 'absolute', right: 16, top: 12 }}>
                        {dropdownOpen === key ? <ChevronUp size={16} color={Colors.textMuted} /> : <ChevronDown size={16} color={Colors.textMuted} />}
                      </View>
                    </TouchableOpacity>
                    {dropdownOpen === key && options && (
                      <View style={styles.dropdownList}>
                        {options.map((opt, i) => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.dropdownItem, i < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}
                            onPress={() => {
                              upd(key as keyof typeof EMPTY_FORM)(opt);
                              setDropdownOpen(null);
                            }}
                          >
                            <Text style={{ color: Colors.textPrimary }}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={form[key as keyof typeof EMPTY_FORM]}
                    onChangeText={upd(key as keyof typeof EMPTY_FORM)}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={(keyboard as any) ?? 'default'}
                    autoCapitalize={key === 'registrationNumber' ? 'characters' : 'words'}
                  />
                )}
              </View>
            ))}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : editTarget ? 'Update Vehicle' : 'Add Vehicle'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 32 },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16, lineHeight: 22 },
  vcRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vcIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.bgCardAlt, alignItems: 'center', justifyContent: 'center' },
  vcName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  vcReg: { fontSize: 13, color: Colors.accentLight, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  vcMeta: { fontSize: 12, color: Colors.textMuted },
  vcActions: { gap: 6 },
  editBtn: { padding: 6, backgroundColor: Colors.bgCardAlt, borderRadius: 8 },
  delBtn: { padding: 6, backgroundColor: Colors.errorBg, borderRadius: 8 },
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: 15 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dropdownList: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { padding: 14 },
});

export default VehiclesScreen;
