import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, Modal, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentPicker, { types } from 'react-native-document-picker';
import { vehicleAPI } from '../api';
import apiClient from '../api/apiClient';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Vehicle, VehicleDocument } from '../types';
import { FileText, Shield, Leaf, Receipt, CheckCircle, Paperclip, Car, Trash2, FolderUp, Eye, X as CloseIcon, ExternalLink } from 'lucide-react-native';

const DOC_TYPES = ['rc', 'insurance', 'pollution', 'purchase', 'warranty', 'other'];
const DOC_ICONS: Record<string, React.ElementType> = { rc: FileText, insurance: Shield, pollution: Leaf, purchase: Receipt, warranty: CheckCircle, other: Paperclip, document: FileText };

const guessDocType = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('rc')) return 'rc';
  if (lower.includes('insur')) return 'insurance';
  if (lower.includes('pollut')) return 'pollution';
  if (lower.includes('purch')) return 'purchase';
  if (lower.includes('warrant')) return 'warranty';
  return 'document';
};

const DocumentsScreen: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModal, setUploadModal] = useState<Vehicle | null>(null);
  const [docType, setDocType] = useState('rc');
  const [uploading, setUploading] = useState(false);
  const [docViewerModal, setDocViewerModal] = useState<VehicleDocument | null>(null);

  const getFullImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = apiClient.defaults.baseURL?.replace('/api', '') || 'http://192.168.0.116:5001';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${path}`;
  };

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
      fd.append('type', docType);
      fd.append('document', {
        uri: result.uri,
        type: result.type ?? 'application/octet-stream',
        name: result.name ?? 'document',
      } as any);
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
                  const docName = doc.name || doc.fileName || 'Unnamed Document';
                  let docType = doc.type;
                  if (!docType || docType === 'document') {
                    docType = guessDocType(docName);
                  }
                  const IconComp = DOC_ICONS[docType] || FileText;
                  return (
                  <View key={doc._id} style={styles.docRow}>
                    <View style={styles.docIconContainer}>
                      <IconComp size={22} color={Colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docType}>{docType.toUpperCase()}</Text>
                      <Text style={styles.docFile} numberOfLines={1}>{docName}</Text>
                      <Text style={styles.docDate}>{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity style={styles.viewBtn} onPress={() => {
                        setDocViewerModal(doc);
                      }}>
                        <Eye size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteDoc(v._id, doc)}>
                        <Trash2 size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
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

      <Modal visible={!!docViewerModal} animationType="fade" transparent={true} onRequestClose={() => setDocViewerModal(null)}>
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContent}>
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setDocViewerModal(null)}>
              <CloseIcon size={24} color="#fff" />
            </TouchableOpacity>
            
            {docViewerModal && (() => {
              const currentDoc = docViewerModal;
              const docUrl = currentDoc.url || currentDoc.fileUrl;
              const docName = currentDoc.name || currentDoc.fileName || 'Document';
              let docType = currentDoc.type;
              if (!docType || docType === 'document') {
                docType = guessDocType(docName);
              }
              const fileUrl = getFullImageUrl(docUrl);
              const lowerName = docName.toLowerCase();
              const lowerUrl = docUrl?.toLowerCase() || '';
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/.test(lowerName) || /\.(jpg|jpeg|png|gif|webp)$/.test(lowerUrl);
              const extMatch = lowerName.match(/\.([a-z0-9]+)$/);
              const ext = extMatch ? extMatch[1].toUpperCase() : 'FILE';
              
              return (
                <View style={styles.sliderContainer}>
                  <View style={styles.docViewerWrapper}>
                    <Text style={styles.docViewerTitle}>{docType.toUpperCase()} - {docName}</Text>
                    {!isImage ? (
                      <View style={styles.pdfPlaceholder}>
                        <FileText size={60} color="#fff" style={{ marginBottom: 16 }} />
                        <Text style={styles.pdfText}>{ext} Document</Text>
                        <Text style={styles.pdfSubtext}>This format cannot be previewed directly in the app.</Text>
                        
                        <TouchableOpacity 
                          style={styles.openBtn} 
                          onPress={() => fileUrl && Linking.openURL(fileUrl).catch(() => Alert.alert('Error', 'Cannot open this file type'))}
                        >
                          <ExternalLink size={20} color="#fff" />
                          <Text style={styles.openBtnText}>Open Document</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      fileUrl && <Image source={{ uri: fileUrl }} style={styles.sliderImage} resizeMode="contain" />
                    )}
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark, width:'100%' },
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
  viewBtn: { padding: 8, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: 8, marginRight: 8 },
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageModalContent: { width: '100%', height: '80%', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: -30, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  sliderContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  docViewerWrapper: { flex: 1, height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 50 },
  docViewerTitle: { position: 'absolute', top: 20, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', width: '100%' },
  sliderImage: { width: '100%', height: '80%' },
  sliderArrowLeft: { position: 'absolute', left: 10, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  sliderArrowRight: { position: 'absolute', right: 10, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  sliderDots: { position: 'absolute', bottom: 20, flexDirection: 'row', gap: 8 },
  sliderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  sliderDotActive: { backgroundColor: '#fff', width: 10, height: 10, borderRadius: 5 },
  pdfPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  pdfText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  pdfSubtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, textAlign: 'center', marginBottom: 24 },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  openBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default DocumentsScreen;
