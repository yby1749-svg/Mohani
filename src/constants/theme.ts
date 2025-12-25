// Dark Theme Colors (Default)
export const DarkColors = {
  // Core Colors
  bgPrimary: '#0a0a0f',
  bgSecondary: '#12121a',
  bgCard: 'rgba(20, 20, 35, 0.7)',
  bgCardSolid: '#14141f',

  // Neon Accents - from logo
  purplePrimary: '#7c3aed',
  purpleSecondary: '#8b5cf6',
  purpleLight: '#a78bfa',
  purpleGlow: 'rgba(124, 58, 237, 0.5)',
  purpleDark: 'rgba(124, 58, 237, 0.2)',

  goldPrimary: '#f59e0b',
  goldSecondary: '#fbbf24',
  goldLight: '#fcd34d',
  goldGlow: 'rgba(245, 158, 11, 0.5)',
  goldDark: 'rgba(245, 158, 11, 0.2)',

  // Status Colors
  success: '#22c55e',
  successDark: 'rgba(34, 197, 94, 0.2)',
  error: '#ef4444',
  errorDark: 'rgba(239, 68, 68, 0.2)',
  warning: '#f59e0b',

  // Text Colors
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.4)',

  // Border
  border: 'rgba(255, 255, 255, 0.1)',
  borderPurple: 'rgba(124, 58, 237, 0.3)',
  borderGold: 'rgba(245, 158, 11, 0.3)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Aliases for convenience
  text: '#ffffff',
  primary: '#7c3aed',
};

// Light Theme Colors - Professional clean design
export const LightColors = {
  // Core Colors - Clean white/gray palette
  bgPrimary: '#f5f5f7',
  bgSecondary: '#ffffff',
  bgCard: 'rgba(255, 255, 255, 0.95)',
  bgCardSolid: '#ffffff',

  // Accent Colors - Refined for light mode
  purplePrimary: '#6d28d9',
  purpleSecondary: '#7c3aed',
  purpleLight: '#8b5cf6',
  purpleGlow: 'rgba(109, 40, 217, 0.15)',
  purpleDark: 'rgba(109, 40, 217, 0.08)',

  goldPrimary: '#b45309',
  goldSecondary: '#d97706',
  goldLight: '#f59e0b',
  goldGlow: 'rgba(180, 83, 9, 0.15)',
  goldDark: 'rgba(180, 83, 9, 0.08)',

  // Status Colors - Vibrant for light backgrounds
  success: '#059669',
  successDark: 'rgba(5, 150, 105, 0.1)',
  error: '#dc2626',
  errorDark: 'rgba(220, 38, 38, 0.1)',
  warning: '#d97706',

  // Text Colors - High contrast for readability
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',

  // Border - Subtle but visible
  border: 'rgba(0, 0, 0, 0.08)',
  borderPurple: 'rgba(109, 40, 217, 0.25)',
  borderGold: 'rgba(180, 83, 9, 0.25)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Aliases for convenience
  text: '#111827',
  primary: '#6d28d9',
};

// Default export (dark mode for backward compatibility)
export const Colors = DarkColors;

export const Gradients = {
  primary: ['#7c3aed', '#a78bfa'] as [string, string],
  purple: ['#7c3aed', '#a78bfa'],
  gold: ['#f59e0b', '#fcd34d'],
  mixed: ['#7c3aed', '#f59e0b'],
  glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
  cardPurple: ['rgba(124, 58, 237, 0.2)', 'rgba(139, 92, 246, 0.1)'],
  cardGold: ['rgba(245, 158, 11, 0.1)', 'rgba(251, 191, 36, 0.05)'],
};

// Light mode gradients - subtle and professional
export const LightGradients = {
  primary: ['#6d28d9', '#8b5cf6'] as [string, string],
  purple: ['#6d28d9', '#8b5cf6'],
  gold: ['#b45309', '#f59e0b'],
  mixed: ['#6d28d9', '#b45309'],
  glass: ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)'],
  cardPurple: ['rgba(109, 40, 217, 0.08)', 'rgba(139, 92, 246, 0.04)'],
  cardGold: ['rgba(180, 83, 9, 0.08)', 'rgba(245, 158, 11, 0.04)'],
  cardWhite: ['#ffffff', '#fafafa'],
  cardIncome: ['rgba(5, 150, 105, 0.08)', 'rgba(16, 185, 129, 0.04)'],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  hero: 32,
  giant: 48,
};

export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  glowPurple: {
    shadowColor: Colors.purplePrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowGold: {
    shadowColor: Colors.goldPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Light mode shadows - softer, more subtle
export const LightShadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  glowPurple: {
    shadowColor: LightColors.purplePrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  glowGold: {
    shadowColor: LightColors.goldPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
};
