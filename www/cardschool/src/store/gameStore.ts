import { create } from 'zustand';
import type {
  GameSession,
  Player,
  Card,
  BettingRound,
  PlayerAction,
  AIDifficulty,
  SidePot,
  HandAction,
  GameType,
} from '@/types';
import { createDeck, shuffleDeck } from '@/game/deck';
import { calculateSidePots } from '@/game/betting';

// ─── Constants ────────────────────────────────────────────────────────────────

const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const SANDBOX_START_CHIPS = 1_000;

const AI_NAMES = ['Dealer Dan', 'Lucky Luis', 'Poker Pete', 'Sharp Sam'];

// ─── Store Interface ──────────────────────────────────────────────────────────

interface GameState {
  session: GameSession | null;

  // Session lifecycle
  startSession: (opts: {
    game: GameType;
    mode: GameSession['mode'];
    difficulty: AIDifficulty;
    opponentCount: number;
    humanChips?: number;
  }) => void;
  resetSession: () => void;

  // Round lifecycle (called by game engine hooks)
  dealRound: () => void;
  advanceBettingRound: () => void;

  // Player actions
  recordAction: (action: PlayerAction, raiseAmount?: number) => void;

  // Internal mutations (used by game engine)
  setActivePlayerIndex: (idx: number) => void;
  setPlayerStatus: (playerId: string, status: Player['status']) => void;
  setCommunityCards: (cards: Card[]) => void;
  setPot: (amount: number) => void;
  setSidePots: (pots: SidePot[]) => void;
  setRound: (round: GameSession['round']) => void;
  markHandComplete: (winnerId: string, handName: string) => void;
  updatePlayerChips: (playerId: string, chips: number) => void;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function makePlayer(
  id: string,
  name: string,
  chips: number,
  isHuman: boolean,
  style: Player['style'] = 'balanced'
): Player {
  return {
    id,
    name,
    isHuman,
    chips,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    acted: false,
    status: '',
    style,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()((set, get) => ({
  session: null,

  // ── Session Lifecycle ───────────────────────────────────────────────────────

  startSession: ({ game, mode, difficulty, opponentCount, humanChips }) => {
    const styles: Player['style'][] = ['passive', 'balanced', 'aggressive'];
    const opponents = Array.from({ length: opponentCount }, (_, i) =>
      makePlayer(`ai-${i}`, AI_NAMES[i] ?? `Player ${i + 2}`, 800, false, styles[i % 3])
    );

    const session: GameSession = {
      id: `session-${Date.now()}`,
      game,
      mode,
      difficulty,
      players: [
        makePlayer('human', 'You', humanChips ?? SANDBOX_START_CHIPS, true),
        ...opponents,
      ],
      deck: [],
      community: [],
      pot: 0,
      sidePots: [],
      currentBet: 0,
      round: 'pre-flop',
      activePlayerIndex: 0,
      dealerIndex: 0,
      handNumber: 1,
      actions: [],
      isComplete: false,
    };

    set({ session });
  },

  resetSession: () => set({ session: null }),

  // ── Round Deal ──────────────────────────────────────────────────────────────

  dealRound: () => {
    const { session } = get();
    if (!session) return;

    const deck = shuffleDeck(createDeck());
    const players = session.players.map((p) => ({
      ...p,
      hand: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      acted: false,
      status: '' as Player['status'],
    }));

    // Deal 2 hole cards per player for Hold'em
    const holeCount = session.game === 'holdem' ? 2 : 2;
    for (let i = 0; i < holeCount; i++) {
      players.forEach((p) => {
        const card = deck.pop()!;
        card.faceUp = p.isHuman; // Human sees own cards; AI cards stay face-down
        p.hand.push(card);
      });
    }

    // Post blinds
    const sbIdx = (session.dealerIndex + 1) % players.length;
    const bbIdx = (session.dealerIndex + 2) % players.length;
    postBlind(players[sbIdx], SMALL_BLIND);
    postBlind(players[bbIdx], BIG_BLIND);

    // First to act pre-flop is UTG (one after BB)
    const utgIdx = (bbIdx + 1) % players.length;

    set({
      session: {
        ...session,
        deck,
        players,
        community: [],
        pot: SMALL_BLIND + BIG_BLIND,
        sidePots: [],
        currentBet: BIG_BLIND,
        round: 'pre-flop',
        activePlayerIndex: utgIdx,
        actions: [],
        isComplete: false,
        winnerId: undefined,
        winningHandName: undefined,
      },
    });
  },

  // ── Betting Round Advance ───────────────────────────────────────────────────

  advanceBettingRound: () => {
    const { session } = get();
    if (!session) return;

    const roundOrder: BettingRound[] = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
    const currentIdx = roundOrder.indexOf(session.round as BettingRound);
    const nextRound = roundOrder[currentIdx + 1] ?? 'showdown';

    let community = [...session.community];
    let deck = [...session.deck];

    if (nextRound === 'flop') {
      deck.pop(); // burn
      community = [deck.pop()!, deck.pop()!, deck.pop()!].map((c) => ({
        ...c,
        faceUp: true,
      }));
      deck = deck; // already mutated via pop
    } else if (nextRound === 'turn' || nextRound === 'river') {
      deck.pop(); // burn
      const card = { ...deck.pop()!, faceUp: true };
      community = [...community, card];
    }

    // Reset per-round bet tracking
    const players = session.players.map((p) => ({ ...p, bet: 0, acted: false }));

    // First active player after dealer
    let firstAct = (session.dealerIndex + 1) % players.length;
    while (players[firstAct].folded || players[firstAct].allIn) {
      firstAct = (firstAct + 1) % players.length;
    }

    set({
      session: {
        ...session,
        deck,
        community,
        players,
        round: nextRound,
        currentBet: 0,
        activePlayerIndex: firstAct,
      },
    });
  },

  // ── Player Action ───────────────────────────────────────────────────────────

  recordAction: (action, raiseAmount = 0) => {
    const { session } = get();
    if (!session) return;

    const players = [...session.players];
    const p = { ...players[session.activePlayerIndex] };
    let pot = session.pot;
    let currentBet = session.currentBet;

    const logEntry: HandAction = {
      playerId: p.id,
      action,
      amount: 0,
      round: session.round as BettingRound,
      timestamp: Date.now(),
    };

    switch (action) {
      case 'fold':
        p.folded = true;
        p.status = 'fold';
        break;

      case 'check':
        p.status = 'check';
        break;

      case 'call': {
        const callAmt = Math.min(currentBet - p.bet, p.chips);
        p.chips -= callAmt;
        p.bet += callAmt;
        p.totalBet += callAmt;
        pot += callAmt;
        if (p.chips === 0) p.allIn = true;
        p.status = 'call';
        logEntry.amount = callAmt;
        break;
      }

      case 'raise': {
        const totalRaise = currentBet + raiseAmount;
        const diff = Math.min(totalRaise - p.bet, p.chips);
        p.chips -= diff;
        p.bet += diff;
        p.totalBet += diff;
        pot += diff;
        currentBet = p.bet;
        if (p.chips === 0) p.allIn = true;
        p.status = 'raise';
        logEntry.amount = diff;
        // Reset acted flag so others must respond to the raise
        players.forEach((pl, i) => {
          if (i !== session.activePlayerIndex && !pl.folded) {
            players[i] = { ...pl, acted: false };
          }
        });
        break;
      }

      case 'all-in': {
        const allInAmt = p.chips;
        p.totalBet += allInAmt;
        p.bet += allInAmt;
        if (p.bet > currentBet) currentBet = p.bet;
        pot += allInAmt;
        p.chips = 0;
        p.allIn = true;
        p.status = 'all-in';
        logEntry.amount = allInAmt;
        break;
      }
    }

    p.acted = true;
    players[session.activePlayerIndex] = p;

    const sidePots = calculateSidePots(players);

    set({
      session: {
        ...session,
        players,
        pot,
        sidePots,
        currentBet,
        actions: [...session.actions, logEntry],
      },
    });
  },

  // ── Granular Setters (used by game engine hooks) ──────────────────────────

  setActivePlayerIndex: (idx) =>
    set((s) => ({ session: s.session ? { ...s.session, activePlayerIndex: idx } : null })),

  setPlayerStatus: (playerId, status) =>
    set((s) => {
      if (!s.session) return {};
      return {
        session: {
          ...s.session,
          players: s.session.players.map((p) =>
            p.id === playerId ? { ...p, status } : p
          ),
        },
      };
    }),

  setCommunityCards: (cards) =>
    set((s) => ({ session: s.session ? { ...s.session, community: cards } : null })),

  setPot: (amount) =>
    set((s) => ({ session: s.session ? { ...s.session, pot: amount } : null })),

  setSidePots: (pots) =>
    set((s) => ({ session: s.session ? { ...s.session, sidePots: pots } : null })),

  setRound: (round) =>
    set((s) => ({ session: s.session ? { ...s.session, round } : null })),

  markHandComplete: (winnerId, handName) =>
    set((s) => ({
      session: s.session
        ? { ...s.session, isComplete: true, winnerId, winningHandName: handName }
        : null,
    })),

  updatePlayerChips: (playerId, chips) =>
    set((s) => {
      if (!s.session) return {};
      return {
        session: {
          ...s.session,
          players: s.session.players.map((p) =>
            p.id === playerId ? { ...p, chips } : p
          ),
        },
      };
    }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function postBlind(player: Player, amount: number) {
  const actual = Math.min(amount, player.chips);
  player.chips -= actual;
  player.bet = actual;
  player.totalBet = actual;
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectSession = (s: GameState) => s.session;
export const selectPlayers = (s: GameState) => s.session?.players ?? [];
export const selectHumanPlayer = (s: GameState) =>
  s.session?.players.find((p) => p.isHuman) ?? null;
export const selectCommunity = (s: GameState) => s.session?.community ?? [];
export const selectPot = (s: GameState) => s.session?.pot ?? 0;
export const selectActivePlayer = (s: GameState) =>
  s.session ? s.session.players[s.session.activePlayerIndex] : null;
export const selectRound = (s: GameState) => s.session?.round ?? 'pre-flop';
export const selectIsComplete = (s: GameState) => s.session?.isComplete ?? false;
