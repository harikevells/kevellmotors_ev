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
  const [imageModal, setImageModal] = useState<SparePart | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [qty, setQty] = useState('1');
  const [address, setAddress] = useState('');
  const [appliedSubscription, setAppliedSubscription] = useState('');
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

  const getFirstImage = (p: SparePart) => {
    let url = null;
    if (p.images && p.images.length > 0) url = p.images[0];
    else if (p.image) url = p.image;
    return getFullImageUrl(url);
  };

  const getFullImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = apiClient.defaults.baseURL?.replace('/api', '') || 'http://192.168.0.116:5001';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${path}`;
  };

  const getAllImages = (p: SparePart) => {
    let urls: string[] = [];
    if (p.images && p.images.length > 0) urls = p.images;
    else if (p.image) urls = [p.image];
    return urls.map(url => getFullImageUrl(url)).filter(Boolean) as string[];
  };

  useEffect(() => { load(); }, [load]);

  const handleOrder = async () => {
    if (!address.trim()) { Alert.alert('Required', 'Please enter a delivery address.'); return; }
    const quantity = parseInt(qty, 10);
    if (!quantity || quantity < 1) { Alert.alert('Invalid', 'Enter a valid quantity.'); return; }
    setOrdering(true);
    try {
      await partsAPI.placeOrder({ part: orderModal!._id, quantity, deliveryAddress: address.trim(), appliedSubscription });
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
                    <TouchableOpacity style={styles.partIcon} onPress={() => {
                      const imgs = getAllImages(p);
                      if (imgs.length > 0) {
                        setImageModal(p);
                        setCurrentImageIndex(0);
                      }
                    }} activeOpacity={0.8}>
                      {getFirstImage(p) ? (
                        <Image source={{ uri: getFirstImage(p)! }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                      ) : (
                        <Settings size={22} color={Colors.primaryLight} />
                      )}
                    </TouchableOpacity>
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
                        onPress={() => { setOrderModal(p); setQty('1'); setAddress(''); setAppliedSubscription(subscriptions.length > 0 ? subscriptions[0]._id : ''); }}
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
            orders.map((o) => {
              const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
              const extraCount = o.items ? o.items.length - 1 : 0;
              const originalTotal = o.items ? o.items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0) : o.totalAmount;
              const hasDiscount = originalTotal > o.totalAmount;
              const subPlan = o.appliedSubscription?.plan as any;
              const subName = subPlan?.name || 'Subscription';
              let pDiscount = subPlan?.sparePartsDiscount || 0;
              
              if (hasDiscount && pDiscount === 0 && originalTotal > 0) {
                pDiscount = Math.round(((originalTotal - o.totalAmount) / originalTotal) * 100);
              }
              
              return (
                <Card key={o._id}>
                  <View style={styles.orderRow}>
                    <View style={{ flex: 1 }}>
                      {firstItem && (
                        <>
                          <Text style={styles.partName}>{firstItem.part?.name} {extraCount > 0 ? `+ ${extraCount} more` : ''}</Text>
                          <Text style={styles.partMeta}>Qty: {firstItem.quantity} × ₹{firstItem.price?.toLocaleString('en-IN')}</Text>
                        </>
                      )}
                      
                      {hasDiscount && (
                        <View style={{ marginTop: 6, backgroundColor: 'rgba(34,197,94,0.1)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: Colors.success, fontSize: 10, fontWeight: '700' }}>{subName} ({pDiscount}% Off)</Text>
                        </View>
                      )}
                      
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
                        <Text style={styles.orderTotal}>Total: ₹{o.totalAmount?.toLocaleString('en-IN')}</Text>
                        {hasDiscount && (
                          <Text style={{ textDecorationLine: 'line-through', fontSize: 11, color: Colors.textMuted, marginBottom: 1 }}>₹{originalTotal.toLocaleString('en-IN')}</Text>
                        )}
                      </View>
                      <Text style={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <StatusBadge status={o.status} size="md" />
                  </View>
                </Card>
              );
            })
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
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.fieldLabel}>Select Subscription for Discount</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                      {subscriptions.map(sub => {
                        const planObj = typeof sub.plan === 'object' && sub.plan ? sub.plan : null;
                        const planName = planObj ? planObj.name : (sub.plan || 'Plan');
                        const pDiscount = (planObj as any)?.sparePartsDiscount || 0;
                        const isSelected = appliedSubscription === sub._id;
                        
                        return (
                          <TouchableOpacity
                            key={sub._id}
                            style={[styles.planCardSmall, isSelected && { borderColor: Colors.success, backgroundColor: 'rgba(34,197,94,0.15)' }]}
                            onPress={() => setAppliedSubscription(sub._id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.planTitleSmall} numberOfLines={1}>{planName}</Text>
                            {sub.vehicle ? <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{sub.vehicle.make} {sub.vehicle.model}</Text> : null}
                            {pDiscount > 0 ? (
                              <Text style={{ color: Colors.success, fontSize: 10, fontWeight: '700', marginTop: 4 }}>{pDiscount}% Parts Off</Text>
                            ) : null}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: isSelected ? Colors.success : Colors.textMuted, backgroundColor: isSelected ? Colors.success : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                                {isSelected && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />}
                              </View>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? Colors.success : Colors.textMuted }}>{isSelected ? 'Applied' : 'Select'}</Text>
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
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
                {qty && parseInt(qty, 10) > 0 && (() => {
                  const q = parseInt(qty, 10);
                  const total = orderModal.price * q;
                  const activeSub = subscriptions.find(s => s._id === appliedSubscription);
                  const planDiscount = (activeSub?.plan as any)?.sparePartsDiscount || 0;
                  const discount = (total * planDiscount) / 100;
                  const finalTotal = total - discount;
                  
                  return (
                    <View style={{ marginBottom: 12 }}>
                      {planDiscount > 0 && (
                        <Text style={{ fontSize: 13, color: Colors.success, marginBottom: 4, fontWeight: '700' }}>
                          {planDiscount}% Subscriber Discount: -₹{discount.toLocaleString('en-IN')}
                        </Text>
                      )}
                      <Text style={styles.totalPreview}>
                        Total: ₹{finalTotal.toLocaleString('en-IN')} {planDiscount > 0 && <Text style={{ textDecorationLine: 'line-through', fontSize: 13, color: Colors.textMuted, fontWeight: 'normal' }}>₹{total.toLocaleString('en-IN')}</Text>}
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

      <Modal visible={!!imageModal} animationType="fade" transparent={true} onRequestClose={() => setImageModal(null)}>
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContent}>
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setImageModal(null)}>
              <CloseIcon size={24} color="#fff" />
            </TouchableOpacity>

            {imageModal && (() => {
              const imgs = getAllImages(imageModal);
              return (
                <View style={styles.sliderContainer}>
                  {imgs.length > 1 && (
                    <TouchableOpacity
                      style={styles.sliderArrowLeft}
                      onPress={() => setCurrentImageIndex(prev => prev === 0 ? imgs.length - 1 : prev - 1)}
                    >
                      <ChevronLeft size={30} color="#fff" />
                    </TouchableOpacity>
                  )}

                  <Image source={{ uri: imgs[currentImageIndex] }} style={styles.sliderImage} resizeMode="contain" />

                  {imgs.length > 1 && (
                    <TouchableOpacity
                      style={styles.sliderArrowRight}
                      onPress={() => setCurrentImageIndex(prev => prev === imgs.length - 1 ? 0 : prev + 1)}
                    >
                      <ChevronRight size={30} color="#fff" />
                    </TouchableOpacity>
                  )}

                  {imgs.length > 1 && (
                    <View style={styles.sliderDots}>
                      {imgs.map((_, idx) => (
                        <View key={idx} style={[styles.sliderDot, currentImageIndex === idx && styles.sliderDotActive]} />
                      ))}
                    </View>
                  )}
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
  planCardSmall: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', borderRadius: 12, padding: 12, marginRight: 12, width: 140 },
  planTitleSmall: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
});

export default SparePartsScreen;
