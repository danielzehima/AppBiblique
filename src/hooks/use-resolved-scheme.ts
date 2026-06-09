import { useColorScheme } from 'react-native';

import { useReadingSettings } from '@/store/reading-settings';

/** Schéma de couleurs effectif, en tenant compte de la préférence utilisateur. */
export function useResolvedScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const pref = useReadingSettings((s) => s.themePref);
  if (pref === 'light' || pref === 'dark') return pref;
  return system === 'dark' ? 'dark' : 'light';
}
