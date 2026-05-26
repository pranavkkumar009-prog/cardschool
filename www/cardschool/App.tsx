import 'react-native-gesture-handler'; // Must be first import
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import Animated from 'react-native-reanimated';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useUserStore } from '@/store/userStore';

// Keep splash screen visible until fonts + state are ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const hydrated = useUserStore((s) => s._hydrated);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
