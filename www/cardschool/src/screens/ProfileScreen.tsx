import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useUserStore, selectUser, selectStreak, selectLevel, selectXP } from '@/store/userStore';
import { BADGES } from '@/data/scenarios';
import { HOLDEM_LESSONS } from '@/data/lessons';

const XP_PER_LEVEL = 200;

export function ProfileScreen() {
  const user = useUserStore(selectUser);
  const streak = useUserStore(selectStreak);
  const level = useUserStore(selectLevel);
  const xp = useUserStore(selectXP);
  const updateSettings = useUserStore((s) => s.updateSettings);
  const settings = useUserStore((s) => s.user?.settings);

  const xpPct = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  const completedCount = user?.completedLessons.length ?? 0;
  const totalLessons = HOLDEM_LESSONS.length;

  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.name}>{user?.displayName ?? 'Guest Player'}</Text>
          {user?.isGuest && <Text style={styles.guestTag}>Guest Mode</Text>}

          <View style={styles.statsRow}>
            {[
              { label: 'Level', value: String(level) },
              { label: 'Streak', value: `🔥 ${streak}` },
              { label: 'Lessons', value: `${completedCount}/${totalLessons}` },
              { label: 'Total XP', value: String(xp) },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>Level {level} → {level + 1}</Text>
              <Text style={styles.xpCount}>{xp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP</Text>
            </View>
            <View style={styles.xpBg}><View style={[styles.xpFill, { width: `${xpPct}%` }]} /></View>
          </View>

          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badges}>
            {BADGES.map((b) => {
              const earned = user?.earnedBadges.includes(b.id);
              return (
                <View key={b.id} style={[styles.badge, !earned && styles.badgeLocked]}>
                  <Text style={styles.badgeIcon}>{earned ? b.icon : '🔒'}</Text>
                  <Text style={styles.badgeTitle}>{b.title}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Settings</Text>
          {settings && [
            { key: 'soundEnabled', label: '🔊 Sound Effects', val: settings.soundEnabled },
            { key: 'hapticsEnabled', label: '📳 Haptic Feedback', val: settings.hapticsEnabled },
          ].map((s) => (
            <TouchableOpacity
              key={s.key}
              style={styles.settingRow}
              onPress={() => updateSettings({ [s.key]: !s.val } as any)}
            >
              <Text style={styles.settingLabel}>{s.label}</Text>
              <Text style={[styles.settingToggle, s.val && styles.settingOn]}>{s.val ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safe: { flex: 1 },
  body: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  name: { fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  guestTag: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.lg, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 70, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: Typography.size.xl, fontWeight: '700', color: Colors.gold },
  statLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  xpCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  xpLabel: { color: Colors.gold, fontWeight: '700', fontSize: Typography.size.sm },
  xpCount: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  xpBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  xpFill: { height: 6, backgroundColor: Colors.gold, borderRadius: 3 },
  sectionTitle: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  badge: { alignItems: 'center', width: 72, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  badgeLocked: { opacity: 0.4 },
  badgeIcon: { fontSize: 28, marginBottom: 4 },
  badgeTitle: { fontSize: Typography.size.xs, color: Colors.textSecondary, textAlign: 'center' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  settingLabel: { fontSize: Typography.size.md, color: Colors.textPrimary },
  settingToggle: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textSecondary },
  settingOn: { color: Colors.success },
});
