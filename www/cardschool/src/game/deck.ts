import type { Card, Rank, Suit, SuitCode } from '@/types';

// ─── Deck Factory ─────────────────────────────────────────────────────────────

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const SUIT_CODES: Record<Suit, SuitCode> = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

// pokersolver rank notation: T for 10
const SOLVER_RANK: Record<Rank, string> = {
  '2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8',
  '9':'9','10':'T','J':'J','Q':'Q','K':'K','A':'A',
};

/** Create a fresh, unshuffled 52-card deck */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const suitCode = SUIT_CODES[suit];
      deck.push({
        id: `${SOLVER_RANK[rank]}${suitCode}`,   // e.g. "As", "Td", "2h"
        rank,
        suit,
        suitCode,
        value: RANK_VALUES[rank],
        faceUp: false,
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates in-place shuffle.
 * Pass a seeded RNG function for reproducible test hands.
 */
export function shuffleDeck(deck: Card[], rng: () => number = Math.random): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/** Convert a Card to pokersolver notation (e.g. "As", "Td") */
export function toSolverNotation(card: Card): string {
  return card.id;
}

/** Parse pokersolver notation back to a Card (used in scenario setup) */
export function fromSolverNotation(notation: string): Card {
  const solverRankToRank: Record<string, Rank> = {
    '2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8',
    '9':'9','T':'10','J':'J','Q':'Q','K':'K','A':'A',
  };
  const codeToSuit: Record<string, Suit> = { s:'♠', h:'♥', d:'♦', c:'♣' };

  const rankChar = notation.slice(0, -1);
  const suitChar = notation.slice(-1);
  const rank = solverRankToRank[rankChar];
  const suit = codeToSuit[suitChar] as Suit;

  return {
    id: notation,
    rank,
    suit,
    suitCode: suitChar as SuitCode,
    value: RANK_VALUES[rank],
    faceUp: true,
  };
}

/** Is a suit red (hearts / diamonds)? */
export function isRedSuit(suit: Suit): boolean {
  return suit === '♥' || suit === '♦';
}
