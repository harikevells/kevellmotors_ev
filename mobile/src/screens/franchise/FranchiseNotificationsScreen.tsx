import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Colors } from '../../utils/colors';
import { notificationsApi } from '../../api/franchiseApi';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, BellOff, Calendar, Tag, Bell, CreditCard, Info } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { FranchiseDrawerParamList } from '../../navigation/FranchiseDrawer';

type Props = DrawerScreenProps<FranchiseDrawerParamList, 'FranchiseNotifications'>;

const FranchiseNotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const getIconForType = (type: string, color: string) => {
    switch (type) {
      case 'booking': return <Calendar size={20} color={color} />;
      case 'offer': return <Tag size={20} color={color} />;
      case 'reminder': return <Bell size={20} color={color} />;
      case 'payment': return <CreditCard size={20} color={color} />;
      default: return <Info size={20} color={color} />;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.unreadCard]}
      onPress={() => {
        if (!item.read) handleMarkAsRead(item._id);
      }}
    >
      <View style={[styles.iconContainer, !item.read && { backgroundColor: 'rgba(0,229,255,0.1)' }]}>
        {getIconForType(item.type, !item.read ? Colors.cyan : Colors.textMuted)}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllAsRead}>
          <CheckCircle size={16} color={Colors.cyan} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.cyan} size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BellOff size={48} color={Colors.border} />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 10 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: Colors.border },
  markAllText: { color: Colors.cyan, fontSize: 13, fontWeight: '600' },
  listContainer: { padding: 20, paddingBottom: 40, gap: 12 },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: 'transparent', gap: 12, borderWidth: 1, borderColor: Colors.border },
  unreadCard: { borderLeftColor: Colors.cyan, backgroundColor: '#0f172a' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  unreadText: { color: Colors.textPrimary, fontWeight: '700' },
  message: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, lineHeight: 20 },
  date: { fontSize: 12, color: Colors.textMuted },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cyan, alignSelf: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { color: Colors.textMuted, fontSize: 16, fontWeight: '500' },
});

export default FranchiseNotificationsScreen;
