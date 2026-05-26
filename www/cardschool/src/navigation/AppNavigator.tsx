import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from '@/store/userStore';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from '@/types';

// Screens
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { SkillCheckScreen } from '@/screens/SkillCheckScreen';
import { LessonScreen } from '@/screens/LessonScreen';
import { QuizScreen } from '@/screens/QuizScreen';
import { SandboxSetupScreen } from '@/screens/SandboxSetupScreen';
import { SandboxScreen } from '@/screens/SandboxScreen';
import { ScenarioScreen } from '@/screens/ScenarioScreen';
import { BadgeUnlockScreen } from '@/screens/BadgeUnlockScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const user = useUserStore((s) => s.user);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#1A3C2E' },
        }}
      >
        {!user ? (
          // Auth flow
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          // Main app
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
              name="SkillCheck"
              component={SkillCheckScreen}
              options={{ animation: 'fade_from_bottom' }}
            />
            <Stack.Screen
              name="Lesson"
              component={LessonScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Quiz"
              component={QuizScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SandboxSetup"
              component={SandboxSetupScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Sandbox"
              component={SandboxScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="Scenario"
              component={ScenarioScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="BadgeUnlock"
              component={BadgeUnlockScreen}
              options={{ animation: 'fade', presentation: 'transparentModal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
