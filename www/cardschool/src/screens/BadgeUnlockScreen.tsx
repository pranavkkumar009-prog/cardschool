import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { BADGES } from '@/data/scenarios';

type Props = NativeStackScreenProps<RootStackParamList, 'BadgeUnlock'>;

export function BadgeUnlockScreen({ route, navigation }: Props) {
  const badge = BADGES.find((b) => b.id === route.params.badgeId);
  useEffect(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, []);
  if (!badge) return null;
  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.label}>Badge Unlocked!</Text>
        <Text style={styles.icon}>{badge.icon}</Text>
        <Text style={styles.title}>{badge.title}</Text>
        <Text style={styles.desc}>{badge.description}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Awesome! →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center' },
  panel: { backgroundColor: '#0F2318', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md, borderWidth: 2, borderColor: Colors.gold, maxWidth: 320, width: '85%' },
  label: { fontSize: Typography.size.xs, fontWeight: '700', color: Colors.gold, letterSpacing: 2 },
  icon: { fontSize: 72 },
  title: { fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.textPrimary },
  desc: { fontSize: Typography.size.md, color: Colors.textSecondary, textAlign: 'center' },
  btn: { backgroundColor: Colors.gold, borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: Spacing.xl },
  btnText: { color: '#0a0a0a', fontWeight: '700', fontSize: Typography.size.md },
});
