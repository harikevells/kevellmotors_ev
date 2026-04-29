import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerContent from '../components/DrawerContent';
import { Colors } from '../utils/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import AIAgentScreen from '../screens/AIAgentScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import ServicesScreen from '../screens/ServicesScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import SparePartsScreen from '../screens/SparePartsScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import RemindersScreen from '../screens/RemindersScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type DrawerParamList = {
  Dashboard:     undefined;
  AIAgent:       undefined;
  Vehicles:      undefined;
  Services:      undefined;
  Subscriptions: undefined;
  SpareParts:    undefined;
  Payments:      undefined;
  Feedback:      undefined;
  Reminders:     undefined;
  Referrals:     undefined;
  Documents:     undefined;
  Profile:       undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => (
  <Drawer.Navigator
    drawerContent={(props) => <DrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerStyle: {
        backgroundColor: Colors.bgDark,
        width: 280,
        borderRightWidth: 0,
      },
      overlayColor: 'rgba(0,0,0,0.6)',
      swipeEdgeWidth: 60,
    }}
  >
    <Drawer.Screen name="Dashboard"     component={DashboardScreen} />
    <Drawer.Screen name="AIAgent"       component={AIAgentScreen} />
    <Drawer.Screen name="Vehicles"      component={VehiclesScreen} />
    <Drawer.Screen name="Services"      component={ServicesScreen} />
    <Drawer.Screen name="Subscriptions" component={SubscriptionsScreen} />
    <Drawer.Screen name="SpareParts"    component={SparePartsScreen} />
    <Drawer.Screen name="Payments"      component={PaymentsScreen} />
    <Drawer.Screen name="Feedback"      component={FeedbackScreen} />
    <Drawer.Screen name="Reminders"     component={RemindersScreen} />
    <Drawer.Screen name="Referrals"     component={ReferralsScreen} />
    <Drawer.Screen name="Documents"     component={DocumentsScreen} />
    <Drawer.Screen name="Profile"       component={ProfileScreen} />
  </Drawer.Navigator>
);

export default DrawerNavigator;
