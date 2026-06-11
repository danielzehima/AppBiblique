/** Préférences du rappel de lecture quotidien, persistées. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type NotifSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  setEnabled: (v: boolean) => void;
  setTime: (hour: number, minute: number) => void;
};

export const useNotifSettings = create<NotifSettings>()(
  persist(
    (set) => ({
      enabled: false,
      hour: 8,
      minute: 0,
      setEnabled: (enabled) => set({ enabled }),
      setTime: (hour, minute) => set({ hour, minute }),
    }),
    {
      name: 'demeure-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
