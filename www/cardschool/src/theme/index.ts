// ─── CardSchool Design System ────────────────────────────────────────────────
// All colors, typography, spacing, and shadow tokens in one place.
// Import from here — never hard-code hex values in components.

export const Colors = {
  // Backgrounds
  bgPrimary: '#1A3C2E',       // deep felt green
  bgSurface: '#0F2318',       // darker felt for cards/panels
  bgCard: '#F5F0E8',          // warm off-white card face
  bgCardBack: '#1A3A6E',      // card back blue

  // Accent
  gold: '#D4AF37',
  goldLight: '#F0D060',
  goldDark: '#A07820',

  // Semantic
  success: '#2ECC71',         // emerald — correct answer, win
  error: '#E74C3C',           // crimson — fold, wrong answer
  info: '#2980B9',            // call / neutral action
  warning: '#F39C12',

  // Text
  textPrimary: '#F0EDE8',     // soft white
  textSecondary: '#A89880',   // muted tan
  textDark: '#1A1A1A',        // on card face
  textRed: '#C0392B',         // red suit symbols

  // Suits
  suitRed: '#C0392B',
  suitBlack: '#1A1A1A',

  // UI chrome
  border: 'rgba(212,175,55,0.25)',
  borderStrong: '#D4AF37',
  overlay: 'rgba(0,0,0,0.65)',
  transparent: 'transparent',
} as const;

export const Typography = {
  // Font families — loaded via expo-font if using custom fonts,
  // falls back to system sans-serif for scaffold
  heading: {
    fontFamily: 'System',
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400' as const,
  },
  mono: {
    fontFamily: 'Courier',   // card ranks/suits
    fontWeight: '700' as const,
  },

  // Size scale
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 18,
  full: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  panel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
