import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { useGameStore, selectSession, selectHumanPlayer, selectCommunity, selectPot, selectRound, selectActivePlayer } from '@/store/gameStore';
import { useUserStore, selectSettings } from '@/store/userStore';
import { computeAIDecision, generateCoachTip } from '@/game/ai';
import { determineWinners, evaluateBestHand } from '@/game/handEvaluator';
import { raiseRange } from '@/game/betting';
import { isRedSuit } from '@/game/deck';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';

type Props = NativeStackScreenProps<RootStackParamList, 'Sandbox'>;

const ROUND_NAMES: Record<string, string> = {
  'pre-flop': 'Pre-Flop',
  flop: 'The Flop',
  turn: 'The Turn',
  river: 'The River',
  showdown: 'Showdown',
};

export function SandboxScreen({ route, navigation }: Props) {
  const { difficulty, opponentCount } = route.params;
  const settings = useUserStore(selectSettings);
  const addXP = useUserStore((s) => s.addXP);

  const {
    startSession, resetSession, dealRound, advanceBettingRound,
    recordAction, setPlayerStatus, markHandComplete,
    updatePlayerChips, session,
  } = useGameStore();

  const human = useGameStore(selectHumanPlayer);
  const community = useGameStore(selectCommunity);
  const pot = useGameStore(selectPot);
  const round = useGameStore(selectRound);
  const activePlayer = useGameStore(selectActivePlayer);

  const [raiseAmount, setRaiseAmount] = React.useState(40);
  const [coachTip, setCoachTip] = React.useState<string | null>(null);
  const [handResult, setHandResult] = React.useState<{ winnerId: string; handName: string } | null>(null);
  const aiRunning = useRef(false);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    startSession({ game: 'holdem', mode: 'sandbox', difficulty, opponentCount });
    return () => resetSession();
  }, []);

  useEffect(() => {
    if (session && !session.isComplete && session.deck.length === 0) {
      dealRound();
    }
  }, [session?.id]);

  useEffect(() => {
    if (!session) return;
    if (session.isComplete) {
      if (settings.hapticsEnabled) {
        const isHumanWinner = session.winnerId === 'human';
        Haptics.notificationAsync(
          isHumanWinner
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error
        );
      }
      setHandResult({ winnerId: session.winnerId ?? '', handName: session.winningHandName ?? '' });
      if (session.winnerId === 'human') addXP(25);
      return;
    }
    runTurn();
  }, [session?.activePlayerIndex, session?.round]);

  // ── Turn logic ────────────────────────────────────────────────────────────

  const runTurn = useCallback(async () => {
    if (!session || session.isComplete) return;
    const active = session.players[session.activePlayerIndex];
    if (!active || active.folded) {
      await advanceTurnPointer();
      return;
    }

    if (active.isHuman) {
      // Generate coach tip for guided sessions
      if (human) {
        const tip = generateCoachTip(human.hand, community, round);
        setCoachTip(tip?.message ?? null);
      }
      // Update raise slider bounds
      if (human) {
        const { suggested } = raiseRange(session.currentBet, pot, human.chips);
        setRaiseAmount(suggested);
      }
      return; // Wait for user action
    }

    // AI turn
    if (aiRunning.current) return;
    aiRunning.current = true;
    setPlayerStatus(active.id, 'thinking');

    const decision = computeAIDecision(active, session, difficulty);
    await sleep(decision.thinkingMs);

    if (!useGameStore.getState().session?.isComplete) {
      recordAction(decision.action, decision.raiseAmount);
      setPlayerStatus(active.id, decision.action);
      await advanceTurnPointer();
    }
    aiRunning.current = false;
  }, [session]);

  const advanceTurnPointer = useCallback(async () => {
    if (!session) return;

    const players = session.players;
    let next = (session.activePlayerIndex + 1) % players.length;

    // Find next non-folded, non-all-in player who hasn't acted (or who owes)
    for (let i = 0; i < players.length; i++) {
      const p = players[next];
      if (!p.folded && !p.allIn && (!p.acted || p.bet < session.currentBet)) break;
      next = (next + 1) % players.length;
    }

    const p = players[next];
    const bettingDone =
      players.filter((x) => !x.folded && !x.allIn).every((x) => x.acted && x.bet >= session.currentBet);
    const activePlayers = players.filter((x) => !x.folded);

    if (activePlayers.length === 1) {
      // Everyone else folded
      const winner = activePlayers[0];
      winner.chips += session.pot;
      updatePlayerChips(winner.id, winner.chips);
      const ev = evaluateBestHand(winner.hand);
      markHandComplete(winner.id, ev.name);
      return;
    }

    if (bettingDone) {
      if (session.round === 'river') {
        // Showdown
        const remaining = players.filter((x) => !x.folded);
        const winnerIds = determineWinners(
          remaining.map((p) => ({ playerId: p.id, cards: p.hand, community: session.community }))
        );
        const winner = remaining.find((p) => winnerIds.includes(p.id))!;
        const ev = evaluateBestHand([...winner.hand, ...session.community].slice(0, 7));
        winner.chips += session.pot;
        updatePlayerChips(winner.id, winner.chips);
        markHandComplete(winner.id, ev.name);
      } else {
        advanceBettingRound();
      }
    } else {
      useGameStore.setState((s) => ({
        session: s.session ? { ...s.session, activePlayerIndex: next } : null,
      }));
    }
  }, [session]);

  const handleAction = useCallback(
    (action: 'fold' | 'check' | 'call' | 'raise') => {
      if (!session || !human) return;
      if (session.players[session.activePlayerIndex].id !== 'human') return;
      setCoachTip(null);
      if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      recordAction(action, action === 'raise' ? raiseAmount : 0);
      setTimeout(() => advanceTurnPointer(), 200);
    },
    [session, human, raiseAmount, settings.hapticsEnabled]
  );

  const startNextHand = useCallback(() => {
    setHandResult(null);
    dealRound();
  }, []);

  if (!session || !human) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Shuffling deck...</Text>
      </View>
    );
  }

  const callAmount = Math.max(0, session.currentBet - human.bet);
  const isHumanTurn = session.players[session.activePlayerIndex]?.id === 'human' && !session.isComplete;
  const { min, max } = human ? raiseRange(session.currentBet, pot, human.chips) : { min: 20, max: 1000 };

  return (
    <LinearGradient colors={[Colors.felt ?? '#1A5C2E', '#0F2318']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* HUD */}
        <View style={styles.hud}>
          <TouchableOpacity onPress={() => { resetSession(); navigation.goBack(); }}>
            <Text style={styles.exitBtn}>✕ Exit</Text>
          </TouchableOpacity>
          <Text style={styles.hudTitle}>Texas Hold'em</Text>
          <View style={styles.hudChips}>
            <Text style={styles.hudChipsText}>🪙 {human.chips}</Text>
          </View>
        </View>

        {/* Round indicator */}
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>{ROUND_NAMES[round] ?? round}</Text>
        </View>

        {/* Coach tip */}
        {coachTip && (
          <View style={styles.coachTip}>
            <Text style={styles.coachIcon}>💡</Text>
            <Text style={styles.coachText}>{coachTip}</Text>
            <TouchableOpacity onPress={() => setCoachTip(null)}>
              <Text style={styles.coachDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Players */}
        <View style={styles.aiSeats}>
          {session.players.filter((p) => !p.isHuman).map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.aiSeat,
                session.players[session.activePlayerIndex]?.id === p.id && styles.aiSeatActive,
                p.folded && styles.aiSeatFolded,
              ]}
            >
              <View style={styles.aiCards}>
                {p.hand.map((c, ci) => (
                  <View key={ci} style={[styles.faceDownCard, session.isComplete && !p.folded && styles.faceUpCard]}>
                    {session.isComplete && !p.folded ? (
                      <>
                        <Text style={[styles.faceUpRank, (c.suit === '♥' || c.suit === '♦') && styles.redText]}>{c.rank}</Text>
                        <Text style={[styles.faceUpSuit, (c.suit === '♥' || c.suit === '♦') && styles.redText]}>{c.suit}</Text>
                      </>
                    ) : null}
                  </View>
                ))}
              </View>
              <Text style={styles.aiName}>{p.name}</Text>
              <Text style={styles.aiChips}>🪙 {p.chips}</Text>
              {p.status ? <Text style={styles.aiStatus}>{p.status.toUpperCase()}</Text> : null}
              {p.bet > 0 && <Text style={styles.aiBet}>bet: {p.bet}</Text>}
            </View>
          ))}
        </View>

        {/* Community Cards */}
        <View style={styles.communityArea}>
          <View style={styles.communityCards}>
            {Array.from({ length: 5 }, (_, i) => {
              const c = community[i];
              return c ? (
                <CardFace key={i} rank={c.rank} suit={c.suit} />
              ) : (
                <View key={i} style={styles.communityPlaceholder} />
              );
            })}
          </View>
          {pot > 0 && <Text style={styles.potText}>Pot: {pot} chips</Text>}
        </View>

        {/* Human Cards */}
        <View style={styles.humanCards}>
          {human.hand.map((c, i) => (
            <CardFace key={i} rank={c.rank} suit={c.suit} large />
          ))}
        </View>

        {/* Hand Result Overlay */}
        {handResult && (
          <View style={styles.resultOverlay}>
            <View style={styles.resultPanel}>
              <Text style={styles.resultEmoji}>{handResult.winnerId === 'human' ? '🏆' : '😔'}</Text>
              <Text style={styles.resultTitle}>
                {handResult.winnerId === 'human' ? 'You Win!' : `${session.players.find(p => p.id === handResult.winnerId)?.name ?? 'Opponent'} Wins`}
              </Text>
              <Text style={styles.resultHand}>{handResult.handName}</Text>
              <Text style={styles.resultPot}>Pot: {pot} chips</Text>
              <View style={styles.resultBtns}>
                <TouchableOpacity style={styles.btnPrimary} onPress={startNextHand}>
                  <Text style={styles.btnPrimaryText}>Next Hand →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => { resetSession(); navigation.goBack(); }}>
                  <Text style={styles.btnSecondaryText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Action Bar */}
        <View style={styles.actionBar}>
          {isHumanTurn ? (
            <>
              <TouchableOpacity style={[styles.actionBtn, styles.btnFold]} onPress={() => handleAction('fold')}>
                <Text style={styles.actionBtnText}>Fold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCheck, callAmount > 0 && styles.btnDisabled]}
                onPress={() => handleAction('check')}
                disabled={callAmount > 0}
              >
                <Text style={styles.actionBtnText}>Check</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCall, callAmount === 0 && styles.btnDisabled]}
                onPress={() => handleAction('call')}
                disabled={callAmount === 0}
              >
                <Text style={styles.actionBtnText}>Call {callAmount > 0 ? callAmount : ''}</Text>
              </TouchableOpacity>
              <View style={styles.raiseArea}>
                <Text style={styles.raiseLabel}>Raise: {raiseAmount}</Text>
                <TouchableOpacity style={[styles.actionBtn, styles.btnRaise]} onPress={() => handleAction('raise')}>
                  <Text style={styles.actionBtnText}>Raise</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.waitingRow}>
              <Text style={styles.waitingText}>
                {session.isComplete ? '' : `${session.players[session.activePlayerIndex]?.name ?? ''} is thinking...`}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

interface CardFaceProps { rank: string; suit: string; large?: boolean; }
function CardFace({ rank, suit, large = false }: CardFaceProps) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <View style={[styles.card, large && styles.cardLarge]}>
      <Text style={[styles.cardRank, isRed && styles.cardRed, large && styles.cardRankLarge]}>{rank}</Text>
      <Text style={[styles.cardSuit, isRed && styles.cardRed, large && styles.cardSuitLarge]}>{suit}</Text>
    </View>
  );
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.size.lg },

  hud: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs,
  },
  exitBtn: { color: Colors.gold, fontSize: Typography.size.md },
  hudTitle: { color: Colors.gold, fontWeight: '700', fontSize: Typography.size.md },
  hudChips: {
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: Radius.full,
    paddingVertical: 4, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border,
  },
  hudChipsText: { color: Colors.gold, fontWeight: '700', fontSize: Typography.size.sm },

  roundBadge: {
    alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  roundText: { color: Colors.goldLight, fontSize: Typography.size.sm, fontWeight: '600' },

  coachTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: Radius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: 'rgba(46,204,113,0.5)',
  },
  coachIcon: { fontSize: 16, flexShrink: 0 },
  coachText: { flex: 1, color: Colors.textPrimary, fontSize: Typography.size.sm, lineHeight: 18 },
  coachDismiss: { color: Colors.textSecondary, fontSize: 14 },

  aiSeats: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, flexWrap: 'wrap', gap: Spacing.sm,
  },
  aiSeat: {
    alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, minWidth: 90,
  },
  aiSeatActive: { borderColor: Colors.gold },
  aiSeatFolded: { opacity: 0.35 },
  aiCards: { flexDirection: 'row', gap: 3, marginBottom: 2 },
  faceDownCard: {
    width: 22, height: 32, borderRadius: 3,
    backgroundColor: '#1A3A6E', borderWidth: 1, borderColor: '#0d2344',
  },
  faceUpCard: { backgroundColor: '#F5F0E8', alignItems: 'center', justifyContent: 'center' },
  faceUpRank: { fontSize: 10, fontWeight: '700', color: Colors.textDark },
  faceUpSuit: { fontSize: 9, color: Colors.textDark },
  redText: { color: Colors.suitRed },
  aiName: { fontSize: Typography.size.xs, color: Colors.textPrimary, fontWeight: '600' },
  aiChips: { fontSize: Typography.size.xs, color: Colors.gold },
  aiStatus: {
    fontSize: 9, color: Colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, paddingHorizontal: 4,
  },
  aiBet: { fontSize: 9, color: Colors.info },

  communityArea: { alignItems: 'center', marginVertical: Spacing.md },
  communityCards: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  communityPlaceholder: {
    width: 48, height: 68, borderRadius: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  potText: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: 14,
    color: Colors.gold, fontSize: Typography.size.sm, fontWeight: '600',
    borderWidth: 1, borderColor: Colors.border,
  },

  humanCards: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.md },

  card: {
    width: 48, height: 68, backgroundColor: Colors.bgCard, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center', ...Shadow.card, gap: 2,
  },
  cardLarge: { width: 64, height: 90 },
  cardRank: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  cardRankLarge: { fontSize: 22 },
  cardSuit: { fontSize: 14, color: Colors.textDark },
  cardSuitLarge: { fontSize: 18 },
  cardRed: { color: Colors.suitRed },

  actionBar: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, paddingTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: Radius.md, minWidth: 72, alignItems: 'center' },
  actionBtnText: { fontWeight: '700', color: '#fff', fontSize: Typography.size.sm },
  btnFold: { backgroundColor: '#7f8c8d' },
  btnCheck: { backgroundColor: '#2c3e50' },
  btnCall: { backgroundColor: Colors.info },
  btnRaise: { backgroundColor: Colors.goldDark },
  btnDisabled: { opacity: 0.35 },
  raiseArea: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  raiseLabel: { fontSize: Typography.size.xs, color: Colors.gold, fontWeight: '600' },
  waitingRow: { flex: 1, alignItems: 'center' },
  waitingText: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontStyle: 'italic' },

  resultOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center',
  },
  resultPanel: {
    backgroundColor: Colors.bgSurface, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    borderWidth: 2, borderColor: Colors.gold, ...Shadow.panel, maxWidth: 320, width: '85%',
  },
  resultEmoji: { fontSize: 52 },
  resultTitle: { fontSize: Typography.size.xxl, fontWeight: '700', color: Colors.gold },
  resultHand: { fontSize: Typography.size.lg, color: Colors.textPrimary },
  resultPot: { fontSize: Typography.size.md, color: Colors.textSecondary },
  resultBtns: { width: '100%', gap: Spacing.sm },
  btnPrimary: { backgroundColor: Colors.gold, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#0a0a0a', fontWeight: '700', fontSize: Typography.size.md },
  btnSecondary: { borderWidth: 2, borderColor: Colors.gold, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  btnSecondaryText: { color: Colors.gold, fontWeight: '600', fontSize: Typography.size.md },
});
