export const colors = {
  // Chat0pisun espresso theme
  canvas: '#14110d',
  panel: '#1c1814',
  panel2: '#221d17',
  panel3: '#2a241c',
  rule: '#322a21',
  ink: '#f3ecd9',
  ink2: 'rgba(243,236,217,0.62)',
  ink3: 'rgba(243,236,217,0.32)',
  ink4: 'rgba(243,236,217,0.12)',
  accent: '#c5ff2e',
  warm: '#ff7a59',
  bubbleIn: '#221d17',
  bubbleOut: '#c5ff2e',
  bubbleOutInk: '#14110d',

  // Aliases for backward-compat with existing components
  primary: '#c5ff2e',
  primaryLight: '#c5ff2e',
  background: '#14110d',
  backgroundSecondary: '#1c1814',
  surface: '#1c1814',
  surfaceElevated: '#221d17',
  input: '#1c1814',
  text: '#f3ecd9',
  textSecondary: 'rgba(243,236,217,0.62)',
  textMuted: 'rgba(243,236,217,0.32)',
  border: '#322a21',
  error: '#ff7a59',
  success: '#c5ff2e',
  warning: '#ffb84d',
  white: '#f3ecd9',
  transparent: 'transparent',
  messageSent: '#c5ff2e',
  messageReceived: '#221d17',
};

export const fonts = {
  serif: 'serif', // Instrument Serif not available in RN without custom fonts; system serif
  mono: 'monospace',
  sans: 'System',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' as const },
  h2: { fontSize: 24, fontWeight: 'bold' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
};

export type Theme = typeof theme;
