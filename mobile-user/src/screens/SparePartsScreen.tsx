import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, Modal, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Package, Search, X as CloseIcon, Settings, Info } from 'lucide-react-native';
import { partsAPI, subscriptionAPI } from '../api';
import { Colors } from '../utils/colors';
import Card from '../components/Card';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import type { SparePart, PartOrder, Subscription } from '../types';

const CATEGORIES = ['All', 'battery', 'motor', 'charger', 'tyre', 'brake', 'suspension', 'body', 'accessory', 'other'];

const SparePartsScreen: React.FC = () => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [orders, setOrders] = useState<PartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tab, setTab] = useState<'parts' | 'orders'>('parts');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [orderModal, setOrderModal] = useState<SparePart | null>(null);
  const [qty, setQty] = useState('1');
  const [address, setAddress] = useState('');
  const [ordering, setOrdering] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, oRes, subRes] = await Promise.all([partsAPI.list(), partsAPI.myOrders(), subscriptionAPI.list()]);
      setParts(pRes.data.parts || []);
      setOrders(oRes.data.orders || []);
      setSubscriptions(subRes.data.subscriptions?.filter((s: Subscription) => s.status === 'active') || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOrder = async () => {
    if (!address.trim()) { Alert.alert('Required', 'Please enter a delivery address.'); return; }
    const quantity = parseInt(qty, 10);
    if (!quantity || quantity < 1) { Alert.alert('Invalid', 'Enter a valid quantity.'); return; }
    setOrdering(true);
    try {
      await partsAPI.placeOrder({ part: orderModal!._id, quantity, deliveryAddress: address.trim() });
      setOrderModal(null); setQty('1'); setAddress('');
      setTab('orders'); load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    } finally { setOrdering(false); }
  };

  const filteredParts = parts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  if (loading) return <Spinner fullScreen text="Loading parts…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Spare Parts" subtitle="EV parts & accessories" />
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'parts' && styles.tabActive]}
          onPress={() => setTab('parts')}
        >
          <ShoppingCart
            size={18}
            color={tab === 'parts' ? Colors.primaryLight : Colors.textMuted}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.tabText, tab === 'parts' && styles.tabTextActive]}>Parts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'orders' && styles.tabActive]}
          onPress={() => setTab('orders')}
        >
          <Package
            size={18}
            color={tab === 'orders' ? Colors.primaryLight : Colors.textMuted}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {tab === 'parts' ? (
        <>
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.search}
                value={search}
                onChangeText={setSearch}
                placeholder="Search parts, brands…"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.catContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
            >
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>
            {filteredParts.length === 0 ? (
              <Card><Text style={styles.empty}>No parts found</Text></Card>
            ) : (
              filteredParts.map((p) => (
                <Card key={p._id} style={styles.partCard}>
                  <View style={styles.partRow}>
                    <View style={styles.partIcon}>
                      {p.image ? (
                        <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                      ) : (
                        <Settings size={22} color={Colors.primaryLight} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partName}>{p.name}</Text>
                      {p.brand && <Text style={styles.partMeta}>{p.brand}</Text>}
                      <Text style={styles.partCategory}>{p.category}</Text>
                      <Text style={styles.partPrice}>₹{p.price.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.partRight}>
                      <Text style={[styles.stock, { color: p.stock > 0 ? Colors.success : Colors.error }]}>
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.orderBtn, p.stock === 0 && styles.orderBtnDisabled]}
                        onPress={() => { setOrderModal(p); setQty('1'); setAddress(''); }}
                        disabled={p.stock === 0}
                      >
                        <Text style={styles.orderBtnText}>Order</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {p.description && <Text style={styles.partDesc} numberOfLines={2}>{p.description}</Text>}
                </Card>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>
          {orders.length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Package size={24} color={Colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.empty, { padding: 0 }]}>No orders placed yet. Browse parts to order.</Text>
              </View>
            </Card>
          ) : (
            orders.map((o) => (
              <Card key={o._id}>
                <View style={styles.orderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partName}>{o.part?.name}</Text>
                    <Text style={styles.partMeta}>Qty: {o.quantity} × ₹{o.part?.price?.toLocaleString('en-IN')}</Text>
                    <Text style={styles.orderTotal}>Total: ₹{o.totalPrice?.toLocaleString('en-IN')}</Text>
                    <Text style={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <StatusBadge status={o.status} size="md" />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={!!orderModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setOrderModal(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Place Order</Text>
            <TouchableOpacity onPress={() => setOrderModal(null)}>
              <CloseIcon size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {orderModal && (
              <>
                {subscriptions.length > 0 && (
                  <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginRight: 10 }}>💎</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.success, fontWeight: '700', fontSize: 13 }}>Subscriber Benefits Enabled</Text>
                      <Text style={{ color: Colors.success, fontSize: 11, marginTop: 2, opacity: 0.9 }}>You will receive special subscriber discounts on this order!</Text>
                    </View>
                  </View>
                )}
                <Text style={styles.orderPartName}>{orderModal.name}</Text>
                <Text style={styles.orderPartPrice}>₹{orderModal.price.toLocaleString('en-IN')} per unit</Text>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Quantity</Text>
                  <TextInput style={styles.input} value={qty} onChangeText={setQty} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Delivery Address *</Text>
                  <TextInput style={[styles.input, { height: 80 }]} multiline value={address} onChangeText={setAddress} placeholder="Full delivery address…" placeholderTextColor={Colors.textMuted} textAlignVertical="top" />
                </View>
                {qty && parseInt(qty) > 0 && (() => {
                  const q = parseInt(qty);
                  const total = orderModal.price * q;
                  const hasSub = subscriptions.length > 0;
                  const discount = hasSub ? total * 0.10 : 0;
                  const finalTotal = total - discount;
                  
                  return (
                    <View style={{ marginBottom: 12 }}>
                      {hasSub && (
                        <Text style={{ fontSize: 13, color: Colors.success, marginBottom: 4, fontWeight: '700' }}>
                          10% Subscriber Discount: -₹{discount.toLocaleString('en-IN')}
                        </Text>
                      )}
                      <Text style={styles.totalPreview}>
                        Total: ₹{finalTotal.toLocaleString('en-IN')} {hasSub && <Text style={{ textDecorationLine: 'line-through', fontSize: 13, color: Colors.textMuted, fontWeight: 'normal' }}>₹{total.toLocaleString('en-IN')}</Text>}
                      </Text>
                    </View>
                  );
                })()}
                <TouchableOpacity style={[styles.saveBtn, ordering && styles.saveBtnDisabled]} onPress={handleOrder} disabled={ordering}>
                  <Text style={styles.saveBtnText}>{ordering ? 'Placing Order…' : 'Confirm Order'}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  tabs: { flexDirection: 'row', backgroundColor: Colors.bgDark, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryLight, fontWeight: '700' },
  searchWrapper: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 12, color: Colors.textPrimary, fontSize: 14 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 16 },
  catContainer: { marginBottom: 16 },
  catRow: { paddingHorizontal: 16, paddingVertical: 4, gap: 10 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#162031',
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  catChipTextActive: { color: '#fff' },
  partCard: { padding: 16, marginBottom: 12, borderRadius: 16 },
  partRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  partIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#162031', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  partName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  partMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  partCategory: { fontSize: 11, color: Colors.primaryLight, textTransform: 'capitalize', fontWeight: '700', marginTop: 4 },
  partPrice: { fontSize: 18, fontWeight: '800', color: Colors.success, marginTop: 8 },
  partRight: { alignItems: 'flex-end', gap: 10 },
  stock: { fontSize: 12, fontWeight: '700' },
  orderBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  orderBtnDisabled: { backgroundColor: Colors.border },
  orderBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  partDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 12, lineHeight: 20 },
  orderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderTotal: { fontSize: 14, fontWeight: '700', color: Colors.success, marginTop: 4 },
  orderDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  modal: { flex: 1, backgroundColor: Colors.bgDark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textMuted },
  modalBody: { padding: 16, paddingBottom: 40 },
  orderPartName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  orderPartPrice: { fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: 15 },
  totalPreview: { fontSize: 16, fontWeight: '700', color: Colors.success, marginBottom: 8 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default SparePartsScreen;
