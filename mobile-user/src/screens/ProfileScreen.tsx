import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
  Alert, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import { User, Mail, Phone, Gift, Pencil, Key, LogOut, Zap, Tag, Globe, EyeOff, Eye } from 'lucide-react-native';

const ProfileScreen: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone ?? ''); }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Name is required'); return; }
    setSaving(true);
    try {
      await authAPI.updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshUser();
      setEditModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePwd = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { Alert.alert('Validation', 'All fields are required'); return; }
    if (newPwd.length < 6) { Alert.alert('Validation', 'New password must be at least 6 characters'); return; }
    if (newPwd !== confirmPwd) { Alert.alert('Validation', 'New passwords do not match'); return; }
    setChangingPwd(true);
    try {
      await authAPI.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      Alert.alert('Success', 'Password changed successfully');
      setPwdModal(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
    } finally { setChangingPwd(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? '??';

  if (!user) return <Spinner fullScreen text="Loading profile…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Profile" subtitle="Account settings & preferences" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Avatar card */}
        <Card accent>
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
            </View>
          </View>
        </Card>

        {/* Info */}
        <Card>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <Row icon={User} label="Full Name" value={user.name} />
          <Row icon={Mail} label="Email" value={user.email} />
          <Row icon={Phone} label="Phone" value={user.phone || '—'} />
          <Row icon={Gift} label="Referral Code" value={user.referralCode || '—'} />
        </Card>

        {/* Actions */}
        <Card>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => { setEditModal(true); }}>
            <View style={styles.actionIconContainer}><Pencil size={18} color={Colors.textPrimary} /></View>
            <Text style={styles.actionLabel}>Edit Profile</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => setPwdModal(true)}>
            <View style={styles.actionIconContainer}><Key size={18} color={Colors.textPrimary} /></View>
            <Text style={styles.actionLabel}>Change Password</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={styles.actionIconContainer}><LogOut size={18} color={Colors.error} /></View>
            <Text style={[styles.actionLabel, { color: Colors.error }]}>Logout</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* App info */}
        <Card>
          <Text style={styles.sectionTitle}>App Info</Text>
          <Row icon={Zap} label="App" value="EVserv User App" />
          <Row icon={Tag} label="Version" value="1.0.0" />
          <Row icon={Globe} label="Environment" value="Production" last />
        </Card>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={pwdModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setPwdModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPwdModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={currentPwd}
                  onChangeText={setCurrentPwd}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent((p) => !p)}>
                  {showCurrent ? <EyeOff size={16} color={Colors.textSecondary} /> : <Eye size={16} color={Colors.textSecondary} />}
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>New Password</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={newPwd}
                  onChangeText={setNewPwd}
                  secureTextEntry={!showNew}
                  placeholder="Enter new password"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew((p) => !p)}>
                  {showNew ? <EyeOff size={16} color={Colors.textSecondary} /> : <Eye size={16} color={Colors.textSecondary} />}
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity
                style={[styles.saveBtn, changingPwd && styles.saveBtnDisabled]}
                onPress={handleChangePwd}
                disabled={changingPwd}
              >
                <Text style={styles.saveBtnText}>{changingPwd ? 'Changing…' : 'Change Password'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const Row: React.FC<{ icon: React.ElementType; label: string; value: string; last?: boolean }> = ({ icon: Icon, label, value, last }) => (
  <View style={[rowStyles.row, last ? { borderBottomWidth: 0 } : {}]}>
    <View style={rowStyles.iconContainer}>
      <Icon size={16} color={Colors.textSecondary} />
    </View>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  iconContainer: { width: 28, alignItems: 'flex-start' },
  label: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  value: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', maxWidth: 180, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 16 },
  avatarCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  userEmail: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  roleBadge: { backgroundColor: Colors.primaryBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  roleText: { color: Colors.primary, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  actionIconContainer: { width: 32 },
  actionLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  actionArrow: { fontSize: 20, color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: Colors.bgInput, color: Colors.textPrimary, borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { backgroundColor: Colors.border, borderRadius: 10, padding: 12 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default ProfileScreen;
