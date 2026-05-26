import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { Colors } from '@/theme';
import type { TabParamList } from '@/types';

// Tab screens
import { HomeScreen } from '@/screens/HomeScreen';
import { LessonListScreen } from '@/screens/LessonListScreen';
import { SandboxSetupScreen } from '@/screens/SandboxSetupScreen';
import { ScenarioScreen } from '@/screens/ScenarioScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { useUserStore, selectStreak } from '@/store/userStore';

const Tab = createBottomTabNavigator<TabParamList>();

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
  badge?: string;
}

function TabIcon({ emoji, label, focused, badge }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <View>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -6,
              backgroundColor: Colors.error,
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: 10,
          marginTop: 2,
          color: focused ? Colors.gold : Colors.textSecondary,
          fontWeight: focused ? '700' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function TabNavigator() {
  const streak = useUserStore(selectStreak);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgSurface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Learn"
        component={LessonListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" label="Learn" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Practice"
        component={SandboxSetupScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="♠️" label="Practice" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Challenges"
        component={ScenarioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              emoji="⚡"
              label="Daily"
              focused={focused}
              badge={streak > 0 ? String(streak) : undefined}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
