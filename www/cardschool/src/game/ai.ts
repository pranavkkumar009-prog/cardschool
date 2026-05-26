/**
 * AI Opponent Engine
 * ──────────────────
 * Rule-based logic with two difficulty profiles (AC-03-3).
 * No ML required — deterministic with controlled randomization.
 *
 * Design goals:
 *  - Beginner: folds ≥ 50% pre-flop, never bluffs, basic sizing
 *  - Intermediate: varied ranges, occasional river bluffs (≤ 20%), adaptive sizing
 *  - Both: visible 1–2s "thinking" delay (AC-03-3)
 *  - Easy profile makes deliberate mistakes (mistakeRate) to stay beatable
 */

import type { Player, GameSession, PlayerAction, AIDifficulty } from '@/types';
import { estimateHandStrength } from './handEvaluator';

// ─── Difficulty Profiles ──────────────────────────────────────────────────────

interface AIProfile {
  /** Hand strength threshold below which AI always folds to any bet */
  foldThreshold: number;
  /** Fraction of time AI bluffs when strength is very low on river */
  bluffFrequency: number;
  /** Fraction of time AI raises when it could just call */
  raiseAggression: number;
  /** Fraction of time AI makes a suboptimal "mistake" (fold a winner, call a loser) */
  mistakeRate: number;
  /** Min thinking delay ms */
  thinkingDelayMin: number;
  /** Max thinking delay ms */
  thinkingDelayMax: number;
}

const PROFILES: Record<AIDifficulty, AIProfile> = {
  beginner: {
    foldThreshold: 0.25,
    bluffFrequency: 0,        // Never bluffs (AC-03-3)
    raiseAggression: 0.15,
    mistakeRate: 0.25,        // Makes bad plays 25% of the time
    thinkingDelayMin: 800,
    thinkingDelayMax: 1500,
  },
  intermediate: {
    foldThreshold: 0.40,
    bluffFrequency: 0.18,     // ≤ 20% river bluffs (AC-03-3)
    raiseAggression: 0.45,
    mistakeRate: 0.06,
    thinkingDelayMin: 600,
    thinkingDelayMax: 1200,
  },
};

// ─── AI Decision ──────────────────────────────────────────────────────────────

export interface AIDecision {
  action: PlayerAction;
  raiseAmount: number;    // 0 unless action === 'raise'
  thinkingMs: number;     // delay before action is applied
}

/**
 * Compute an AI player's action for the current game state.
 *
 * @param player   - The AI player making the decision
 * @param session  - Full game session (for pot odds, round, community cards)
 * @param difficulty - Difficulty profile override (falls back to session.difficulty)
 */
export function computeAIDecision(
  player: Player,
  session: GameSession,
  difficulty?: AIDifficulty
): AIDecision {
  const profile = PROFILES[difficulty ?? session.difficulty];
  const thinkingMs = randInt(profile.thinkingDelayMin, profile.thinkingDelayMax);

  // Deliberate mistake — occasionally act randomly
  if (Math.random() < profile.mistakeRate) {
    return makeMistake(player, session, profile, thinkingMs);
  }

  const strength = estimateHandStrength(player.hand, session.community);
  const callAmount = Math.max(0, session.currentBet - player.bet);
  const isOnRiver = session.round === 'river';
  const isBluffOpportunity = isOnRiver && strength < 0.25 && Math.random() < profile.bluffFrequency;
  const effectiveStrength = isBluffOpportunity ? 0.85 : strength;

  // ── No bet to call (check or bet) ─────────────────────────────────────────
  if (callAmount === 0) {
    if (effectiveStrength > 0.6 && Math.random() < profile.raiseAggression) {
      const raiseAmount = computeRaiseSize(session.pot, player.chips, effectiveStrength);
      return raiseAmount > 0
        ? { action: 'raise', raiseAmount, thinkingMs }
        : { action: 'check', raiseAmount: 0, thinkingMs };
    }
    return { action: 'check', raiseAmount: 0, thinkingMs };
  }

  // ── There is a bet — compare to pot odds ──────────────────────────────────
  const potOdds = callAmount / (session.pot + callAmount);

  if (effectiveStrength < profile.foldThreshold && !isBluffOpportunity) {
    // Too weak to call
    return { action: 'fold', raiseAmount: 0, thinkingMs };
  }

  if (effectiveStrength > potOdds + 0.15) {
    // Strong enough to at least call; consider raising
    if (effectiveStrength > 0.70 && Math.random() < profile.raiseAggression) {
      const raiseAmount = computeRaiseSize(session.pot, player.chips, effectiveStrength);
      if (raiseAmount > callAmount) {
        return { action: 'raise', raiseAmount, thinkingMs };
      }
    }
    return { action: 'call', raiseAmount: 0, thinkingMs };
  }

  // Marginal — call if pot odds justify, else fold
  if (effectiveStrength > potOdds) {
    return { action: 'call', raiseAmount: 0, thinkingMs };
  }

  return { action: 'fold', raiseAmount: 0, thinkingMs };
}

// ─── Coach Tip Generator ──────────────────────────────────────────────────────
// Contextual tips for Guided Practice mode (AC-02-2)

export interface CoachTip {
  message: string;
  isPositive: boolean;
}

/**
 * Generate a coach tip for the human player given their current situation.
 * Returns null if no tip is warranted (don't over-tip — see PRD AC-02-2).
 */
export function generateCoachTip(
  holeCards: Player['hand'],
  community: GameSession['community'],
  round: GameSession['round'],
  lastAction?: PlayerAction,
  lastAIAction?: PlayerAction
): CoachTip | null {
  const strength = estimateHandStrength(holeCards, community);
  const callAmount = 0; // caller provides if needed

  // Round-opening tips
  if (round === 'pre-flop' && !lastAction) {
    const hasAce = holeCards.some((c) => c.rank === 'A');
    const hasPair = new Set(holeCards.map((c) => c.value)).size < holeCards.length;

    if (hasAce && hasPair)
      return { message: "Pocket Aces! The best starting hand in poker. Raise to build the pot.", isPositive: true };
    if (hasPair)
      return { message: `Pocket pair! Pairs are strong starting hands. Consider raising or calling.`, isPositive: true };
    if (hasAce)
      return { message: "You have an Ace! This is a solid starting card. Your second card determines how strong you are.", isPositive: true };
    if (strength < 0.15)
      return { message: "Weak starting hand. Folding pre-flop saves chips for better opportunities.", isPositive: false };
    return null;
  }

  if (round === 'flop' && !lastAction) {
    if (strength > 0.65)
      return { message: "Strong hand after the flop! Bet to make opponents pay to draw against you.", isPositive: true };
    if (strength < 0.25)
      return { message: "The board didn't help your hand much. Consider checking or folding to a large bet.", isPositive: false };
    return null;
  }

  if (round === 'river' && !lastAction) {
    if (strength > 0.7)
      return { message: "Strong hand at the river — bet for value! You want to maximize the pot you'll win.", isPositive: true };
    return null;
  }

  // Post-action feedback (gentle, non-blocking)
  if (lastAction === 'fold' && strength > 0.6) {
    return { message: "Good try! With that hand strength, many pros would call here — but folding is always safe.", isPositive: false };
  }

  if (lastAction === 'call' && strength > 0.75) {
    return { message: "With a strong hand like yours, raising could win you more chips than calling.", isPositive: false };
  }

  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeRaiseSize(pot: number, chips: number, strength: number): number {
  // Sizing: 50–100% of pot depending on strength
  const fraction = 0.5 + strength * 0.5;
  const desired = Math.floor(pot * fraction / 10) * 10; // round to nearest 10
  return Math.min(desired, Math.floor(chips * 0.6));
}

function makeMistake(
  player: Player,
  session: GameSession,
  profile: AIProfile,
  thinkingMs: number
): AIDecision {
  const callAmount = Math.max(0, session.currentBet - player.bet);
  // Randomly pick a legal suboptimal action
  const roll = Math.random();
  if (callAmount === 0) {
    return roll < 0.5
      ? { action: 'check', raiseAmount: 0, thinkingMs }
      : { action: 'raise', raiseAmount: Math.floor(session.pot * 0.3), thinkingMs };
  }
  if (roll < 0.4) return { action: 'fold', raiseAmount: 0, thinkingMs };
  if (roll < 0.8) return { action: 'call', raiseAmount: 0, thinkingMs };
  return { action: 'raise', raiseAmount: Math.floor(session.pot * 0.5), thinkingMs };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
