import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Dimensions, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { HOLDEM_LESSONS, GLOSSARY } from '@/data/lessons';
import { useUserStore, selectSettings } from '@/store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

const { width: SCREEN_W } = Dimensions.get('window');

export function LessonScreen({ route, navigation }: Props) {
  const { lessonId } = route.params;
  const lesson = HOLDEM_LESSONS.find((l) => l.id === lessonId);
  const settings = useUserStore(selectSettings);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [glossaryTerm, setGlossaryTerm] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  if (!lesson) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lesson not found.</Text>
      </View>
    );
  }

  const totalCards = lesson.cards.length;
  const isLast = currentIndex === totalCards - 1;

  const goNext = useCallback(() => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      navigation.replace('Quiz', { lessonId });
    } else {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  }, [currentIndex, isLast, lessonId, navigation, settings.hapticsEnabled]);

  const goPrev = useCallback(() => {
    if (currentIndex === 0) return;
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    flatListRef.current?.scrollToIndex({ index: prev, animated: true });
  }, [currentIndex]);

  return (
    <LinearGradient colors={['#0F2318', '#1A3C2E', '#0F2318']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{lesson.icon} {lesson.title}</Text>
          <Text style={styles.progress}>{currentIndex + 1}/{totalCards}</Text>
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {lesson.cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < currentIndex && styles.dotDone,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Cards (horizontal FlatList — swipe-right progression per PRD 5.4) */}
        <FlatList
          ref={flatListRef}
          data={lesson.cards}
          horizontal
          pagingEnabled
          scrollEnabled={false} // we control via buttons; avoids accidental swipes past quiz gate
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, { width: SCREEN_W }]}>
              <ScrollView
                contentContainerStyle={styles.cardContent}
                showsVerticalScrollIndicator={false}
              >
                {item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
                <BodyText body={item.body} onTermPress={setGlossaryTerm} />
              </ScrollView>
            </View>
          )}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
        />

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={goPrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navBtnText}>← Prev</Text>
          </TouchableOpacity>

          <Text style={styles.xpChip}>+{lesson.xpReward} XP on completion</Text>

          <TouchableOpacity style={styles.navBtnPrimary} onPress={goNext}>
            <Text style={styles.navBtnPrimaryText}>{isLast ? 'Take Quiz →' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>

        {/* Glossary tooltip */}
        {glossaryTerm && (
          <TouchableOpacity
            style={styles.glossaryOverlay}
            onPress={() => setGlossaryTerm(null)}
            activeOpacity={1}
          >
            <View style={styles.glossaryCard}>
              <Text style={styles.glossaryTerm}>{glossaryTerm}</Text>
              <Text style={styles.glossaryDef}>{GLOSSARY[glossaryTerm] ?? 'No definition available.'}</Text>
              <Text style={styles.glossaryDismiss}>Tap anywhere to close</Text>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Inline Body Text with tappable glossary terms ────────────────────────────

interface BodyTextProps {
  body: string;
  onTermPress: (term: string) => void;
}

function BodyText({ body, onTermPress }: BodyTextProps) {
  // Bold **text** rendering + glossary term detection
  const terms = Object.keys(GLOSSARY);
  const parts = body.split(/(\*\*[^*]+\*\*)/g);

  return (
    <Text style={styles.cardBody}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          const isTerm = terms.includes(inner);
          return (
            <Text
              key={i}
              style={[styles.bold, isTerm && styles.glossaryLink]}
              onPress={isTerm ? () => onTermPress(inner) : undefined}
            >
              {inner}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.error, fontSize: Typography.size.lg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  backText: { color: Colors.gold, fontSize: Typography.size.md },
  headerTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  progress: { color: Colors.textSecondary, fontSize: Typography.size.sm },

  dots: { flexDirection: 'row', gap: 5, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  dot: { height: 4, flex: 1, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotDone: { backgroundColor: Colors.gold },
  dotActive: { backgroundColor: 'rgba(212,175,55,0.5)' },

  card: { flex: 1, paddingHorizontal: Spacing.xl },
  cardContent: { paddingBottom: Spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  cardTitle: {
    fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.gold,
    marginBottom: Spacing.lg, lineHeight: 34,
  },
  cardBody: {
    fontSize: Typography.size.lg, color: Colors.textPrimary,
    lineHeight: 28, letterSpacing: 0.2,
  },
  bold: { fontWeight: '700', color: Colors.textPrimary },
  glossaryLink: { color: Colors.gold, textDecorationLine: 'underline' },

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.sm,
  },
  navBtn: {
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  navBtnPrimary: {
    backgroundColor: Colors.gold, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: Spacing.lg,
  },
  navBtnPrimaryText: { color: '#0a0a0a', fontWeight: '700', fontSize: Typography.size.sm },
  xpChip: { fontSize: Typography.size.xs, color: Colors.textSecondary },

  glossaryOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 100,
  },
  glossaryCard: {
    backgroundColor: Colors.bgSurface, borderRadius: Radius.lg,
    padding: Spacing.lg, marginHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: Colors.gold, maxWidth: 360,
  },
  glossaryTerm: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.gold, marginBottom: Spacing.sm },
  glossaryDef: { fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: 24 },
  glossaryDismiss: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' },
});
