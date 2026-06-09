/**
 * Préférences de lecture, persistées sur l'appareil (AsyncStorage).
 * Taille du texte, police, et thème (système / clair / sombre).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FontFamilyPref = 'serif' | 'sans';
export type ThemePref = 'system' | 'light' | 'dark';

/** Échelle de taille de police (multiplie les tailles de base). */
export const FONT_SCALES = [0.9, 1.0, 1.15, 1.3, 1.5] as const;
export const DEFAULT_SCALE_INDEX = 1;

type ReadingSettings = {
  scaleIndex: number;
  fontFamily: FontFamilyPref;
  themePref: ThemePref;
  increaseFont: () => void;
  decreaseFont: () => void;
  setFontFamily: (f: FontFamilyPref) => void;
  setThemePref: (t: ThemePref) => void;
};

export const useReadingSettings = create<ReadingSettings>()(
  persist(
    (set, get) => ({
      scaleIndex: DEFAULT_SCALE_INDEX,
      fontFamily: 'serif',
      themePref: 'system',
      increaseFont: () =>
        set({ scaleIndex: Math.min(FONT_SCALES.length - 1, get().scaleIndex + 1) }),
      decreaseFont: () => set({ scaleIndex: Math.max(0, get().scaleIndex - 1) }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setThemePref: (themePref) => set({ themePref }),
    }),
    {
      name: 'demeure-reading-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        scaleIndex: s.scaleIndex,
        fontFamily: s.fontFamily,
        themePref: s.themePref,
      }),
    },
  ),
);

/** Échelle courante (nombre) dérivée de l'index. */
export function useFontScale(): number {
  const idx = useReadingSettings((s) => s.scaleIndex);
  return FONT_SCALES[idx] ?? 1;
}
