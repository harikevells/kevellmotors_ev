import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import FranchiseNavigator from './src/navigation/FranchiseNavigator';
import { Colors } from './src/utils/colors';

// ── Login screen placeholder ──────────────────────────────────────────────────
// Replace this with your real LoginScreen once built
import LoginScreen from './src/screens/LoginScreen';

// ── Root stack param list ─────────────────────────────────────────────────────
type RootStackParamList = {
  Login: undefined;
  FranchiseApp: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

// ── Inner app – decides Login vs Franchise tabs ───────────────────────────────
function AppInner() {
  const { user, loading } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinSplashDone(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading || !minSplashDone) {
    return (
      <View style={styles.splash}>
        <Image
          source={require('./src/assets/logo.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="FranchiseApp" component={FranchiseNavigator} />
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
});
