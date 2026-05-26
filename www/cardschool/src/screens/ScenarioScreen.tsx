import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { SCENARIOS } from '@/data/scenarios';
import { fromSolverNotation } from '@/game/deck';
import { useUserStore, selectSettings, selectStreak } from '@/store/userStore';

export function ScenarioScreen() {
  const settings = useUserStore(selectSettings);
  const streak = useUserStore(selectStreak);
  const addXP = useUserStore((s) => s.addXP);
  const updateStreak = useUserStore((s) => s.updateStreak);

  // Pick today's scenario based on date (deterministic daily rotation)
  const dayIndex = Math.floor(Date.now() / 86_400_000) % SCENARIOS.length;
  const scenario = SCENARIOS[dayIndex];

  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (optId: string) => {
    if (revealed) return;
    setSelected(optId);
  };

  const handleReveal = () => {
    if (!selected) return;
    setRevealed(true);
    const isCorrect = selected === scenario.correctOptionId;
    if (isCorrect) {
      addXP(scenario.xpReward);
      updateStreak();
      if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const holeCards = scenario.holeCards.map(fromSolverNotation);
  const boardCards = scenario.boardCards.map(fromSolverNotation);
  const isCorrect = revealed && selected === scenario.correctOptionId;

  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>⚡ Daily Challenge</Text>
            <Text style={styles.headerStreak}>🔥 {streak} day streak</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>+{scenario.xpReward} XP</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* Scenario card */}
          <View style={styles.scenarioCard}>
            <Text style={styles.scenarioTitle}>{scenario.title}</Text>
            <Text style={styles.scenarioDesc}>{scenario.description}</Text>
          </View>

          {/* Cards display */}
          <View style={styles.cardsSection}>
            <Text style={styles.cardsLabel}>Your Hand</Text>
            <View style={styles.cardRow}>
              {holeCards.map((c) => (
                <MiniCard key={c.id} rank={c.rank} suit={c.suit} />
              ))}
            </View>
            {boardCards.length > 0 && (
              <>
                <Text style={styles.cardsLabel}>Board</Text>
                <View style={styles.cardRow}>
                  {boardCards.map((c) => (
                    <MiniCard key={c.id} rank={c.rank} suit={c.suit} />
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Pot info */}
          <View style={styles.potRow}>
            <Text style={styles.potLabel}>Pot: <Text style={styles.potValue}>{scenario.potSize} chips</Text></Text>
            {scenario.opponentBet > 0 && (
              <Text style={styles.potLabel}>Opponent bet: <Text style={styles.potValue}>{scenario.opponentBet} chips</Text></Text>
            )}
          </View>

          {/* Options */}
          <View style={styles.options}>
            {scenario.options.map((opt) => {
              const isSelected = selected === opt.id;
              const isWinner = revealed && opt.id === scenario.correctOptionId;
              const isLoser = revealed && isSelected && !isWinner;

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.option,
                    isSelected && !revealed && styles.optionSelected,
                    isWinner && styles.optionCorrect,
                    isLoser && styles.optionWrong,
                  ]}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  {isWinner && <Text style={styles.optionBadge}>✓ Best Play</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation */}
          {revealed && (
            <View style={[styles.explanation, isCorrect ? styles.explanationCorrect : styles.explanationWrong]}>
              <Text style={styles.explanationIcon}>{isCorrect ? '🎯' : '📖'}</Text>
              <Text style={styles.explanationTitle}>{isCorrect ? 'Correct!' : 'Here\'s the best play:'}</Text>
              <Text style={styles.explanationText}>{scenario.explanation}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer action */}
        <View style={styles.footer}>
          {!revealed ? (
            <TouchableOpacity
              style={[styles.btnPrimary, !selected && styles.btnDisabled]}
              onPress={handleReveal}
              disabled={!selected}
            >
              <Text style={styles.btnPrimaryText}>Reveal Answer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.revealedFooter}>
              <Text style={styles.revealedFooterText}>
                {isCorrect ? `+${scenario.xpReward} XP earned! 🎉` : 'Better luck tomorrow!'}
              </Text>
              <Text style={styles.revealedSub}>Come back tomorrow for a new challenge</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Mini Card Component ──────────────────────────────────────────────────────

interface MiniCardProps { rank: string; suit: string; }

function MiniCard({ rank, suit }: MiniCardProps) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <View style={styles.miniCard}>
      <Text style={[styles.miniCardRank, isRed && styles.miniCardRed]}>{rank}</Text>
      <Text style={[styles.miniCardSuit, isRed && styles.miniCardRed]}>{suit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLabel: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.gold },
  headerStreak: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  xpBadge: {
    backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: Radius.full,
    paddingVertical: 4, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.gold,
  },
  xpBadgeText: { color: Colors.gold, fontWeight: '700', fontSize: Typography.size.sm },

  body: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  scenarioCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  scenarioTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.gold, marginBottom: Spacing.sm },
  scenarioDesc: { fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: 24 },

  cardsSection: { marginBottom: Spacing.md },
  cardsLabel: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },

  miniCard: {
    width: 52, height: 72, backgroundColor: '#F5F0E8', borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 1, height: 2 }, elevation: 4,
  },
  miniCardRank: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  miniCardSuit: { fontSize: 16, color: '#1A1A1A' },
  miniCardRed: { color: '#C0392B' },

  potRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.lg },
  potLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  potValue: { color: Colors.gold, fontWeight: '700' },

  options: { gap: Spacing.sm, marginBottom: Spacing.lg },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  optionCorrect: { borderColor: Colors.success, backgroundColor: 'rgba(46,204,113,0.12)' },
  optionWrong: { borderColor: Colors.error, backgroundColor: 'rgba(231,76,60,0.12)' },
  optionLabel: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.textPrimary },
  optionBadge: { fontSize: Typography.size.sm, color: Colors.success, fontWeight: '600' },

  explanation: {
    borderRadius: Radius.md, padding: Spacing.lg,
    borderWidth: 1, gap: Spacing.sm,
  },
  explanationCorrect: { backgroundColor: 'rgba(46,204,113,0.1)', borderColor: Colors.success },
  explanationWrong: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: Colors.border },
  explanationIcon: { fontSize: 28 },
  explanationTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.textPrimary },
  explanationText: { fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: 24 },

  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  btnPrimary: {
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: '#0a0a0a', fontSize: Typography.size.lg, fontWeight: '700' },
  revealedFooter: { alignItems: 'center', gap: Spacing.xs },
  revealedFooterText: { fontSize: Typography.size.lg, color: Colors.success, fontWeight: '700' },
  revealedSub: { fontSize: Typography.size.sm, color: Colors.textSecondary },
});
