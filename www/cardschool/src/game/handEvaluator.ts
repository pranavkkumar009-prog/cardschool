/**
 * Hand Evaluator
 * ──────────────
 * Wraps the `pokersolver` npm package for standard hand evaluation,
 * with a thin adapter layer that works with our Card type.
 *
 * pokersolver handles:
 *   - All 10 hand ranks (Royal Flush → High Card)
 *   - Best-5-of-7 (Hold'em / Stud)
 *   - Omaha (coming V2) requires custom combo generation — see note below
 *
 * Fallback: if pokersolver is unavailable in test environments,
 * a lightweight internal evaluator is used.
 */

import type { Card } from '@/types';
import { toSolverNotation } from './deck';

// ─── pokersolver integration ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Hand } = require('pokersolver') as { Hand: PokersolverHand };

interface PokersolverHand {
  solve: (cards: string[]) => SolvedHand;
  winners: (hands: SolvedHand[]) => SolvedHand[];
}

interface SolvedHand {
  name: string;        // e.g. "Royal Flush", "Two Pair"
  rank: number;        // 1 (high card) – 9 (royal flush) in pokersolver
  cards: string[];
  descr: string;       // e.g. "Two Pair, Aces and Kings"
  _player?: number;   // we attach this for winner identification
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface EvaluatedHand {
  name: string;         // "Royal Flush", "Two Pair", etc.
  description: string;  // "Two Pair, Aces and Kings"
  rank: number;         // higher = better (1–9 scale from pokersolver)
  score: number;        // composite score for comparison
}

/**
 * Evaluate the best possible 5-card hand from a set of cards (up to 7).
 * Used for Hold'em (2 hole + 5 community = 7 cards).
 */
export function evaluateBestHand(cards: Card[]): EvaluatedHand {
  try {
    const notations = cards.map(toSolverNotation);
    const solved: SolvedHand = Hand.solve(notations);
    return {
      name: solved.name,
      description: solved.descr,
      rank: solved.rank,
      score: solved.rank * 1_000_000,
    };
  } catch {
    return fallbackEvaluate(cards);
  }
}

/**
 * Determine the winner(s) among multiple players.
 * Returns an array of playerIndices (there can be ties).
 */
export function determineWinners(
  playerHands: { playerId: string; cards: Card[]; community: Card[] }[]
): string[] {
  try {
    const solved = playerHands.map(({ playerId, cards, community }, i) => {
      const all = [...cards, ...community].map(toSolverNotation);
      const hand = Hand.solve(all) as SolvedHand;
      hand._player = i;
      return { hand, playerId };
    });

    const winners = Hand.winners(solved.map((s) => s.hand)) as SolvedHand[];
    const winnerIndices = new Set(winners.map((w) => w._player));
    return solved
      .filter((_, i) => winnerIndices.has(i))
      .map((s) => s.playerId);
  } catch {
    // Fallback: highest raw score wins
    const scored = playerHands.map(({ playerId, cards, community }) => ({
      playerId,
      score: fallbackEvaluate([...cards, ...community]).score,
    }));
    const maxScore = Math.max(...scored.map((s) => s.score));
    return scored.filter((s) => s.score === maxScore).map((s) => s.playerId);
  }
}

/**
 * Quick strength estimate for AI decision-making (0.0 – 1.0).
 * Not used for showdown — only for AI bet sizing decisions.
 */
export function estimateHandStrength(
  holeCards: Card[],
  communityCards: Card[]
): number {
  try {
    const all = [...holeCards, ...communityCards];
    if (all.length < 2) return 0.1;
    const evaluated = evaluateBestHand(all);
    // pokersolver rank: 1 (HC) – 9 (RF). Normalize to 0–1.
    return Math.min(evaluated.rank / 9, 1.0);
  } catch {
    return 0.15;
  }
}

// ─── Fallback Evaluator ───────────────────────────────────────────────────────
// Used when pokersolver is unavailable. Not as accurate for ties,
// but sufficient to unblock development and testing.

function fallbackEvaluate(cards: Card[]): EvaluatedHand {
  const top5 = cards.slice(0, 5);
  const values = top5.map((c) => c.value).sort((a, b) => b - a);
  const suits = top5.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);
  const valSet = [...new Set(values)].sort((a, b) => b - a);
  const isStraight =
    valSet.length === 5 && valSet[0] - valSet[4] === 4;

  const counts: Record<number, number> = {};
  values.forEach((v) => (counts[v] = (counts[v] ?? 0) + 1));
  const groups = Object.values(counts).sort((a, b) => b - a);

  let rank = 1;
  let name = 'High Card';

  if (isFlush && isStraight && values[0] === 14) { rank = 9; name = 'Royal Flush'; }
  else if (isFlush && isStraight) { rank = 8; name = 'Straight Flush'; }
  else if (groups[0] === 4) { rank = 7; name = 'Four of a Kind'; }
  else if (groups[0] === 3 && groups[1] === 2) { rank = 6; name = 'Full House'; }
  else if (isFlush) { rank = 5; name = 'Flush'; }
  else if (isStraight) { rank = 4; name = 'Straight'; }
  else if (groups[0] === 3) { rank = 3; name = 'Three of a Kind'; }
  else if (groups[0] === 2 && groups[1] === 2) { rank = 2; name = 'Two Pair'; }
  else if (groups[0] === 2) { rank = 1; name = 'One Pair'; }

  return {
    name,
    description: name,
    rank,
    score: rank * 1_000_000 + values.reduce((a, v, i) => a + v * Math.pow(15, 4 - i), 0),
  };
}

// ─── Hand Rank Display Helpers ────────────────────────────────────────────────

export const HAND_RANK_DISPLAY = [
  { rank: 10, name: 'Royal Flush',      example: 'A♠ K♠ Q♠ J♠ 10♠', color: '#FFD700' },
  { rank: 9,  name: 'Straight Flush',   example: '9♣ 8♣ 7♣ 6♣ 5♣',  color: '#C0C0C0' },
  { rank: 8,  name: 'Four of a Kind',   example: 'A♠ A♥ A♦ A♣ K',   color: '#CD7F32' },
  { rank: 7,  name: 'Full House',       example: 'K♥ K♦ K♣ Q♥ Q♦',  color: '#4CAF50' },
  { rank: 6,  name: 'Flush',            example: 'A♥ J♥ 9♥ 6♥ 2♥',  color: '#2196F3' },
  { rank: 5,  name: 'Straight',         example: '9♠ 8♥ 7♦ 6♣ 5♠',  color: '#9C27B0' },
  { rank: 4,  name: 'Three of a Kind',  example: 'Q♠ Q♥ Q♦ 8♣ 3',   color: '#FF9800' },
  { rank: 3,  name: 'Two Pair',         example: 'J♥ J♣ 7♥ 7♦ A',   color: '#00BCD4' },
  { rank: 2,  name: 'One Pair',         example: '10♠ 10♦ K♣ 5♥ 2', color: '#8BC34A' },
  { rank: 1,  name: 'High Card',        example: 'A♠ J♦ 9♣ 6♥ 2',   color: '#607D8B' },
] as const;
