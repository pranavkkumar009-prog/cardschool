import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useUserStore, selectUser, selectStreak, selectLevel, selectXP } from '@/store/userStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { HOLDEM_LESSONS } from '@/data/lessons';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

const XP_PER_LEVEL = 200;

export function HomeScreen({ navigation }: Props) {
  const user = useUserStore(selectUser);
  const streak = useUserStore(selectStreak);
  const level = useUserStore(selectLevel);
  const xp = useUserStore(selectXP);
  const updateStreak = useUserStore((s) => s.updateStreak);

  useEffect(() => {
    updateStreak();
  }, []);

  const xpProgress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
  const nextLesson = HOLDEM_LESSONS.find(
    (l) => !user?.completedLessons.includes(l.id)
  );

  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back{user?.isGuest ? '' : `, ${user?.displayName}`} 👋</Text>
              <Text style={styles.subtitle}>Ready to level up your game?</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{streak}</Text>
            </View>
          </View>

          {/* XP Bar */}
          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>Level {level}</Text>
              <Text style={styles.xpCount}>{xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</Text>
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
            </View>
          </View>

          {/* Continue Learning CTA */}
          {nextLesson && (
            <TouchableOpacity
              style={styles.ctaCard}
              onPress={() => navigation.navigate('Lesson', { lessonId: nextLesson.id })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.goldDark, Colors.gold]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <View>
                  <Text style={styles.ctaSmall}>CONTINUE LEARNING</Text>
                  <Text style={styles.ctaTitle}>{nextLesson.icon} {nextLesson.title}</Text>
                  <Text style={styles.ctaSub}>{nextLesson.subtitle} • {nextLesson.xpReward} XP</Text>
                </View>
                <Text style={styles.ctaArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Play</Text>
          <View style={styles.quickGrid}>
            {[
              { emoji: '⚡', label: 'Daily Challenge', sub: 'Earn streak bonus', onPress: () => navigation.navigate('Scenario') },
              { emoji: '♠️', label: 'Practice Hand', sub: 'vs AI opponents', onPress: () => navigation.navigate('SandboxSetup') },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.quickEmoji}>{item.emoji}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
                <Text style={styles.quickSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lesson progress overview */}
          <Text style={styles.sectionTitle}>Texas Hold'em Course</Text>
          {HOLDEM_LESSONS.map((lesson) => {
            const done = user?.completedLessons.includes(lesson.id);
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonRow, done && styles.lessonRowDone]}
                onPress={() => navigation.navigate('Lesson', { lessonId: lesson.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.lessonEmoji}>{lesson.icon}</Text>
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonSub}>{lesson.subtitle} • {lesson.xpReward} XP</Text>
                </View>
                <Text style={styles.lessonStatus}>{done ? '✅' : '›'}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, marginBottom: Spacing.md,
  },
  greeting: { fontSize: Typography.size.xl, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },

  streakBadge: {
    backgroundColor: 'rgba(231,76,60,0.15)', borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: '#e74c3c',
  },
  streakFire: { fontSize: 20 },
  streakCount: { fontSize: Typography.size.lg, fontWeight: '700', color: '#e74c3c' },

  xpCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  xpLabel: { color: Colors.gold, fontWeight: '700', fontSize: Typography.size.sm },
  xpCount: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  xpBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  xpBarFill: { height: 6, backgroundColor: Colors.gold, borderRadius: 3 },

  ctaCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: Radius.lg, ...Shadow.card },
  ctaGradient: {
    borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ctaSmall: { fontSize: Typography.size.xs, fontWeight: '700', color: '#0a0a0a', letterSpacing: 1.5, marginBottom: 4 },
  ctaTitle: { fontSize: Typography.size.xl, fontWeight: '700', color: '#0a0a0a' },
  ctaSub: { fontSize: Typography.size.sm, color: 'rgba(0,0,0,0.6)', marginTop: 2 },
  ctaArrow: { fontSize: 28, color: '#0a0a0a', fontWeight: '300' },

  sectionTitle: {
    fontSize: Typography.size.md, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 0.8, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, marginTop: Spacing.md,
  },

  quickGrid: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  quickCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  quickEmoji: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  quickSub: { fontSize: Typography.size.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  lessonRowDone: { borderColor: Colors.success, backgroundColor: 'rgba(46,204,113,0.08)' },
  lessonEmoji: { fontSize: 24 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: Typography.size.md, fontWeight: '600', color: Colors.textPrimary },
  lessonSub: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  lessonStatus: { fontSize: 18, color: Colors.textSecondary },
});
