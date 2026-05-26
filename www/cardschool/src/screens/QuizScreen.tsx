import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { HOLDEM_LESSONS } from '@/data/lessons';
import { useUserStore, selectSettings } from '@/store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

const PASS_THRESHOLD = 0.7; // AC-01-4: ≥ 70% to pass

export function QuizScreen({ route, navigation }: Props) {
  const { lessonId } = route.params;
  const lesson = HOLDEM_LESSONS.find((l) => l.id === lessonId);
  const settings = useUserStore(selectSettings);
  const addXP = useUserStore((s) => s.addXP);
  const completeLesson = useUserStore((s) => s.completeLesson);
  const unlockBadge = useUserStore((s) => s.unlockBadge);

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [passed, setPassed] = useState(false);

  if (!lesson) return null;

  const questions = lesson.quizQuestions;
  const q = questions[currentQ];

  const handleSelect = (idx: number) => {
    if (confirmed) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setConfirmed(false);
    } else {
      // Quiz complete
      const finalScore = score + (selected === q.correctIndex ? 1 : 0);
      const pct = finalScore / questions.length;
      const didPass = pct >= PASS_THRESHOLD;
      setPassed(didPass);
      setShowResult(true);

      if (didPass) {
        completeLesson(lessonId);
        const { leveledUp, newLevel } = addXP(lesson.xpReward);
        if (lesson.badgeId) unlockBadge(lesson.badgeId);
        if (leveledUp) {
          // Navigate to badge screen after result is dismissed
        }
      }
    }
  };

  if (showResult) {
    const finalScore = score + (selected === q.correctIndex ? 1 : 0);
    return (
      <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>{passed ? '🏆' : '📚'}</Text>
            <Text style={styles.resultTitle}>{passed ? 'Lesson Complete!' : 'Keep Studying!'}</Text>
            <Text style={styles.resultScore}>
              {finalScore}/{questions.length} correct
              {'\n'}({Math.round((finalScore / questions.length) * 100)}%)
            </Text>
            {passed ? (
              <View style={styles.xpRow}>
                <Text style={styles.xpEarned}>+{lesson.xpReward} XP earned ✨</Text>
              </View>
            ) : (
              <Text style={styles.resultHint}>You need 70% to pass. Review the lesson and try again!</Text>
            )}

            <View style={styles.resultBtns}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => passed
                  ? navigation.navigate('MainTabs')
                  : navigation.goBack()
                }
              >
                <Text style={styles.btnPrimaryText}>{passed ? '🏠 Back to Home' : '📖 Review Lesson'}</Text>
              </TouchableOpacity>
              {passed && (
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => navigation.navigate('SandboxSetup')}
                >
                  <Text style={styles.btnSecondaryText}>♠️ Practice Hand</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Knowledge Check</Text>
          <Text style={styles.headerProgress}>Question {currentQ + 1} of {questions.length}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.prompt}>{q.prompt}</Text>

          {/* Options */}
          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === q.correctIndex;
              const showCorrect = confirmed && isCorrect;
              const showWrong = confirmed && isSelected && !isCorrect;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.option,
                    isSelected && !confirmed && styles.optionSelected,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                  ]}
                  onPress={() => handleSelect(i)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionBullet}>
                    <Text style={styles.optionBulletText}>
                      {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, (showCorrect || showWrong) && styles.optionTextRevealed]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation (revealed after answer) */}
          {confirmed && (
            <View style={styles.explanation}>
              <Text style={styles.explanationTitle}>
                {selected === q.correctIndex ? '✅ Correct!' : '❌ Not quite'}
              </Text>
              <Text style={styles.explanationText}>{q.explanation}</Text>
            </View>
          )}
        </ScrollView>

        {/* Action button */}
        <View style={styles.footer}>
          {!confirmed ? (
            <TouchableOpacity
              style={[styles.btnPrimary, selected === null && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={selected === null}
            >
              <Text style={styles.btnPrimaryText}>Confirm Answer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
              <Text style={styles.btnPrimaryText}>
                {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLabel: { fontSize: Typography.size.xs, color: Colors.gold, fontWeight: '700', letterSpacing: 1.5 },
  headerProgress: { fontSize: Typography.size.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },

  body: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  prompt: {
    fontSize: Typography.size.xl, fontWeight: '600', color: Colors.textPrimary,
    lineHeight: 30, marginBottom: Spacing.xl,
  },

  options: { gap: Spacing.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  optionCorrect: { borderColor: Colors.success, backgroundColor: 'rgba(46,204,113,0.12)' },
  optionWrong: { borderColor: Colors.error, backgroundColor: 'rgba(231,76,60,0.12)' },
  optionBullet: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionBulletText: { fontWeight: '700', color: Colors.textSecondary, fontSize: Typography.size.sm },
  optionText: { flex: 1, fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: 22 },
  optionTextRevealed: { fontWeight: '600' },

  explanation: {
    marginTop: Spacing.lg, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  explanationTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.gold, marginBottom: Spacing.sm },
  explanationText: { fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: 22 },

  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  btnPrimary: {
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: '#0a0a0a', fontSize: Typography.size.lg, fontWeight: '700' },
  btnSecondary: {
    borderWidth: 2, borderColor: Colors.gold, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnSecondaryText: { color: Colors.gold, fontSize: Typography.size.md, fontWeight: '600' },

  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  resultTitle: { fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.gold, marginBottom: Spacing.md },
  resultScore: {
    fontSize: Typography.size.xl, color: Colors.textPrimary, textAlign: 'center',
    lineHeight: 30, marginBottom: Spacing.lg,
  },
  xpRow: { marginBottom: Spacing.lg },
  xpEarned: { fontSize: Typography.size.lg, color: Colors.success, fontWeight: '700' },
  resultHint: { fontSize: Typography.size.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 22 },
  resultBtns: { width: '100%', gap: Spacing.sm },
});
