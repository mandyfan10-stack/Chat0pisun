export const theme = {
  colors: {
    primary: '#0A7EA4',
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    text: '#11181C',
    textSecondary: '#687076',
    border: '#E5E8EB',
    error: '#FF3B30',
    white: '#FFFFFF',
    transparent: 'transparent',
    messageSent: '#DCF8C6',
    messageReceived: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const },
    h2: { fontSize: 24, fontWeight: 'bold' as const },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: 'normal' as const },
    caption: { fontSize: 12, fontWeight: 'normal' as const },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
};

export type Theme = typeof theme;
