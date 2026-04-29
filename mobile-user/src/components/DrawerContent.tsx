import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Bot,
  Car,
  Wrench,
  ClipboardList,
  Cog,
  CreditCard,
  MessageSquare,
  Bell,
  Gift,
  FileText,
  User,
  Zap,
  LogOut
} from 'lucide-react-native';

interface MenuItem {
  name: string;
  label: string;
  icon: React.ElementType;
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard',     label: 'Dashboard',       icon: Home },
  { name: 'AIAgent',       label: 'AI Booking Agent', icon: Bot },
  { name: 'Vehicles',      label: 'My Vehicles',      icon: Car },
  { name: 'Services',      label: 'Services',         icon: Wrench },
  { name: 'Subscriptions', label: 'Subscriptions',    icon: ClipboardList },
  { name: 'SpareParts',    label: 'Spare Parts',      icon: Cog },
  { name: 'Payments',      label: 'Payments',         icon: CreditCard },
  { name: 'Feedback',      label: 'Feedback',         icon: MessageSquare },
  { name: 'Reminders',     label: 'Reminders',        icon: Bell },
  { name: 'Referrals',     label: 'Referrals',        icon: Gift },
  { name: 'Documents',     label: 'Documents',        icon: FileText },
  { name: 'Profile',       label: 'Profile',          icon: User },
];

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuth();
  const { navigation, state } = props;
  const activeRouteName = state.routeNames[state.index];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Brand header */}
      <View style={styles.brand}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={styles.brandName}>KEVELL MOTORS</Text>
          <Text style={styles.brandSub}>EV Service Platform</Text>
        </View>
      </View>

      {/* User info */}
      {user && (
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
          </View>
        </View>
      )}

      {/* Menu */}
      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const isActive = activeRouteName === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <item.icon
                  size={20}
                  color={isActive ? Colors.primaryLight : Colors.textSecondary}
                />
              </View>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut color={Colors.error} size={20} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandName: { fontSize: 18, fontWeight: '800', color: Colors.accentLight },
  brandSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    padding: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13 },
  userEmail: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  menu: { flex: 1, paddingTop: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
    position: 'relative',
  },
  menuItemActive: { backgroundColor: 'rgba(99,102,241,0.15)' },
  menuIconContainer: { width: 32, alignItems: 'center', paddingRight: 8 },
  menuLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  menuLabelActive: { color: Colors.primaryLight, fontWeight: '700' },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    padding: 13,
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    marginBottom: 24,
  },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
});

export default DrawerContent;
