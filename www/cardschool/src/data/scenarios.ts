import type { Scenario } from '@/types';

// ─── Daily Challenge Scenarios ────────────────────────────────────────────────
// Each scenario is a bite-sized decision drill (AC-03, F09).
// holeCards and boardCards use pokersolver notation (rank+suit: As, Td, 2h, 9c).

export const SCENARIOS: Scenario[] = [
  {
    id: 'sc-001',
    title: 'River Flush Decision',
    description:
      "You're on the river. You hold K♠ Q♠. The board shows A♠ 10♠ 3♥ 7♠ 2♣. " +
      "Your opponent makes a large bet. What do you do?",
    holeCards: ['Ks', 'Qs'],
    boardCards: ['As', 'Ts', '3h', '7s', '2c'],
    potSize: 400,
    opponentBet: 200,
    options: [
      { id: 'fold', label: 'Fold', isOptimal: false },
      { id: 'call', label: 'Call', isOptimal: true },
      { id: 'raise', label: 'Raise', isOptimal: false },
    ],
    correctOptionId: 'call',
    explanation:
      "You have a King-high flush (K♠ Q♠ A♠ 10♠ 7♠). That's an extremely strong hand — only an Ace-high flush beats you, which requires your opponent to hold two spades including the A♠ already on the board. Calling here is correct. Raising is also reasonable but call is safer.",
    xpReward: 30,
  },
  {
    id: 'sc-002',
    title: 'Pocket Aces Pre-Flop',
    description:
      "Pre-flop, you look down at A♥ A♦. An opponent raises to 3× the big blind. " +
      "Another player re-raises (3-bets). Action is on you. What do you do?",
    holeCards: ['Ah', 'Ad'],
    boardCards: [],
    potSize: 120,
    opponentBet: 60,
    options: [
      { id: 'fold', label: 'Fold', isOptimal: false },
      { id: 'call', label: 'Call', isOptimal: false },
      { id: 'raise', label: 'Raise', isOptimal: true },
    ],
    correctOptionId: 'raise',
    explanation:
      "Pocket Aces are the best starting hand in Hold'em. When facing a raise and re-raise, you should 4-bet (raise again) to build the pot and charge opponents to draw against your monster hand. Never just call with aces — make them pay.",
    xpReward: 30,
  },
  {
    id: 'sc-003',
    title: 'Scary Board Check-Raise',
    description:
      "You hold 9♠ 9♣. The flop comes K♥ Q♦ J♣ — three overcards to your pair. " +
      "You checked, your opponent bets large. What do you do?",
    holeCards: ['9s', '9c'],
    boardCards: ['Kh', 'Qd', 'Jc'],
    potSize: 100,
    opponentBet: 80,
    options: [
      { id: 'fold', label: 'Fold', isOptimal: true },
      { id: 'call', label: 'Call', isOptimal: false },
      { id: 'raise', label: 'Raise', isOptimal: false },
    ],
    correctOptionId: 'fold',
    explanation:
      "This board (K-Q-J) is very dangerous for pocket nines. Any opponent with a King, Queen, Jack, or a straight (A-10 or 10-9) is already beating you. A large bet here strongly suggests a strong hand. Folding preserves your chips for a better spot.",
    xpReward: 30,
  },
  {
    id: 'sc-004',
    title: 'Free Showdown Opportunity',
    description:
      "You're on the river with 7♣ 6♣. Board is K♠ 8♥ 5♦ 2♣ 3♠. " +
      "You have a straight! Your opponent checks to you. What do you do?",
    holeCards: ['7c', '6c'],
    boardCards: ['Ks', '8h', '5d', '2c', '3s'],
    potSize: 150,
    opponentBet: 0,
    options: [
      { id: 'check', label: 'Check', isOptimal: false },
      { id: 'raise', label: 'Raise', isOptimal: true },
      { id: 'fold', label: 'Fold', isOptimal: false },
    ],
    correctOptionId: 'raise',
    explanation:
      "You have a 7-high straight (3-4-5-6-7). That's a strong hand! When your opponent checks on the river, you should bet to extract value. Checking behind means you win nothing extra. Always bet your strong hands for value when opponents show weakness.",
    xpReward: 30,
  },
  {
    id: 'sc-005',
    title: 'Drawing Hand on the Turn',
    description:
      "You hold J♥ 10♥. Board: A♥ K♥ 5♣ 2♦. You have 4 cards to a Royal Flush. " +
      "Pot is 200, opponent bets 50. Do you call?",
    holeCards: ['Jh', 'Th'],
    boardCards: ['Ah', 'Kh', '5c', '2d'],
    potSize: 200,
    opponentBet: 50,
    options: [
      { id: 'fold', label: 'Fold', isOptimal: false },
      { id: 'call', label: 'Call', isOptimal: true },
      { id: 'raise', label: 'Raise', isOptimal: false },
    ],
    correctOptionId: 'call',
    explanation:
      "You're drawing to a Royal Flush (Q♥ completes it) or any heart for a regular flush. With 9 hearts remaining as outs, you have roughly a 20% chance of hitting on the river. The pot is giving you 5-to-1 odds on a 50-chip call — calling is profitable here.",
    xpReward: 40,
  },
];

// ─── Badges ───────────────────────────────────────────────────────────────────
export const BADGES = [
  { id: 'badge-first-lesson', title: 'First Steps', description: 'Completed your first lesson', icon: '🎓', unlockedBy: 'holdem-l1-basics' },
  { id: 'badge-hand-rankings', title: 'Hand Expert', description: 'Mastered hand rankings', icon: '👑', unlockedBy: 'holdem-l2-rankings' },
  { id: 'badge-betting', title: 'Sharp Bettor', description: 'Completed the Betting Actions lesson', icon: '🪙', unlockedBy: 'holdem-l3-betting' },
  { id: 'badge-first-win', title: 'First Blood', description: 'Won your first sandbox hand', icon: '🏆', unlockedBy: 'sandbox-first-win' },
  { id: 'badge-streak-3', title: 'On a Roll', description: '3-day challenge streak', icon: '🔥', unlockedBy: 'streak-3' },
  { id: 'badge-streak-7', title: 'Dedicated', description: '7-day challenge streak', icon: '⚡', unlockedBy: 'streak-7' },
  { id: 'badge-scenario-5', title: 'Scenario Shark', description: 'Completed 5 scenarios correctly', icon: '🦈', unlockedBy: 'scenarios-5' },
];
