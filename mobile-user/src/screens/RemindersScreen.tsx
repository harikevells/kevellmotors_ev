import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reminderAPI, vehicleAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Reminder, Vehicle } from '../types';
import { Wrench, Shield, FileText, Bell, Trash2, CheckCircle2, AlertCircle, Calendar, Check } from 'lucide-react-native';

const REMINDER_TYPES = ['service', 'insurance', 'registration', 'custom'];
const TYPE_ICONS: Record<string, React.ElementType> = { service: Wrench, insurance: Shield, registration: FileText, custom: Bell };

const RemindersScreen: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'service', vehicle: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rRes, vRes] = await Promise.all([reminderAPI.list(), vehicleAPI.list()]);
      setReminders(rRes.data.reminders || []);
      setVehicles(vRes.data.vehicles || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.dueDate) {
      Alert.alert('Required', 'Title and due date are required.');
      return;
    }
    setSaving(true);
    try {
      await reminderAPI.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        vehicle: form.vehicle || undefined,
        dueDate: form.dueDate,
      });
      setAddModal(false);
      setForm({ title: '', description: '', type: 'service', vehicle: '', dueDate: '' });
      load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create reminder');
    } finally { setSaving(false); }
  };

  const handleAck = (r: Reminder) => {
    Alert.alert('Acknowledge', `Mark "${r.title}" as done?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Acknowledge', onPress: async () => {
          try { await reminderAPI.acknowledge(r._id); load(); }
          catch { Alert.alert('Error', 'Failed to acknowledge'); }
        },
      },
    ]);
  };

  const handleDelete = (r: Reminder) => {
    Alert.alert('Delete', `Remove reminder "${r.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await reminderAPI.remove(r._id); load(); }
          catch { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  const isDue = (dueDate: string) => new Date(dueDate) <= new Date();

  if (loading) return <Spinner fullScreen text="Loading reminders…" />;

  const upcoming = reminders.filter((r) => !r.isAcknowledged);
  const done = reminders.filter((r) => r.isAcknowledged);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Reminders" subtitle={`${upcoming.length} upcoming`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {upcoming.length === 0 && done.length === 0 && (
          <Card>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Bell size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.empty, { padding: 0 }]}>No reminders set. Tap "+ Add" to create one.</Text>
            </View>
          </Card>
        )}

        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcoming.map((r) => {
              const overdue = isDue(r.dueDate);
              return (
              <Card key={r._id} style={overdue ? { borderColor: Colors.error } : undefined}>
                  <View style={styles.remRow}>
                    <View style={styles.remIconContainer}>
                      {TYPE_ICONS[r.type] ? React.createElement(TYPE_ICONS[r.type], { size: 22, color: Colors.textSecondary }) : <Bell size={22} color={Colors.textSecondary} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.remTitle}>{r.title}</Text>
                      {r.vehicle && <Text style={styles.remVehicle}>{r.vehicle.make} {r.vehicle.model}</Text>}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                        {overdue ? <AlertCircle size={12} color={Colors.error} /> : <Calendar size={12} color={Colors.textSecondary} />}
                        <Text style={[styles.remDate, overdue && styles.remDateOverdue, { marginLeft: 4, marginTop: 0 }]}>
                          {overdue ? 'Overdue: ' : 'Due: '}
                          {new Date(r.dueDate).toLocaleDateString('en-IN')}
                        </Text>
                      </View>
                      {r.description ? <Text style={styles.remDesc}>{r.description}</Text> : null}
                    </View>
                    <View style={styles.remActions}>
                      <TouchableOpacity style={styles.ackBtn} onPress={() => handleAck(r)}>
                        <Check size={14} color={Colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtnSm} onPress={() => handleDelete(r)}>
                        <Trash2 size={14} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {done.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Completed</Text>
            {done.slice(0, 5).map((r) => (
              <Card key={r._id} style={styles.doneCard}>
                <View style={styles.remRow}>
                  <View style={styles.remIconContainer}>
                    <CheckCircle2 size={22} color={Colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.remTitle, styles.remTitleDone]}>{r.title}</Text>
                    <Text style={styles.remDate}>{new Date(r.dueDate).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <TouchableOpacity style={styles.delBtnSm} onPress={() => handleDelete(r)}>
                    <Trash2 size={14} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={addModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setAddModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Reminder</Text>
            <TouchableOpacity onPress={() => setAddModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm(p => ({ ...p, title: v }))} placeholder="e.g. Annual service due" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput style={[styles.input, { height: 70 }]} multiline value={form.description} onChangeText={(v) => setForm(p => ({ ...p, description: v }))} placeholder="Optional details…" placeholderTextColor={Colors.textMuted} textAlignVertical="top" />
            </View>

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chipRow}>
              {REMINDER_TYPES.map((t) => {
                const IconComponent = TYPE_ICONS[t] || Bell;
                const isActive = form.type === t;
                return (
                <TouchableOpacity key={t} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setForm((p) => ({ ...p, type: t }))}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconComponent size={14} color={isActive ? '#fff' : Colors.textSecondary} />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{t}</Text>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>

            {vehicles.length > 0 && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Link to Vehicle (optional)</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity style={[styles.chip, !form.vehicle && styles.chipActive]} onPress={() => setForm((p) => ({ ...p, vehicle: '' }))}>
                    <Text style={[styles.chipText, !form.vehicle && styles.chipTextActive]}>None</Text>
                  </TouchableOpacity>
                  {vehicles.map((v) => (
                    <TouchableOpacity key={v._id} style={[styles.chip, form.vehicle === v._id && styles.chipActive]} onPress={() => setForm(p => ({ ...p, vehicle: v._id }))}>
                      <Text style={[styles.chipText, form.vehicle === v._id && styles.chipTextActive]}>{v.make} {v.model}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={[styles.field, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Due Date * (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={form.dueDate} onChangeText={(v) => setForm(p => ({ ...p, dueDate: v }))} placeholder="2025-06-15" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleAdd} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Create Reminder'}</Text>
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
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16 },
  remRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  remIconContainer: { width: 28, alignItems: 'center', marginTop: 2 },
  remTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  remTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  remVehicle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  remDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  remDateOverdue: { color: Colors.error, fontWeight: '700' },
  remDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  remActions: { gap: 6, justifyContent: 'center' },
  ackBtn: { padding: 7, backgroundColor: Colors.successBg, borderRadius: 8, borderWidth: 1, borderColor: Colors.successBorder },
  delBtnSm: { padding: 7, backgroundColor: Colors.errorBg, borderRadius: 8 },
  doneCard: { opacity: 0.6 },
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
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default RemindersScreen;
