import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { franchiseApi } from '../../api/franchiseApi';
import BookingCard from '../../components/BookingCard';
import { Colors } from '../../utils/colors';
import { formatINR } from '../../utils/helpers';
import { generateAndShareInvoicePdf } from '../../utils/invoicePdf';
import type { Booking, ServiceStatus, InvoiceItem, JobCard } from '../../types';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'onboarded',     label: 'New' },
  { key: 'diagnosis',     label: 'Accepted' },
  { key: 'in_progress',   label: 'In Service' },
  { key: 'waiting_parts', label: 'Waiting' },
  { key: 'quality_check', label: 'QC' },
  { key: 'delivered',     label: 'Done' },
];

type InvoicePartRow = {
  id: string;
  description: string;
  amount: string;
};

type InvoicePayload = {
  invoiceItems: InvoiceItem[];
  technicianNotes?: string;
};

interface InvoiceEditorModalProps {
  visible: boolean;
  booking: Booking | null;
  saving: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (payload: InvoicePayload) => void;
}

function InvoiceEditorModal({ visible, booking, saving, title, onClose, onConfirm }: InvoiceEditorModalProps) {
  const [serviceCharge, setServiceCharge] = useState('');
  const [parts, setParts] = useState<InvoicePartRow[]>([{ id: 'row-0', description: '', amount: '' }]);
  const [notes, setNotes] = useState('');
  const [partPickerOpenFor, setPartPickerOpenFor] = useState<number | null>(null);
  const [customerParts, setCustomerParts] = useState<{ name: string; price: number }[]>([]);

  useEffect(() => {
    if (!visible || !booking) return;
    const serviceItem = booking.invoiceItems?.find((item) => item.type === 'service');
    const partItems = booking.invoiceItems?.filter((item) => item.type !== 'service') ?? [];
    setServiceCharge(serviceItem?.amount ? String(serviceItem.amount) : '');
    setParts(
      partItems.length > 0
        ? partItems.map((item, i) => ({ id: `row-${i}`, description: item.description, amount: String(item.amount) }))
        : [{ id: 'row-0', description: '', amount: '' }],
    );
    setNotes(booking.technicianNotes ?? '');

    if (booking.owner?._id) {
      franchiseApi.getCustomerOrders(booking.owner._id).then(res => {
        const partsList = res.data.orders.flatMap((o: any) => o.items.map((i: any) => ({ name: i.part?.name, price: i.price })));
        const uniqueParts = partsList.filter((p: any, index: number, self: any[]) => p.name && index === self.findIndex(t => t.name === p.name));
        setCustomerParts(uniqueParts);
      }).catch(err => console.log('Failed to fetch orders:', err));
    } else {
      setCustomerParts([]);
    }
  }, [visible, booking]);

  const updatePart = (index: number, key: 'description' | 'amount', value: string) => {
    setParts((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addPart = () => setParts((prev) => [...prev, { id: `row-${Date.now()}`, description: '', amount: '' }]);
  const removePart = (index: number) => {
    setParts((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const validParts = parts.filter((part) => part.description.trim() && Number(part.amount) > 0);
  
  const activeSub = booking?.activeSubscription;
  const plan = activeSub?.planDetail;
  const svcDiscount = plan?.serviceDiscount || 0;
  const partDiscount = plan?.sparePartsDiscount || 0;

  const grossService = Number(serviceCharge) || 0;
  const grossParts = validParts.reduce((sum, part) => sum + (Number(part.amount) || 0), 0);
  
  const discountService = grossService * (svcDiscount / 100);
  const discountParts = grossParts * (partDiscount / 100);
  
  const totalDiscount = discountService + discountParts;
  const total = grossService + grossParts - totalDiscount;

  const handleSubmit = () => {
    if (!booking) return;
    const serviceAmount = Number(serviceCharge);
    if (!serviceAmount) return;

    const invoiceItems: InvoiceItem[] = [
      {
        description: `${booking.serviceType} Service`,
        type: 'service',
        amount: serviceAmount,
      },
      ...validParts.map((part) => ({
        description: part.description,
        type: 'part' as const,
        amount: Number(part.amount),
      })),
    ];

    onConfirm({
      invoiceItems,
      technicianNotes: notes.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <Pressable onPress={() => undefined} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              {booking ? (
                <Text style={styles.modalSubtitle}>
                  {booking.owner?.name} - {booking.vehicle?.registrationNumber}
                </Text>
              ) : null}
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <Text style={styles.fieldLabel}>Service / Labour Charge (INR) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1500"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={serviceCharge}
                onChangeText={setServiceCharge}
              />

              <View style={styles.sectionHeader}>
                <Text style={styles.fieldLabel}>Spare Parts / Additional Items</Text>
                <TouchableOpacity style={styles.addRowBtn} onPress={addPart}>
                  <Text style={styles.addRowText}>+ Add Row</Text>
                </TouchableOpacity>
              </View>

              {parts.map((part, index) => (
                <View key={part.id} style={styles.partRow}>
                  <View style={{ flex: 1.4, position: 'relative', justifyContent: 'center' }}>
                    <TextInput
                      style={[styles.input, { paddingRight: 36 }]}
                      placeholder="Part / Item name"
                      placeholderTextColor={Colors.textMuted}
                      value={part.description}
                      onChangeText={(value) => updatePart(index, 'description', value)}
                    />
                    <TouchableOpacity
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 36, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => setPartPickerOpenFor(index)}
                    >
                      <Text style={{ color: Colors.textMuted, fontSize: 12 }}>▼</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, styles.partAmountInput]}
                    placeholder="Amount"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={part.amount}
                    onChangeText={(value) => updatePart(index, 'amount', value)}
                  />
                  {parts.length > 1 ? (
                    <TouchableOpacity style={styles.removePartBtn} onPress={() => removePart(index)}>
                      <Text style={styles.removePartText}>x</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}

              <Text style={styles.fieldLabel}>Technician Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Work done, observations..."
                placeholderTextColor={Colors.textMuted}
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.breakdownContainer}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Service / Labour Charge</Text>
                  <Text style={styles.breakdownValue}>{formatINR(grossService)}</Text>
                </View>
                {grossParts > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Spare Parts / Additional</Text>
                    <Text style={styles.breakdownValue}>{formatINR(grossParts)}</Text>
                  </View>
                )}
                
                {activeSub ? (
                  <View style={styles.subscriptionBox}>
                    <Text style={{ color: Colors.cyan, fontWeight: '700', marginBottom: 4 }}>
                      Active Subscription: {plan?.name || 'Custom Plan'}
                    </Text>
                    {svcDiscount > 0 && <Text style={{ color: Colors.textMuted, fontSize: 13 }}>• Service Discount: {svcDiscount}% (-{formatINR(discountService)})</Text>}
                    {partDiscount > 0 && <Text style={{ color: Colors.textMuted, fontSize: 13 }}>• Spare Parts Discount: {partDiscount}% (-{formatINR(discountParts)})</Text>}
                    {totalDiscount > 0 && (
                      <View style={[styles.breakdownRow, { marginTop: 8, marginBottom: 0 }]}>
                        <Text style={[styles.breakdownLabel, { color: Colors.green, fontWeight: '700' }]}>Total Discount Applied</Text>
                        <Text style={[styles.breakdownValue, { color: Colors.green, fontWeight: '700' }]}>-{formatINR(totalDiscount)}</Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total Invoice Amount</Text>
                <Text style={styles.totalAmount}>{formatINR(total)}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.primaryBtn, (!serviceCharge || saving) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!serviceCharge || saving}
              >
                <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Complete & Generate'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineBtn} onPress={onClose}>
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      {partPickerOpenFor !== null && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
          <View style={[styles.modalCard, { width: 300, maxHeight: 450 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Spare Part</Text>
            </View>
            <FlatList
              data={customerParts}
              keyExtractor={(item) => item.name}
              ListEmptyComponent={() => (
                <Text style={{ color: Colors.textMuted, textAlign: 'center', padding: 20 }}>
                  Customer has no recent orders.
                </Text>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, flexDirection: 'row', justifyContent: 'space-between' }}
                  onPress={() => {
                    updatePart(partPickerOpenFor, 'description', item.name);
                    updatePart(partPickerOpenFor, 'amount', String(item.price));
                    setPartPickerOpenFor(null);
                  }}
                >
                  <Text style={{ color: Colors.textPrimary, fontSize: 14 }}>{item.name}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 13 }}>{formatINR(item.price)}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={{ padding: 14, alignItems: 'center' }} onPress={() => setPartPickerOpenFor(null)}>
              <Text style={{ color: Colors.cyan, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );
}

interface InvoiceViewModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

function InvoiceViewModal({ visible, booking, onClose }: InvoiceViewModalProps) {
  const [exporting, setExporting] = useState(false);

  if (!booking) return null;
  const items = booking.invoiceItems ?? [];
  const total = booking.finalAmount ?? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const activeSub = booking.activeSubscription;
  const plan = activeSub?.planDetail;
  const svcDiscount = plan?.serviceDiscount || 0;
  const partDiscount = plan?.sparePartsDiscount || 0;

  let grossService = 0;
  let grossParts = 0;
  let totalDiscount = 0;
  let discountService = 0;
  let discountParts = 0;

  const displayItems = items.map(item => {
    let amt = Number(item.amount) || 0;
    let orig = amt;
    let desc = item.description;
    const match = item.description.match(/(.*?)\s*\(-(\d+)%\)$/);
    if (match) {
      desc = match[1];
      const pct = Number(match[2]);
      orig = Math.round(amt / (1 - pct / 100));
      const discAmt = orig - amt;
      totalDiscount += discAmt;
      if (item.type === 'service') discountService += discAmt;
      else discountParts += discAmt;
    }
    if (item.type === 'service') grossService += orig;
    else grossParts += orig;
    
    return { ...item, cleanDescription: desc, originalAmount: orig, isDiscounted: !!match };
  });

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      await generateAndShareInvoicePdf(booking);
    } catch (err: any) {
      console.log('PDF share error:', err);
      Alert.alert('PDF export failed', err.message || 'Unable to generate the invoice PDF right now. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>Invoice</Text>
              <Text style={styles.modalSubtitle}>{booking.franchise?.name ?? 'EVserv Franchise'}</Text>
            </View>
            <View style={styles.headerActionGroup}>
              <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPdf} disabled={exporting}>
                <Text style={styles.pdfBtnText}>{exporting ? 'Generating...' : 'Share PDF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
            <View style={styles.invoiceBrandRow}>
              <View>
                <Text style={styles.invoiceBrand}>Kevell Motors</Text>
                <Text style={styles.invoiceBrandSub}>{booking.franchise?.name ?? 'EVserv Franchise'}</Text>
                <Text style={styles.invoiceBrandSub}>
                  {booking.franchise?.address?.street ?? ''}
                  {booking.franchise?.address?.street && booking.franchise?.address?.city ? ', ' : ''}
                  {booking.franchise?.address?.city ?? ''}
                </Text>
              </View>
              <View style={styles.invoiceHeaderRight}>
                <Text style={styles.taxInvoiceLabel}>TAX INVOICE</Text>
                <Text style={styles.invoiceMetaText}>#{booking.invoiceNumber ?? 'Pending'}</Text>
                <Text style={styles.invoiceMetaText}>
                  {booking.invoiceDate ? new Date(booking.invoiceDate).toLocaleDateString('en-IN') : 'Date pending'}
                </Text>
              </View>
            </View>

            <View style={styles.invoiceTopMeta}>
              <Text style={styles.invoiceMetaText}>Customer: {booking.owner?.name}</Text>
              <Text style={styles.invoiceMetaText}>{booking.owner?.phone}</Text>
            </View>

            <View style={styles.billToBox}>
              <Text style={styles.billToLabel}>Bill To</Text>
              <Text style={styles.billToText}>{booking.owner?.name}</Text>
              <Text style={styles.billToSubText}>{booking.owner?.phone}</Text>
              <Text style={styles.billToSubText}>
                {booking.vehicle?.registrationNumber} - {booking.vehicle?.make} {booking.vehicle?.model}
              </Text>
            </View>

            {displayItems.length === 0 ? (
              <Text style={styles.emptyInvoiceText}>No invoice line items recorded.</Text>
            ) : (
              displayItems.map((item, index) => (
                <View key={`${index}-${item.cleanDescription}`} style={styles.invoiceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invoiceItemName}>{item.cleanDescription}</Text>
                    <Text style={styles.invoiceItemType}>{item.type ?? 'item'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {item.isDiscounted && (
                      <Text style={{ fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through', marginBottom: 2 }}>
                        {formatINR(item.originalAmount)}
                      </Text>
                    )}
                    <Text style={styles.invoiceItemAmount}>{formatINR(item.amount)}</Text>
                  </View>
                </View>
              ))
            )}

            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Service / Labour Total</Text>
                <Text style={styles.breakdownValue}>{formatINR(grossService)}</Text>
              </View>
              {grossParts > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Spare Parts Total</Text>
                  <Text style={styles.breakdownValue}>{formatINR(grossParts)}</Text>
                </View>
              )}
              {activeSub ? (
                <View style={styles.subscriptionBox}>
                  <Text style={{ color: Colors.cyan, fontWeight: '700', marginBottom: 4 }}>
                    Active Subscription: {plan?.name || 'Custom Plan'}
                  </Text>
                  {svcDiscount > 0 && <Text style={{ color: Colors.textMuted, fontSize: 13 }}>• Service Discount: {svcDiscount}% (-{formatINR(discountService)})</Text>}
                  {partDiscount > 0 && <Text style={{ color: Colors.textMuted, fontSize: 13 }}>• Spare Parts Discount: {partDiscount}% (-{formatINR(discountParts)})</Text>}
                  {totalDiscount > 0 && (
                    <View style={[styles.breakdownRow, { marginTop: 8, marginBottom: 0 }]}>
                      <Text style={[styles.breakdownLabel, { color: Colors.green, fontWeight: '700' }]}>Total Discount</Text>
                      <Text style={[styles.breakdownValue, { color: Colors.green, fontWeight: '700' }]}>-{formatINR(totalDiscount)}</Text>
                    </View>
                  )}
                </View>
              ) : totalDiscount > 0 ? (
                <View style={[styles.breakdownRow, { marginTop: 4, marginBottom: 0 }]}>
                  <Text style={[styles.breakdownLabel, { color: Colors.green, fontWeight: '700' }]}>Total Discount</Text>
                  <Text style={[styles.breakdownValue, { color: Colors.green, fontWeight: '700' }]}>-{formatINR(totalDiscount)}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.totalBox, { marginTop: 4 }]}>
              <Text style={styles.totalLabel}>Total Invoice Amount</Text>
              <Text style={styles.totalAmount}>{formatINR(total)}</Text>
            </View>

            {booking.technicianNotes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Technician Notes</Text>
                <Text style={styles.notesText}>{booking.technicianNotes}</Text>
              </View>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function JobCardModal({
  visible,
  booking,
  saving,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  booking: Booking | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (data: JobCard) => void;
}) {
  const [formData, setFormData] = useState<JobCard>({});

  useEffect(() => {
    if (visible && booking) {
      setFormData({
        jobNo: booking.jobCard?.jobNo || '',
        date: booking.jobCard?.date || new Date().toISOString().split('T')[0],
        make: booking.jobCard?.make || booking.vehicle?.make || '',
        year: booking.jobCard?.year || String(booking.vehicle?.year || ''),
        model: booking.jobCard?.model || booking.vehicle?.model || '',
        colour: booking.jobCard?.colour || '',
        regNo: booking.jobCard?.regNo || booking.vehicle?.registrationNumber || '',
        speedo: booking.jobCard?.speedo || '',
        totalAmount: booking.jobCard?.totalAmount || booking.estimatedAmount || 0,
        customerName: booking.jobCard?.customerName || booking.owner?.name || '',
        customerContact: booking.jobCard?.customerContact || booking.owner?.phone || '',
        address: booking.jobCard?.address || '',
        postCode: booking.jobCard?.postCode || '',
        phone: booking.jobCard?.phone || booking.owner?.phone || '',
        fax: booking.jobCard?.fax || '',
        repairOrderNo: booking.jobCard?.repairOrderNo || '',
        inDate: booking.jobCard?.inDate || '',
        outDate: booking.jobCard?.outDate || '',
        charge: booking.jobCard?.charge || 0,
        cash: booking.jobCard?.cash || 0,
        vehicleInfo: booking.jobCard?.vehicleInfo || '',
        sundries: booking.jobCard?.sundries || '',
      });
    }
  }, [visible, booking]);

  const updateField = (key: keyof JobCard, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Service Job Card</Text>
              <Text style={styles.modalSubtitle}>Fill in vehicle & customer details</Text>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <View style={styles.formGrid}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Job No</Text>
                  <TextInput style={styles.input} value={formData.jobNo} onChangeText={(v) => updateField('jobNo', v)} placeholder="Auto or Manual" placeholderTextColor={Colors.textMuted} />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput style={styles.input} value={formData.date} onChangeText={(v) => updateField('date', v)} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />
                </View>
              </View>

              <View style={styles.formSectionHeader}><Text style={styles.sectionTitle}>Vehicle Details</Text></View>
              <View style={styles.formGrid}>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Make</Text><TextInput style={styles.input} value={formData.make} onChangeText={(v) => updateField('make', v)} /></View>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Model</Text><TextInput style={styles.input} value={formData.model} onChangeText={(v) => updateField('model', v)} /></View>
              </View>
              <View style={styles.formGrid}>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Year</Text><TextInput style={styles.input} value={formData.year} onChangeText={(v) => updateField('year', v)} keyboardType="numeric" /></View>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Colour</Text><TextInput style={styles.input} value={formData.colour} onChangeText={(v) => updateField('colour', v)} /></View>
              </View>
              <View style={styles.formGrid}>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Reg. No</Text><TextInput style={styles.input} value={formData.regNo} onChangeText={(v) => updateField('regNo', v)} /></View>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Speedo</Text><TextInput style={styles.input} value={formData.speedo} onChangeText={(v) => updateField('speedo', v)} /></View>
              </View>

              <View style={styles.formSectionHeader}><Text style={styles.sectionTitle}>Customer Details</Text></View>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.input} value={formData.customerName} onChangeText={(v) => updateField('customerName', v)} />
              <Text style={styles.fieldLabel}>Contact</Text>
              <TextInput style={styles.input} value={formData.customerContact} onChangeText={(v) => updateField('customerContact', v)} keyboardType="phone-pad" />
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput style={[styles.input, { height: 60 }]} multiline value={formData.address} onChangeText={(v) => updateField('address', v)} />
              
              <View style={styles.formGrid}>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Post Code</Text><TextInput style={styles.input} value={formData.postCode} onChangeText={(v) => updateField('postCode', v)} /></View>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Repair Order No</Text><TextInput style={styles.input} value={formData.repairOrderNo} onChangeText={(v) => updateField('repairOrderNo', v)} /></View>
              </View>

              <View style={styles.formSectionHeader}><Text style={styles.sectionTitle}>Repair Instructions</Text></View>
              <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Describe the issues or instructions..." placeholderTextColor={Colors.textMuted} value={formData.vehicleInfo} onChangeText={(v) => updateField('vehicleInfo', v)} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={() => onConfirm(formData)} disabled={saving}>
                <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Save Job Card'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={onClose}><Text style={styles.outlineBtnText}>Cancel</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PaymentStatusSelector({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (status: string) => void }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { width: 300, maxHeight: 400 }]} onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Status</Text>
            <Text style={styles.modalSubtitle}>Update payment for this service</Text>
          </View>
          <View style={{ padding: 14 }}>
            {(['pending', 'confirmed', 'waived'] as const).map(status => (
              <TouchableOpacity
                key={status}
                style={{
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.border,
                }}
                onPress={() => onSelect(status)}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: status === 'confirmed' ? Colors.green : status === 'waived' ? Colors.yellow : Colors.textPrimary, textTransform: 'capitalize' }}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ padding: 14, marginTop: 10, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ color: Colors.cyan, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const NewBookingModal = ({ visible, onClose, onConfirm, saving }: { visible: boolean; onClose: () => void; onConfirm: (data: any) => void; saving: boolean }) => {
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', regNo: '', make: '', model: '', serviceType: 'general', description: '', pickupRequested: false
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Booking</Text>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <Text style={styles.fieldLabel}>Customer Name *</Text>
              <TextInput style={styles.input} value={form.customerName} onChangeText={v => setForm({...form, customerName: v})} placeholder="Full Name" placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <TextInput style={styles.input} value={form.customerPhone} onChangeText={v => setForm({...form, customerPhone: v})} keyboardType="phone-pad" placeholder="Contact number" placeholderTextColor={Colors.textMuted} />
              <View style={styles.formGrid}>
                <View style={[styles.formCol, { marginRight: 8 }]}><Text style={styles.fieldLabel}>Reg No *</Text><TextInput style={styles.input} value={form.regNo} onChangeText={v => setForm({...form, regNo: v.toUpperCase()})} /></View>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Service Type</Text>
                  <TextInput style={styles.input} value={form.serviceType} onChangeText={v => setForm({...form, serviceType: v})} />
                </View>
              </View>
              <View style={styles.formGrid}>
                <View style={[styles.formCol, { marginRight: 8 }]}><Text style={styles.fieldLabel}>Make</Text><TextInput style={styles.input} value={form.make} onChangeText={v => setForm({...form, make: v})} /></View>
                <View style={styles.formCol}><Text style={styles.fieldLabel}>Model</Text><TextInput style={styles.input} value={form.model} onChangeText={v => setForm({...form, model: v})} /></View>
              </View>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, { height: 60 }]} multiline value={form.description} onChangeText={v => setForm({...form, description: v})} />
              
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10, padding: 12, backgroundColor: 'rgba(0,229,255,0.05)', borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
                onPress={() => setForm({...form, pickupRequested: !form.pickupRequested})}
              >
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: form.pickupRequested ? Colors.cyan : Colors.border, backgroundColor: form.pickupRequested ? Colors.cyan : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {form.pickupRequested && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Pickup Requested</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={() => onConfirm(form)} disabled={saving}>
                <Text style={styles.primaryBtnText}>{saving ? 'Creating...' : 'Create Booking'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={onClose}><Text style={styles.outlineBtnText}>Cancel</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default function FranchiseBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<Booking | null>(null);
  const [addInvoiceTarget, setAddInvoiceTarget] = useState<Booking | null>(null);
  const [viewInvoiceTarget, setViewInvoiceTarget] = useState<Booking | null>(null);
  const [paymentUpdateTarget, setPaymentUpdateTarget] = useState<Booking | null>(null);
  const [jobCardTarget, setJobCardTarget] = useState<Booking | null>(null);
  const [newBookingVisible, setNewBookingVisible] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchiseApi.getBookings();
      setBookings(res.data.bookings ?? []);
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const updateStatus = async (
    id: string,
    body: { status: ServiceStatus; invoiceItems?: InvoiceItem[]; technicianNotes?: string },
  ) => {
    setUpdating(id);
    try {
      await franchiseApi.updateBookingStatus(id, body);
      await load(true);
    } catch {
      setError('Failed to update booking.');
    } finally {
      setUpdating(null);
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    setUpdating(id);
    try {
      await franchiseApi.confirmPayment(id, { paymentStatus });
      await load(true);
      setPaymentUpdateTarget(null);
    } catch {
      Alert.alert('Error', 'Failed to update payment status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateBooking = async (data: any) => {
    setUpdating('new');
    try {
      await franchiseApi.createBooking(data);
      setNewBookingVisible(false);
      load();
    } catch {
      Alert.alert('Error', 'Failed to create booking.');
    } finally {
      setUpdating(null);
    }
  };

  const handleAdvance = async (booking: Booking) => {
    const nextMap: Record<string, ServiceStatus> = {
      onboarded:     'diagnosis',
      diagnosis:     'in_progress',
      in_progress:   'quality_check',
      quality_check: 'delivered',
    };
    const next = nextMap[booking.status];
    if (!next) return;
    if (next === 'delivered') {
      setInvoiceTarget(booking);
      return;
    }
    await updateStatus(booking._id, { status: next });
  };

  const handleCancel = async (booking: Booking) => {
    await updateStatus(booking._id, { status: 'cancelled' });
  };

  const submitInvoice = async (target: Booking | null, payload: InvoicePayload, closeModal: () => void) => {
    if (!target) return;
    await updateStatus(target._id, {
      status: 'delivered',
      invoiceItems: payload.invoiceItems,
      technicianNotes: payload.technicianNotes,
    });
    closeModal();
    setViewInvoiceTarget({
      ...target,
      status: 'delivered',
      invoiceItems: payload.invoiceItems,
      technicianNotes: payload.technicianNotes,
      finalAmount: payload.invoiceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    });
  };

  const handleJobCardSave = async (data: JobCard) => {
    if (!jobCardTarget) return;
    setUpdating(jobCardTarget._id);
    try {
      await franchiseApi.updateJobCard(jobCardTarget._id, data);
      await load(true);
      setJobCardTarget(null);
    } catch {
      Alert.alert('Error', 'Failed to save Job Card.');
    } finally {
      setUpdating(null);
    }
  };

  const handleLogisticsUpdate = async (booking: Booking, type: 'pickup' | 'drop', current: string) => {
    setUpdating(booking._id);
    try {
      // 'none' and 'pending' both mean not-yet-collected; first press marks as completed
      const next = current === 'completed' ? 'pending' : 'completed';
      await franchiseApi.updateLogisticsStatus(booking._id, {
        [type === 'pickup' ? 'pickupStatus' : 'dropStatus']: next,
      });
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update logistics status.');
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings =
    tab === 'all' ? bookings : bookings.filter((booking) => booking.status === (tab as ServiceStatus));

  const tabCounts = STATUS_TABS.reduce<Record<string, number>>((acc, statusTab) => {
    acc[statusTab.key] =
      statusTab.key === 'all'
        ? bookings.length
        : bookings.filter((booking) => booking.status === statusTab.key).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header with Add Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.textPrimary }}>Bookings</Text>
        <TouchableOpacity 
          style={{ backgroundColor: Colors.cyan, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}
          onPress={() => setNewBookingVisible(true)}
        >
          <Text style={{ color: Colors.bg, fontWeight: '800', fontSize: 13 }}>+ New</Text>
        </TouchableOpacity>
      </View>
      {/* Tab bar */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(t) => t.key}
        showsHorizontalScrollIndicator={false}
        style={styles.tabList}
        contentContainerStyle={styles.tabContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tabBtn, tab === item.key && styles.tabBtnActive]}
            onPress={() => setTab(item.key)}
          >
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>
              {item.label} {tabCounts[item.key] > 0 ? `(${tabCounts[item.key]})` : ''}
            </Text>
          </TouchableOpacity>
        )}
      />

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.cyan}
              colors={[Colors.cyan]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No bookings for this status</Text>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              onViewInvoice={setViewInvoiceTarget}
              onAddInvoice={setAddInvoiceTarget}
              onChangePaymentStatus={setPaymentUpdateTarget}
              onJobCard={setJobCardTarget}
              onViewDetails={(b) => navigation.navigate('BookingDetails', { bookingId: b._id })}
              onLogisticsUpdate={handleLogisticsUpdate}
              busy={updating === item._id}
            />
          )}
        />
      )}

      <JobCardModal
        visible={!!jobCardTarget}
        booking={jobCardTarget}
        saving={!!jobCardTarget && updating === jobCardTarget._id}
        onClose={() => setJobCardTarget(null)}
        onConfirm={handleJobCardSave}
      />

      <InvoiceEditorModal
        visible={!!invoiceTarget}
        booking={invoiceTarget}
        saving={!!invoiceTarget && updating === invoiceTarget._id}
        title="Generate Invoice"
        onClose={() => setInvoiceTarget(null)}
        onConfirm={(payload) => submitInvoice(invoiceTarget, payload, () => setInvoiceTarget(null))}
      />

      <InvoiceEditorModal
        visible={!!addInvoiceTarget}
        booking={addInvoiceTarget}
        saving={!!addInvoiceTarget && updating === addInvoiceTarget._id}
        title="Add Invoice"
        onClose={() => setAddInvoiceTarget(null)}
        onConfirm={(payload) => submitInvoice(addInvoiceTarget, payload, () => setAddInvoiceTarget(null))}
      />

      <InvoiceViewModal
        visible={!!viewInvoiceTarget}
        booking={viewInvoiceTarget}
        onClose={() => setViewInvoiceTarget(null)}
      />

      <PaymentStatusSelector
        visible={!!paymentUpdateTarget}
        onClose={() => setPaymentUpdateTarget(null)}
        onSelect={(status) => paymentUpdateTarget && updatePaymentStatus(paymentUpdateTarget._id, status)}
      />

      <NewBookingModal
        visible={newBookingVisible}
        saving={updating === 'new'}
        onClose={() => setNewBookingVisible(false)}
        onConfirm={handleCreateBooking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 20,
  },
  retryText: { color: Colors.cyan, fontWeight: '600' },

  tabList: { maxHeight: 48, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabContent: { paddingHorizontal: 12, alignItems: 'center' },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 4,
  },
  tabBtnActive: { borderBottomColor: Colors.cyan },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.cyan },

  list: { padding: 14, paddingBottom: 32 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', padding: 32 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
    minHeight: 300,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderRow: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  modalSubtitle: { color: Colors.textSecondary, marginTop: 4, fontSize: 12 },
  closeText: { color: Colors.cyan, fontSize: 13, fontWeight: '700' },
  pdfBtn: {
    borderWidth: 1,
    borderColor: 'rgba(26,110,247,0.35)',
    backgroundColor: 'rgba(26,110,247,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pdfBtnText: { color: Colors.blue, fontWeight: '700', fontSize: 12 },
  modalBody: { maxHeight: Dimensions.get('window').height * 0.7 },
  modalBodyContent: { padding: 14, paddingBottom: 50, flexGrow: 1 },

  invoiceBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  invoiceBrand: { color: Colors.blue, fontSize: 18, fontWeight: '800' },
  invoiceBrandSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  invoiceHeaderRight: { alignItems: 'flex-end' },
  taxInvoiceLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 4 },

  fieldLabel: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgInput,
  },
  sectionHeader: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addRowBtn: {
    borderWidth: 1,
    borderColor: Colors.blue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(26,110,247,0.15)',
  },
  addRowText: { color: Colors.blue, fontWeight: '700', fontSize: 12 },

  partRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partNameInput: { flex: 1.4 },
  partAmountInput: { flex: 0.9 },
  removePartBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  removePartText: { color: Colors.red, fontWeight: '700' },
  notesInput: { minHeight: 86, textAlignVertical: 'top' },

  totalBox: {
    marginTop: 2,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: Colors.green, fontWeight: '700' },
  totalAmount: { color: Colors.green, fontSize: 20, fontWeight: '800' },
  breakdownContainer: {
    marginTop: 16,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  breakdownValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionBox: {
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.1)',
  },

  modalActions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: Colors.green,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  outlineBtnText: { color: Colors.textPrimary, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  invoiceTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  invoiceMetaText: { color: Colors.textSecondary, fontSize: 12 },
  billToBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  billToLabel: { color: Colors.textSecondary, fontSize: 11, marginBottom: 4 },
  billToText: { color: Colors.textPrimary, fontWeight: '700' },
  billToSubText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  emptyInvoiceText: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 18,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  invoiceItemName: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  invoiceItemType: { color: Colors.textMuted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  invoiceItemAmount: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  invoiceTotalRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  notesBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  notesTitle: { color: Colors.yellow, fontWeight: '700', marginBottom: 4 },
  notesText: { color: Colors.textPrimary, fontSize: 12 },

  // Job Card & Details Styles
  formGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  formCol: { flex: 1 },
  formSectionHeader: { marginTop: 15, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 4 },
  sectionTitle: { color: Colors.cyan, fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  detailSection: { marginBottom: 20, padding: 12, backgroundColor: Colors.bgInput, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  detailText: { color: Colors.textPrimary, fontSize: 14, marginBottom: 4 },
  badge: { borderWidth: 1, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 9 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
