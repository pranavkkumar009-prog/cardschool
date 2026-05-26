import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, AIDifficulty } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SandboxSetup'>;

export function SandboxSetupScreen() {
  const navigation = useNavigation<Nav>();
  const [opponentCount, setOpponentCount] = useState(2);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('beginner');

  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title}>♠️ Practice Table</Text>
          <Text style={styles.subtitle}>Texas Hold'em vs AI opponents</Text>

          {/* Disclaimer — AC-03-1 */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              🎓 For entertainment and learning only — no real money
            </Text>
          </View>

          {/* Opponent count */}
          <Text style={styles.sectionLabel}>Number of Opponents</Text>
          <View style={styles.optionRow}>
            {[2, 3, 4].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.optionBtn, opponentCount === n && styles.optionBtnActive]}
                onPress={() => setOpponentCount(n)}
              >
                <Text style={[styles.optionBtnText, opponentCount === n && styles.optionBtnTextActive]}>
                  {n}
                </Text>
                <Text style={styles.optionBtnSub}>{n === 2 ? 'Heads Up' : n === 3 ? '4-Handed' : '5-Handed'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Difficulty */}
          <Text style={styles.sectionLabel}>AI Difficulty</Text>
          {(
            [
              { id: 'beginner', label: 'Beginner', desc: 'Folds frequently, never bluffs, basic bet sizing. Perfect while learning.' },
              { id: 'intermediate', label: 'Intermediate', desc: 'Varies bet sizes, occasionally bluffs on the river (≤20%). A real challenge.' },
            ] as { id: AIDifficulty; label: string; desc: string }[]
          ).map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.diffCard, difficulty === d.id && styles.diffCardActive]}
              onPress={() => setDifficulty(d.id)}
            >
              <View style={styles.diffRow}>
                <Text style={styles.diffLabel}>{d.label}</Text>
                {difficulty === d.id && <Text style={styles.diffCheck}>✓</Text>}
              </View>
              <Text style={styles.diffDesc}>{d.desc}</Text>
            </TouchableOpacity>
          ))}

          {/* Starting chips info */}
          <View style={styles.chipsInfo}>
            <Text style={styles.chipsInfoText}>🪙 You start with <Text style={styles.chipsValue}>1,000 chips</Text></Text>
          </View>

          {/* Start */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Sandbox', { difficulty, opponentCount })}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Deal Cards →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  body: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  title: { fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  subtitle: { fontSize: Typography.size.md, color: Colors.textSecondary, marginBottom: Spacing.lg },

  disclaimer: {
    backgroundColor: 'rgba(46,204,113,0.1)', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.success, marginBottom: Spacing.xl,
  },
  disclaimerText: { color: Colors.success, fontSize: Typography.size.sm, textAlign: 'center' },

  sectionLabel: {
    fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg,
  },

  optionRow: { flexDirection: 'row', gap: Spacing.sm },
  optionBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: Colors.border,
  },
  optionBtnActive: { borderColor: Colors.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  optionBtnText: { fontSize: Typography.size.xl, fontWeight: '700', color: Colors.textSecondary },
  optionBtnTextActive: { color: Colors.gold },
  optionBtnSub: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },

  diffCard: {
    padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: Colors.border,
  },
  diffCardActive: { borderColor: Colors.gold, backgroundColor: 'rgba(212,175,55,0.08)' },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  diffLabel: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.textPrimary },
  diffCheck: { fontSize: Typography.size.lg, color: Colors.gold },
  diffDesc: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 20 },

  chipsInfo: {
    backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', marginVertical: Spacing.lg,
  },
  chipsInfoText: { fontSize: Typography.size.md, color: Colors.textSecondary },
  chipsValue: { color: Colors.gold, fontWeight: '700' },

  btnPrimary: {
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryText: { color: '#0a0a0a', fontSize: Typography.size.lg, fontWeight: '700' },
});
