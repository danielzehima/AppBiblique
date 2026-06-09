/** Couleurs de surlignage, déclinées pour le mode clair et sombre. */
export const HIGHLIGHT_COLORS = [
  { key: 'amber', light: '#F6E0A8', dark: '#5A4A1E' },
  { key: 'sage', light: '#CFE3C4', dark: '#2E4327' },
  { key: 'sky', light: '#C4DCEF', dark: '#274055' },
  { key: 'rose', light: '#F0CBD3', dark: '#532833' },
  { key: 'terracotta', light: '#EFC9B4', dark: '#5A3727' },
] as const;

export type HighlightKey = (typeof HIGHLIGHT_COLORS)[number]['key'];

export function highlightColor(key: string | undefined, scheme: 'light' | 'dark'): string | null {
  if (!key) return null;
  const found = HIGHLIGHT_COLORS.find((c) => c.key === key);
  return found ? found[scheme] : null;
}
