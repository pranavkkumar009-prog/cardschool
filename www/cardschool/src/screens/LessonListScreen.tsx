import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { HOLDEM_LESSONS } from '@/data/lessons';
import { useUserStore } from '@/store/userStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LessonListScreen() {
  const navigation = useNavigation<Nav>();
  const completedLessons = useUserStore((s) => s.user?.completedLessons ?? []);

  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>📚 Learn</Text>
        <Text style={styles.subtitle}>Texas Hold'em Curriculum</Text>
        <FlatList
          data={HOLDEM_LESSONS}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const done = completedLessons.includes(item.id);
            const locked = item.prerequisiteIds.some((id) => !completedLessons.includes(id));
            return (
              <TouchableOpacity
                style={[styles.card, done && styles.cardDone, locked && styles.cardLocked]}
                onPress={() => !locked && navigation.navigate('Lesson', { lessonId: item.id })}
                activeOpacity={locked ? 1 : 0.8}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardNum}>{index + 1}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                  <View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSub}>{item.subtitle} · {item.xpReward} XP</Text>
                  </View>
                </View>
                <Text style={styles.cardStatus}>{locked ? '🔒' : done ? '✅' : '›'}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safe: { flex: 1 },
  title: { fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.gold, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  subtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardDone: { borderColor: Colors.success, backgroundColor: 'rgba(46,204,113,0.08)' },
  cardLocked: { opacity: 0.45 },
  cardLeft: { width: 28, alignItems: 'center' },
  cardNum: { color: Colors.textSecondary, fontWeight: '700', fontSize: Typography.size.sm },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardIcon: { fontSize: 24 },
  cardTitle: { fontSize: Typography.size.md, fontWeight: '600', color: Colors.textPrimary },
  cardSub: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  cardStatus: { fontSize: 18, color: Colors.textSecondary },
});
