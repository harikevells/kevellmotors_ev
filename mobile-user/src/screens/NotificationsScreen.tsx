import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Colors } from '../utils/colors';
import { notificationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/DrawerNavigator';

type Props = DrawerScreenProps<DrawerParamList, 'Notifications'>;

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list();
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
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'booking': return 'calendar';
      case 'offer': return 'tag';
      case 'reminder': return 'bell';
      case 'payment': return 'credit-card';
      default: return 'info';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => {
        if (!item.isRead) handleMarkAsRead(item._id);
        
        if (item.link) {
          if (item.link.includes('bookings') || item.link.includes('services')) navigation.navigate('Services' as any);
          else if (item.link.includes('orders') || item.link.includes('parts')) navigation.navigate('SpareParts' as any);
          else if (item.link.includes('subscriptions')) navigation.navigate('Subscriptions' as any);
          else if (item.link.includes('reminders')) navigation.navigate('Reminders' as any);
        } else {
          switch (item.type) {
            case 'booking': navigation.navigate('Services' as any); break;
            case 'order': navigation.navigate('SpareParts' as any); break;
            case 'reminder': navigation.navigate('Reminders' as any); break;
            case 'subscription': navigation.navigate('Subscriptions' as any); break;
          }
        }
      }}
    >
      <View style={[styles.iconContainer, !item.isRead && { backgroundColor: Colors.primary + '20' }]}>
        <Icon name={getIconForType(item.type)} size={20} color={!item.isRead ? Colors.primary : Colors.textMuted} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Notifications" onMenuPress={() => navigation.openDrawer()} />
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllAsRead}>
          <Icon name="check-circle" size={16} color={Colors.primary} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Spinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="bell-off" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 10 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  markAllText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  listContainer: { padding: 20, paddingBottom: 40, gap: 12 },
  card: { flexDirection: 'row', backgroundColor: Colors.bgLight, borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: 'transparent', gap: 12 },
  unreadCard: { borderLeftColor: Colors.primary, backgroundColor: Colors.cardBg },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgDark, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginBottom: 4 },
  unreadText: { color: Colors.text, fontWeight: '700' },
  message: { fontSize: 14, color: Colors.text, marginBottom: 8, lineHeight: 20 },
  date: { fontSize: 12, color: Colors.textMuted },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, alignSelf: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { color: Colors.textMuted, fontSize: 16, fontWeight: '500' },
});

export default NotificationsScreen;
