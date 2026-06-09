/**
 * Renvoie la palette de couleurs effective (clair/sombre) selon la préférence.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useResolvedScheme } from '@/hooks/use-resolved-scheme';

export function useTheme() {
  const scheme = useResolvedScheme();
  return Colors[scheme];
}
