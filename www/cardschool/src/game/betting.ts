/**
 * Betting Engine — Side Pot Calculation
 * ──────────────────────────────────────
 * Side pots are created when one or more players are all-in for different amounts.
 * This module handles correct pot distribution per AC-03-2.
 *
 * Algorithm (standard poker side-pot logic):
 *   1. Sort players by totalBet ascending
 *   2. For each unique totalBet level, create a pot layer capped at that level
 *   3. Only players who contributed to a pot layer are eligible to win it
 */

import type { Player, SidePot } from '@/types';

// ─── Side Pot Calculation ─────────────────────────────────────────────────────

/**
 * Given the current player array (with totalBet populated),
 * return the correct array of side pots.
 *
 * Example:
 *   Player A: totalBet = 100, all-in
 *   Player B: totalBet = 300
 *   Player C: totalBet = 300
 *   → Main pot: 300 (A,B,C eligible)
 *   → Side pot: 400 (B,C eligible)
 */
export function calculateSidePots(players: Player[]): SidePot[] {
  const active = players.filter((p) => !p.folded && p.totalBet > 0);
  if (active.length === 0) return [];

  // All-in players create pot caps
  const allInAmounts = active
    .filter((p) => p.allIn)
    .map((p) => p.totalBet)
    .sort((a, b) => a - b);

  if (allInAmounts.length === 0) {
    // No all-ins — single pot, all non-folded players eligible
    return [
      {
        amount: players.reduce((sum, p) => sum + p.totalBet, 0),
        eligiblePlayerIds: active.map((p) => p.id),
      },
    ];
  }

  const pots: SidePot[] = [];
  let processedLevel = 0;

  // Add a sentinel for the max bet so we capture the final side pot
  const levels = [...new Set([...allInAmounts, Math.max(...active.map((p) => p.totalBet))])];

  for (const level of levels) {
    const contribution = level - processedLevel;
    if (contribution <= 0) continue;

    const eligible = active.filter((p) => p.totalBet >= level);
    const potAmount = players.reduce((sum, p) => {
      const cap = Math.min(p.totalBet, level) - Math.min(p.totalBet, processedLevel);
      return sum + Math.max(0, cap);
    }, 0);

    if (potAmount > 0 && eligible.length > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayerIds: eligible.map((p) => p.id),
      });
    }

    processedLevel = level;
  }

  return pots;
}

// ─── Pot Award ────────────────────────────────────────────────────────────────

/**
 * Given side pots and winner IDs per pot,
 * return a map of playerId → chips won.
 *
 * winners: ordered array — winners[i] is the winner of pots[i].
 * In a tie, split equally (rounded down, remainder to the first winner).
 */
export function awardPots(
  pots: SidePot[],
  winnerIdPerPot: string[][]
): Record<string, number> {
  const awards: Record<string, number> = {};

  pots.forEach((pot, i) => {
    const winners = winnerIdPerPot[i] ?? [];
    if (winners.length === 0) return;

    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;

    winners.forEach((id, j) => {
      awards[id] = (awards[id] ?? 0) + share + (j === 0 ? remainder : 0);
    });
  });

  return awards;
}

// ─── Blind Posting ────────────────────────────────────────────────────────────

export const SMALL_BLIND = 10;
export const BIG_BLIND = 20;
export const MIN_RAISE = BIG_BLIND;

/**
 * Determine if a raise amount is valid.
 * A raise must be at least MIN_RAISE above the current bet.
 */
export function isValidRaise(
  raiseAmount: number,
  currentBet: number,
  playerChips: number
): boolean {
  return (
    raiseAmount >= MIN_RAISE &&
    raiseAmount + currentBet <= playerChips + currentBet
  );
}

/**
 * Compute the valid raise range for a player's slider.
 */
export function raiseRange(
  currentBet: number,
  pot: number,
  playerChips: number
): { min: number; max: number; suggested: number } {
  const min = MIN_RAISE;
  const max = playerChips;
  // Suggested: half-pot raise, rounded to nearest 10
  const suggested = Math.min(
    Math.max(Math.round((pot / 2) / 10) * 10, min),
    max
  );
  return { min, max, suggested };
}
