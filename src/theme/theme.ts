// Mirrors JlmushIITMfrontend/src/theme/theme.js palette so the patient app
// reads as the same product family as the website.
export const colors = {
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  secondary: '#26a69a',
  secondaryLight: '#4db6ac',
  secondaryDark: '#00897b',
  success: '#4caf50',
  warning: '#E8833A',
  warningLight: '#FFF3E8',
  warningDark: '#D4702E',
  error: '#f44336',
  background: '#f5f5f5',
  surface: '#ffffff',
  border: '#e6e8eb',
  textPrimary: '#1a2332',
  textSecondary: '#5f6b7a',
  textMuted: '#95a1ae',
  white: '#ffffff',
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textPrimary },
  bodyMuted: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary },
};

export const shadow = {
  card: {
    shadowColor: '#0f1b2d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};
