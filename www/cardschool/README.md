# CardSchool — Expo Project Scaffold

**Learn card games interactively.** Built to the CardSchool V1 PRD.

---

## Quick Start

```bash
# 1. Install dependencies
cd cardschool
npm install

# 2. Start Expo dev server
npx expo start

# 3. Open on device
# iOS Simulator: press i
# Android Emulator: press a
# Physical device: scan QR with Expo Go (or your dev client)
```

> **Note:** Reanimated 3 requires a custom dev client for full animation support.
> Run `npx expo install expo-dev-client` and build with EAS if needed.

---

## Project Structure

```
cardschool/
├── App.tsx                         # Entry point — nav + splash
├── app.json                        # Expo config
├── package.json                    # All dependencies
├── tsconfig.json                   # TypeScript config (paths: @/* → src/*)
├── babel.config.js                 # Babel (Reanimated plugin last)
│
└── src/
    ├── types/index.ts              # All TypeScript interfaces
    ├── theme/index.ts              # Colors, typography, spacing tokens
    │
    ├── data/
    │   ├── lessons.ts              # Lesson content + glossary (Texas Hold'em)
    │   └── scenarios.ts           # Daily challenge scenarios + badges
    │
    ├── store/
    │   ├── userStore.ts            # Zustand — user XP, streak, settings (persisted)
    │   └── gameStore.ts            # Zustand — live game session (not persisted)
    │
    ├── game/
    │   ├── deck.ts                 # createDeck(), shuffleDeck(), card notation helpers
    │   ├── handEvaluator.ts        # pokersolver wrapper + fallback evaluator
    │   ├── ai.ts                   # Beginner/Intermediate AI + coach tip generator
    │   └── betting.ts              # Side-pot calculation, raise range helpers
    │
    ├── navigation/
    │   ├── AppNavigator.tsx        # Root stack (Welcome → MainTabs → Lesson/Sandbox/etc)
    │   └── TabNavigator.tsx        # Bottom tab bar (Home, Learn, Practice, Daily, Profile)
    │
    └── screens/
        ├── WelcomeScreen.tsx       # Guest / Sign-up (F17, F18)
        ├── SkillCheckScreen.tsx    # 3-question onboarding skill check (Flow 4.1)
        ├── HomeScreen.tsx          # Hub — XP bar, continue CTA, quick play (F13)
        ├── LessonListScreen.tsx    # Course overview with lock/unlock (F01)
        ├── LessonScreen.tsx        # Swipeable lesson cards + glossary tooltips (F01, AC-01)
        ├── QuizScreen.tsx          # Knowledge check, ≥70% to pass (F04, AC-01-4)
        ├── SandboxSetupScreen.tsx  # Choose opponents + difficulty (AC-03-1)
        ├── SandboxScreen.tsx       # Live Texas Hold'em vs AI (F08, AC-03)
        ├── ScenarioScreen.tsx      # Daily decision drill (F09, AC-02 Flow 4.3)
        ├── ProfileScreen.tsx       # XP, badges, settings (F13, F14, F20)
        └── BadgeUnlockScreen.tsx   # Celebration modal (F14)
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| State management | Zustand | Minimal boilerplate, surgical subscriptions, persist middleware |
| User state | AsyncStorage persist | No backend needed for V1 solo play |
| Game state | In-memory only | Don't persist mid-hand state (avoids corruption bugs) |
| Hand evaluation | `pokersolver` + fallback | Handles all 10 hand ranks; fallback enables offline dev |
| AI difficulty | Rule-based profiles | No ML needed; `mistakeRate` keeps Beginner beatable |
| Animations | Reanimated 3 | UI-thread animations don't block AI computation |

---

## Coin System

| Mode | Chips |
|---|---|
| Tutorial / Guided Hand | Unlimited (learning context) |
| Sandbox (Real Game) | 1,000 starting chips |
| Sandbox XP award | +25 XP per hand won |

---

## Adding Content

### New Lesson
Add to `src/data/lessons.ts` — `HOLDEM_LESSONS` array. Set `prerequisiteIds` to gate it behind earlier lessons.

### New Scenario
Add to `src/data/scenarios.ts` — `SCENARIOS` array. Daily scenario rotates by `Math.floor(Date.now() / 86_400_000) % SCENARIOS.length`.

### New Badge
Add to `BADGES` in `src/data/scenarios.ts`. Award it by calling `useUserStore.getState().unlockBadge(badgeId)` at the right event.

---

## PRD Feature Coverage

| PRD Feature | Status | Screen / File |
|---|---|---|
| F01 Interactive lessons | ✅ | LessonScreen, LessonListScreen |
| F02 Guided practice hand | ✅ | SandboxScreen (coach tips via ai.ts) |
| F03 Hand ranking reference | ✅ | handEvaluator.ts `HAND_RANK_DISPLAY` |
| F04 Quiz / knowledge check | ✅ | QuizScreen |
| F08 Solo sandbox vs AI | ✅ | SandboxScreen |
| F09 Scenario challenges | ✅ | ScenarioScreen |
| F11 AI difficulty levels | ✅ | ai.ts `PROFILES` (beginner/intermediate) |
| F13 XP + level system | ✅ | userStore.ts `addXP()` |
| F14 Lesson completion badges | ✅ | BadgeUnlockScreen, scenarios.ts |
| F15 Daily streak | ✅ | userStore.ts `updateStreak()` |
| F17 Guest mode | ✅ | WelcomeScreen `initGuest()` |
| F20 Sound / haptics toggle | ✅ | ProfileScreen → userStore settings |
| AC-01 Lesson acceptance criteria | ✅ | LessonScreen (progress dots, glossary, resume) |
| AC-02 Practice hand criteria | ✅ | SandboxScreen + ai.ts coach tips |
| AC-03 Sandbox acceptance criteria | ✅ | SandboxSetupScreen + SandboxScreen |

---

## Open Questions Remaining (PRD §8)

- **Q1** Platform: Currently Expo (cross-platform). iOS-only would remove Android build step.
- **Q2** Blackjack unlock: Not implemented — add `prerequisiteIds` gate on Blackjack lessons.
- **Q3** Backend: V1 uses AsyncStorage only. Add Supabase adapter in `userStore.ts` persist config for V2.
- **Q4** Monetisation: No paywall implemented. Add RevenueCat in V1.5.
- **Q5** Dealer mascot: Placeholder — add `<Image>` to `CoachTip` component when asset is ready.

---

## V2 Roadmap Hooks

- `src/game/handEvaluator.ts` — `bestOmahaHand()` stub ready for Omaha support
- `src/store/gameStore.ts` — `sidePots` array computed on every action (ready for all-in scenarios)
- `src/types/index.ts` — `GameType` union ready to extend with `'blackjack' | 'omaha'`
- Supabase: add `createClient()` and swap `AsyncStorage` in `userStore` persist config
