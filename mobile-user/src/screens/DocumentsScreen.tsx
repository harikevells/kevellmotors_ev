import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentPicker, { types } from 'react-native-document-picker';
import { vehicleAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Vehicle, VehicleDocument } from '../types';
import { FileText, Shield, Leaf, Receipt, CheckCircle, Paperclip, Car, Trash2, FolderUp } from 'lucide-react-native';

const DOC_TYPES = ['rc', 'insurance', 'pollution', 'purchase', 'warranty', 'other'];
const DOC_ICONS: Record<string, React.ElementType> = { rc: FileText, insurance: Shield, pollution: Leaf, purchase: Receipt, warranty: CheckCircle, other: Paperclip };

const DocumentsScreen: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModal, setUploadModal] = useState<Vehicle | null>(null);
  const [docType, setDocType] = useState('rc');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await vehicleAPI.list();
      setVehicles(res.data.vehicles || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (vehicle: Vehicle) => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [types.pdf, types.images],
      });
      setUploading(true);
      const fd = new FormData();
      fd.append('document', {
        uri: result.uri,
        type: result.type ?? 'application/octet-stream',
        name: result.name ?? 'document',
      } as any);
      fd.append('type', docType);
      await vehicleAPI.uploadDocument(vehicle._id, fd);
      setUploadModal(null);
      load();
    } catch (err: any) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Upload Failed', err.response?.data?.message || 'Failed to upload document');
      }
    } finally { setUploading(false); }
  };

  const handleDeleteDoc = (vehicleId: string, doc: VehicleDocument) => {
    Alert.alert('Delete Document', `Remove ${doc.type} document?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await vehicleAPI.removeDocument(vehicleId, doc._id); load(); }
          catch { Alert.alert('Error', 'Failed to delete document'); }
        },
      },
    ]);
  };

  if (loading) return <Spinner fullScreen text="Loading documents…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Documents" subtitle="Vehicle documents & certificates" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {vehicles.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Car size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.empty, { padding: 0 }]}>Add a vehicle first to upload documents.</Text>
            </View>
          </Card>
        ) : (
          vehicles.map((v) => (
            <Card key={v._id}>
              <View style={styles.vehicleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehicleName}>{v.make} {v.model} {v.year}</Text>
                  <Text style={styles.vehicleReg}>{v.registrationNumber}</Text>
                </View>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => { setUploadModal(v); setDocType('rc'); }}>
                  <Text style={styles.uploadBtnText}>+ Upload</Text>
                </TouchableOpacity>
              </View>

              {!v.documents || v.documents.length === 0 ? (
                <Text style={styles.noDocs}>No documents uploaded yet</Text>
              ) : (
                v.documents.map((doc) => {
                  const IconComp = DOC_ICONS[doc.type] || FileText;
                  return (
                  <View key={doc._id} style={styles.docRow}>
                    <View style={styles.docIconContainer}>
                      <IconComp size={22} color={Colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docType}>{doc.type}</Text>
                      <Text style={styles.docFile} numberOfLines={1}>{doc.fileName}</Text>
                      <Text style={styles.docDate}>{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteDoc(v._id, doc)}>
                      <Trash2 size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  );
                })
              )}
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={!!uploadModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setUploadModal(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Document</Text>
            <TouchableOpacity onPress={() => setUploadModal(null)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {uploadModal && (
              <>
                <Text style={styles.vehicleName}>{uploadModal.make} {uploadModal.model}</Text>
                <Text style={styles.vehicleReg}>{uploadModal.registrationNumber}</Text>

                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Document Type</Text>
                <View style={styles.chipRow}>
                  {DOC_TYPES.map((t) => {
                    const IconComp = DOC_ICONS[t] || FileText;
                    return (
                    <TouchableOpacity key={t} style={[styles.chip, docType === t && styles.chipActive]} onPress={() => setDocType(t)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <IconComp size={16} color={docType === t ? '#fff' : Colors.textSecondary} />
                        <Text style={[styles.chipText, docType === t && styles.chipTextActive]}>{t.toUpperCase()}</Text>
                      </View>
                    </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.pickBtn, uploading && styles.pickBtnDisabled]}
                  onPress={() => handleUpload(uploadModal)}
                  disabled={uploading}
                >
                  <FolderUp size={22} color={uploading ? Colors.textMuted : '#fff'} />
                  <Text style={styles.pickBtnText}>{uploading ? 'Uploading…' : 'Choose File (PDF / Image)'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 32 },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vehicleName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  vehicleReg: { fontSize: 12, color: Colors.accentLight, marginTop: 2 },
  uploadBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  noDocs: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  docIconContainer: { width: 32, alignItems: 'center' },
  docType: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, textTransform: 'capitalize' },
  docFile: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  docDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  delBtn: { padding: 6, backgroundColor: Colors.errorBg, borderRadius: 8 },
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: 14, padding: 18 },
  pickBtnDisabled: { opacity: 0.6 },
  pickBtnIcon: { fontSize: 22 },
  pickBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default DocumentsScreen;
