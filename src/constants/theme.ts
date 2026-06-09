/**
 * Palette « Demeure » — ambiance chaleureuse et spirituelle.
 * Tons papier / sépia, couleur principale terre cuite.
 * Mode clair (papier) et mode sombre.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#3A2E25', // brun foncé (encre)
    textSecondary: '#7A6A59', // sépia atténué
    background: '#F5EFE6', // papier
    backgroundElement: '#EBE3D5', // carte
    backgroundSelected: '#E0D6C3',
    tint: '#C0683F', // terre cuite
    border: '#DDD2C0',
  },
  dark: {
    text: '#E8DECF', // crème
    textSecondary: '#A89784',
    background: '#1E1814', // brun très foncé
    backgroundElement: '#2A221C',
    backgroundSelected: '#3A2E25',
    tint: '#D98A5F', // terre cuite éclaircie (contraste sur fond sombre)
    border: '#3A2E25',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    /** Police de lecture par défaut (serif chaleureuse) */
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
