import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { feedbackAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Feedback } from '../types';
import { MessageSquare, MessageCircle, Star } from 'lucide-react-native';

const STAR_LABELS = ['Terrible', 'Bad', 'OK', 'Good', 'Excellent'];

const FeedbackScreen: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '', category: 'general' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await feedbackAPI.myFeedback();
      setFeedbacks(res.data.feedback || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.comment.trim()) { Alert.alert('Required', 'Please write a comment.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('rating', String(form.rating));
      fd.append('comment', form.comment.trim());
      fd.append('category', form.category);
      await feedbackAPI.submit(fd);
      setAddModal(false);
      setForm({ rating: 5, comment: '', category: 'general' });
      load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit feedback');
    } finally { setSaving(false); }
  };

  const CATEGORIES = ['general', 'service', 'app', 'billing', 'other'];

  if (loading) return <Spinner fullScreen text="Loading feedback…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Feedback" subtitle="Your reviews & suggestions"
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
            <Text style={styles.addBtnText}>+ Submit</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {feedbacks.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <MessageSquare size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.empty, { padding: 0 }]}>No feedback submitted yet.</Text>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setAddModal(true)}>
              <Text style={styles.submitBtnText}>Submit Feedback</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          feedbacks.map((fb) => (
            <Card key={fb._id}>
              <View style={styles.fbHeader}>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} color={s <= fb.rating ? '#f59e0b' : Colors.border} fill={s <= fb.rating ? '#f59e0b' : 'transparent'} />
                  ))}
                  <Text style={styles.ratingLabel}>{STAR_LABELS[fb.rating - 1]}</Text>
                </View>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{fb.category}</Text>
                </View>
              </View>
              <Text style={styles.fbComment}>{fb.comment}</Text>
              <Text style={styles.fbDate}>{new Date(fb.createdAt).toLocaleDateString('en-IN')}</Text>
              {fb.adminResponse && (
                <View style={styles.adminReply}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <MessageCircle size={14} color={Colors.accentLight} style={{ marginRight: 6 }} />
                    <Text style={[styles.adminReplyLabel, { marginBottom: 0 }]}>Admin Response</Text>
                  </View>
                  <Text style={styles.adminReplyText}>{fb.adminResponse}</Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={addModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setAddModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Feedback</Text>
            <TouchableOpacity onPress={() => setAddModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setForm((p) => ({ ...p, rating: s }))}>
                  <Star size={36} color={s <= form.rating ? '#f59e0b' : Colors.border} fill={s <= form.rating ? '#f59e0b' : 'transparent'} />
                </TouchableOpacity>
              ))}
              <Text style={styles.starLabel}>{STAR_LABELS[form.rating - 1]}</Text>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => setForm((p) => ({ ...p, category: c }))}>
                  <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.field, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Your Feedback *</Text>
              <TextInput
                style={[styles.input, { height: 120 }]}
                multiline value={form.comment}
                onChangeText={(v) => setForm((p) => ({ ...p, comment: v }))}
                placeholder="Tell us about your experience…"
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSubmit} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Submitting…' : 'Submit Feedback'}</Text>
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
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fbHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingLabel: { fontSize: 11, color: Colors.textMuted, marginLeft: 6, fontWeight: '600' },
  catBadge: { backgroundColor: Colors.bgCardAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize', fontWeight: '600' },
  fbComment: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  fbDate: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  adminReply: { marginTop: 10, backgroundColor: Colors.bgCardAlt, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  adminReplyLabel: { fontSize: 11, fontWeight: '700', color: Colors.accentLight, marginBottom: 4 },
  adminReplyText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: '600', marginLeft: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: 15 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default FeedbackScreen;
