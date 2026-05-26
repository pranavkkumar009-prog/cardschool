// ─── CardSchool — Core TypeScript Interfaces ─────────────────────────────────

// ── Cards ─────────────────────────────────────────────────────────────────────

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type Suit = '♠' | '♥' | '♦' | '♣';
export type SuitCode = 's' | 'h' | 'd' | 'c'; // for pokersolver

export interface Card {
  id: string;        // e.g. "As", "Td", "2h" — stable key for animations
  rank: Rank;
  suit: Suit;
  suitCode: SuitCode;
  value: number;     // 2–14 (Ace = 14)
  faceUp: boolean;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  cardStyle: 'classic' | 'minimal';
  aiDifficulty: AIDifficulty;
}

export interface User {
  id: string;
  isGuest: boolean;
  displayName: string;
  xp: number;
  level: number;
  currentStreak: number;
  lastActiveDate: string;       // ISO date string — for streak tracking
  completedLessons: string[];   // lesson ids
  earnedBadges: string[];       // badge ids
  settings: UserSettings;
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export interface LessonCard {
  id: string;
  type: 'text' | 'image' | 'hand-ranking' | 'interactive';
  title?: string;
  body: string;                 // markdown-lite text content
  imageKey?: string;            // asset key for illustrations
  highlightedTerms?: string[];  // terms that show glossary tooltip on tap
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'drag-to-rank';
  prompt: string;
  options: string[];
  correctIndex: number;         // for multiple-choice
  correctOrder?: string[];      // for drag-to-rank
  explanation: string;          // shown after answering
}

export interface Lesson {
  id: string;
  game: GameType;
  title: string;
  subtitle: string;
  icon: string;                 // emoji
  xpReward: number;
  badgeId?: string;             // badge unlocked on completion
  prerequisiteIds: string[];    // lesson ids that must be done first
  cards: LessonCard[];
  quizQuestions: QuizQuestion[];
}

// ── Game Session ──────────────────────────────────────────────────────────────

export type GameType = 'holdem' | 'blackjack';
export type AIDifficulty = 'beginner' | 'intermediate';
export type BettingRound = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  chips: number;
  hand: Card[];
  bet: number;           // chips committed this betting round
  totalBet: number;      // chips committed this hand (for side-pot calc)
  folded: boolean;
  allIn: boolean;
  acted: boolean;        // has acted in current betting round
  status: PlayerAction | 'thinking' | '';
  style: AIStyle;        // ignored for human player
}

export type AIStyle = 'passive' | 'balanced' | 'aggressive';

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface HandAction {
  playerId: string;
  action: PlayerAction;
  amount: number;
  round: BettingRound;
  timestamp: number;
}

export interface GameSession {
  id: string;
  game: GameType;
  mode: 'sandbox' | 'guided' | 'scenario';
  difficulty: AIDifficulty;
  players: Player[];
  deck: Card[];
  community: Card[];    // Hold'em community cards
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  round: BettingRound | 'draw' | 'post-draw' | string;
  activePlayerIndex: number;
  dealerIndex: number;
  handNumber: number;
  actions: HandAction[];  // full action log for post-hand breakdown
  isComplete: boolean;
  winnerId?: string;
  winningHandName?: string;
}

// ── Scenarios (Daily Drills) ──────────────────────────────────────────────────

export interface Scenario {
  id: string;
  title: string;
  description: string;          // "You're on the river. You hold K♠ Q♠..."
  holeCards: [string, string];  // pokersolver notation e.g. ["Ks", "Qs"]
  boardCards: string[];         // up to 5
  potSize: number;
  opponentBet: number;
  options: ScenarioOption[];
  correctOptionId: string;
  explanation: string;
  xpReward: number;
}

export interface ScenarioOption {
  id: string;
  label: 'Fold' | 'Call' | 'Raise' | 'Check' | 'All-In';
  isOptimal: boolean;
}

// ── Badges ────────────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;    // emoji
  unlockedBy: string;  // lesson id or 'streak-7' etc.
}

// ── Navigation ────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Welcome: undefined;
  SkillCheck: { game: GameType };
  MainTabs: undefined;
  Lesson: { lessonId: string };
  Quiz: { lessonId: string };
  SandboxSetup: undefined;
  Sandbox: { difficulty: AIDifficulty; opponentCount: number };
  GuidedHand: { lessonId?: string };
  Scenario: undefined;
  BadgeUnlock: { badgeId: string };
};

export type TabParamList = {
  Home: undefined;
  Learn: undefined;
  Practice: undefined;
  Challenges: undefined;
  Profile: undefined;
};
