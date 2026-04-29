import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { franchiseApi } from '../../api/franchiseApi';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react-native';
import { Colors } from '../../utils/colors';
import type { FranchiseProfile } from '../../types';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

// ── Field row ─────────────────────────────────────────────────────────────────
const Field = ({
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  editable?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      placeholderTextColor={Colors.textMuted}
    />
  </View>
);

export default function FranchiseProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<FranchiseProfile | null>(null);
  const [form, setForm] = useState<FranchiseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getProfile();
      setProfile(res.data.franchise);
      setForm(res.data.franchise);
    } catch {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const set = (key: keyof FranchiseProfile, value: any) =>
    setForm((f) => f ? { ...f, [key]: value } : f);

  const setAddr = (key: string, value: string) =>
    setForm((f) => f ? { ...f, address: { ...f.address, [key]: value } } : f);

  const setHours = (key: 'open' | 'close', value: string) =>
    setForm((f) => f ? { ...f, workingHours: { ...f.workingHours, [key]: value } } : f);

  const toggleDay = (day: string) =>
    setForm((f) => {
      if (!f) return f;
      const days = f.availableDays ?? [];
      return {
        ...f,
        availableDays: days.includes(day)
          ? days.filter((d) => d !== day)
          : [...days, day],
      };
    });

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await franchiseApi.updateProfile(form);
      Alert.alert('Success', 'Profile updated successfully');
      load(true);
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

  if (error || !form) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Failed to load profile.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      {/* Avatar header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'F'}</Text>
        </View>
        <Text style={styles.avatarName}>{form.name}</Text>
        <Text style={styles.memberMeta}>
          Member since {form.createdAt ? new Date(form.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '-'}
        </Text>
        <Text style={styles.memberMeta}>
          {form.rating?.toFixed(1) ?? '0.0'} ({form.reviewCount ?? 0} reviews)
        </Text>
        <View style={[styles.statusBadge,
          { backgroundColor: form.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: form.status === 'active' ? Colors.green : Colors.red }]}>
          <Text style={[styles.statusText,
            { color: form.status === 'active' ? Colors.green : Colors.red }]}>
            {form.status?.toUpperCase() ?? '—'}
          </Text>
        </View>
      </View>

      {/* Basic info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Field label="Name" value={form.name} onChangeText={(v) => set('name', v)} />
        <Field label="Email" value={form.email} keyboardType="email-address" editable={false} />
        <Field label="Phone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
        <Field label="License Number" value={form.licenseNumber ?? ''} onChangeText={(v) => set('licenseNumber', v)} />
        <Field label="GST Number" value={form.gstNumber ?? ''} onChangeText={(v) => set('gstNumber', v)} />
      </View>

      {/* Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Field label="Street" value={form.address?.street ?? ''} onChangeText={(v) => setAddr('street', v)} />
        <Field label="City" value={form.address?.city ?? ''} onChangeText={(v) => setAddr('city', v)} />
        <Field label="State" value={form.address?.state ?? ''} onChangeText={(v) => setAddr('state', v)} />
        <Field label="Pincode" value={form.address?.pincode ?? ''} onChangeText={(v) => setAddr('pincode', v)} keyboardType="numeric" />
      </View>

      {/* Working hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Hours</Text>
        <View style={styles.hoursRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Opens at</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.workingHours?.open ?? ''}
              onChangeText={(v) => setHours('open', v)}
              placeholder="09:00"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.hoursSep} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Closes at</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.workingHours?.close ?? ''}
              onChangeText={(v) => setHours('close', v)}
              placeholder="18:00"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>
      </View>

      {/* Available days */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Days</Text>
        <View style={styles.daysRow}>
          {ALL_DAYS.map((day) => {
            const active = form.availableDays?.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayBtn, active && styles.dayBtnActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>
                  {DAY_ABBR[day]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Capacity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capacity</Text>
        <Field 
          label="Daily Capacity" 
          value={String(form.capacity ?? '')} 
          onChangeText={(v) => set('capacity', Number(v))}
          keyboardType="numeric"
        />
      </View>
      
      {/* Pickup & Drop Service */}
      <View style={[styles.section, { borderLeftWidth: 4, borderLeftColor: Colors.cyan }]}>
        <Text style={styles.sectionTitle}>Pickup & Drop Service</Text>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}
          onPress={() => set('pickupDropService', !form.pickupDropService)}
        >
          <View style={{ 
            width: 24, height: 24, borderRadius: 6, borderWidth: 2, 
            borderColor: form.pickupDropService ? Colors.cyan : Colors.borderLight,
            backgroundColor: form.pickupDropService ? Colors.cyan : 'transparent',
            alignItems: 'center', justifyContent: 'center'
          }}>
            {form.pickupDropService && <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 14 }}>Enable Pickup & Drop</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Allow customers to request vehicle pickup and drop-back.</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LogOut size={20} color={Colors.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  retryBtn: { borderWidth: 1, borderColor: Colors.cyan, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 20 },
  retryText: { color: Colors.cyan, fontWeight: '600' },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  avatarName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  memberMeta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 3 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Section
  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cyan,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Field
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 9,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  fieldInputDisabled: { opacity: 0.5 },

  // Hours
  hoursRow: { flexDirection: 'row', alignItems: 'flex-start' },
  hoursSep: { width: 12 },

  // Days
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: Colors.bgInput,
  },
  dayBtnActive: { backgroundColor: 'rgba(26,110,247,0.2)', borderColor: Colors.blue },
  dayText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  dayTextActive: { color: Colors.blue },

  // Buttons
  saveBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  logoutBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  logoutText: { color: Colors.red, fontWeight: '700', fontSize: 14 },
});
