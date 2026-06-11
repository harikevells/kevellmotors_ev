import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Wallet as WalletIcon,
  ListOrdered, 
  Menu 
} from 'lucide-react-native';
import { Colors } from '../utils/colors';

// ── Screens ───────────────────────────────────────────────────────────────────
import FranchiseDashboardScreen from '../screens/franchise/FranchiseDashboardScreen';
import FranchiseBookingsScreen from '../screens/franchise/FranchiseBookingsScreen';
import FranchiseWalletScreen from '../screens/franchise/FranchiseWalletScreen';
import FranchiseCustomersScreen from '../screens/franchise/FranchiseCustomersScreen';
import FranchiseQueueScreen from '../screens/franchise/FranchiseQueueScreen';
import FranchiseHistoryScreen from '../screens/franchise/FranchiseHistoryScreen';
import FranchisePaymentsScreen from '../screens/franchise/FranchisePaymentsScreen';
import FranchiseFeedbackScreen from '../screens/franchise/FranchiseFeedbackScreen';
import FranchiseProfileScreen from '../screens/franchise/FranchiseProfileScreen';
import FranchiseBookingDetailsScreen from '../screens/franchise/FranchiseBookingDetailsScreen';
import FranchiseSubscriptionsScreen from '../screens/franchise/FranchiseSubscriptionsScreen';
import FranchiseNotificationsScreen from '../screens/franchise/FranchiseNotificationsScreen';

// ── Param lists ───────────────────────────────────────────────────────────────
export type FranchiseTabParamList = {
  Dashboard: undefined;
  BookingsTab: undefined; // renamed from 'Bookings' to avoid confusion with stack
  Wallet: undefined;
  Queue: undefined;
  More: undefined;
};

export type BookingsStackParamList = {
  BookingsList: undefined;
  BookingDetails: { bookingId: string };
};

export type FranchiseMoreStackParamList = {
  MoreRoot: undefined;     // placeholder — not used directly
  Customers: undefined;
  History: undefined;
  Payments: undefined;
  Feedback: undefined;
  Profile: undefined;
  Subscriptions: undefined;
  Notifications: undefined;
};

// ── Tab icon component ────────────────────────────────────────────────────────
const TabIcon = ({
  Icon,
  focused,
}: {
  Icon: React.ElementType;
  focused: boolean;
}) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Icon 
      size={20} 
      color={focused ? Colors.cyan : Colors.textMuted} 
      strokeWidth={focused ? 2.5 : 2} 
    />
  </View>
);

// ── Bookings stack (List -> Details) ──────────────────────────────────────────
const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();

function BookingsNavigator() {
  return (
    <BookingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgCard },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <BookingsStack.Screen
        name="BookingsList"
        component={FranchiseBookingsScreen}
        options={{ title: 'Bookings' }}
      />
      <BookingsStack.Screen
        name="BookingDetails"
        component={FranchiseBookingDetailsScreen}
        options={{ title: 'Booking Details' }}
      />
    </BookingsStack.Navigator>
  );
}

// ── "More" stack  (Customers / History / Payments / Feedback / Profile) ───────
const MoreStack = createNativeStackNavigator<FranchiseMoreStackParamList>();

function MoreNavigator() {
  return (
    <MoreStack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgCard },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <MoreStack.Screen
        name="Profile"
        component={FranchiseProfileScreen}
        options={({ navigation }) => ({
          title: 'My Profile',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Dashboard')}
              style={styles.backIconButton}
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <MoreStack.Screen
        name="Customers"
        component={FranchiseCustomersScreen}
        options={{ title: 'Customers' }}
      />
      <MoreStack.Screen
        name="History"
        component={FranchiseHistoryScreen}
        options={{ title: 'Service History' }}
      />
      <MoreStack.Screen
        name="Payments"
        component={FranchisePaymentsScreen}
        options={{ title: 'Revenue & Payments' }}
      />
      <MoreStack.Screen
        name="Feedback"
        component={FranchiseFeedbackScreen}
        options={{ title: 'Feedback & Ratings' }}
      />
      <MoreStack.Screen
        name="Subscriptions"
        component={FranchiseSubscriptionsScreen}
        options={{ title: 'Subscriptions' }}
      />
      <MoreStack.Screen
        name="Notifications"
        component={FranchiseNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </MoreStack.Navigator>
  );
}

// ── Bottom Tab navigator ──────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<FranchiseTabParamList>();

export default function FranchiseNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgCard },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.cyan,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={FranchiseDashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={LayoutDashboard} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={CalendarCheck} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={FranchiseWalletScreen}
        options={({ navigation }) => ({
          title: 'Franchise Wallet',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Dashboard')}
              style={styles.backIconButton}
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
          ),
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={WalletIcon} focused={focused} />
          ),
        })}
      />
      <Tab.Screen
        name="Queue"
        component={FranchiseQueueScreen}
        options={({ navigation }) => ({
          title: 'Queue',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Dashboard')}
              style={styles.backIconButton}
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
          ),
          tabBarLabel: 'Queue',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ListOrdered} focused={focused} />
          ),
        })}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'More',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Menu} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 64, // Increased slightly for Lucide icons
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(0,229,255,0.1)',
  },
  backIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 4,
  },
  backIcon: {
    color: Colors.textPrimary,
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '700',
  },
});
