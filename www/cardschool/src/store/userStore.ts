import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserSettings } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 200; // XP needed to advance one level

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  cardStyle: 'classic',
  aiDifficulty: 'beginner',
};

const GUEST_USER: User = {
  id: 'guest',
  isGuest: true,
  displayName: 'Guest Player',
  xp: 0,
  level: 1,
  currentStreak: 0,
  lastActiveDate: '',
  completedLessons: [],
  earnedBadges: [],
  settings: DEFAULT_SETTINGS,
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface UserState {
  user: User | null;
  _hydrated: boolean; // true after AsyncStorage rehydration

  // Auth
  initGuest: () => void;
  setUser: (user: User) => void;
  clearUser: () => void;

  // Progress
  addXP: (amount: number) => { leveledUp: boolean; newLevel: number };
  completeLesson: (lessonId: string) => void;
  unlockBadge: (badgeId: string) => void;
  updateStreak: () => void;

  // Settings
  updateSettings: (patch: Partial<UserSettings>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      _hydrated: false,

      // ── Auth ───────────────────────────────────────────────────────────────

      initGuest: () => {
        set({ user: { ...GUEST_USER, id: `guest-${Date.now()}` } });
      },

      setUser: (user) => set({ user }),

      clearUser: () => set({ user: null }),

      // ── Progress ───────────────────────────────────────────────────────────

      addXP: (amount) => {
        const { user } = get();
        if (!user) return { leveledUp: false, newLevel: 1 };

        const newXP = user.xp + amount;
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
        const leveledUp = newLevel > user.level;

        set({ user: { ...user, xp: newXP, level: newLevel } });
        return { leveledUp, newLevel };
      },

      completeLesson: (lessonId) => {
        const { user } = get();
        if (!user) return;
        if (user.completedLessons.includes(lessonId)) return;
        set({
          user: {
            ...user,
            completedLessons: [...user.completedLessons, lessonId],
          },
        });
      },

      unlockBadge: (badgeId) => {
        const { user } = get();
        if (!user) return;
        if (user.earnedBadges.includes(badgeId)) return;
        set({
          user: {
            ...user,
            earnedBadges: [...user.earnedBadges, badgeId],
          },
        });
      },

      updateStreak: () => {
        const { user } = get();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const last = user.lastActiveDate;

        if (last === today) return; // already counted today

        const yesterday = new Date(Date.now() - 86_400_000)
          .toISOString()
          .split('T')[0];

        const newStreak = last === yesterday ? user.currentStreak + 1 : 1;

        set({
          user: {
            ...user,
            currentStreak: newStreak,
            lastActiveDate: today,
          },
        });
      },

      // ── Settings ──────────────────────────────────────────────────────────

      updateSettings: (patch) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            settings: { ...user.settings, ...patch },
          },
        });
      },
    }),

    {
      name: 'cardschool-user',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist User — never game session state
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);

// ─── Derived Selectors ────────────────────────────────────────────────────────
// Use these in components: useUserStore(selectXP) vs full store subscription

export const selectUser = (s: UserState) => s.user;
export const selectXP = (s: UserState) => s.user?.xp ?? 0;
export const selectLevel = (s: UserState) => s.user?.level ?? 1;
export const selectStreak = (s: UserState) => s.user?.currentStreak ?? 0;
export const selectSettings = (s: UserState) => s.user?.settings ?? DEFAULT_SETTINGS;
export const selectCompletedLessons = (s: UserState) => s.user?.completedLessons ?? [];
export const selectIsLessonDone = (lessonId: string) => (s: UserState) =>
  s.user?.completedLessons.includes(lessonId) ?? false;
