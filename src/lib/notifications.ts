/**
 * Notifications locales — rappel de lecture quotidien.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Nouveau canal (un canal Android est immuable une fois créé : changer de
// réglages = nouveau canal). Son activé + importance haute.
const CHANNEL_ID = 'reading-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Demande la permission de notifier. Renvoie true si accordée. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappels de lecture',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });
  }
}

/** (Re)programme le rappel quotidien à l'heure donnée. */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Demeure',
      body: 'C’est le moment de ta lecture du jour 🕊️',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Notification de test, déclenchée ~10 s plus tard (diagnostic). */
export async function sendTestNotification(): Promise<void> {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Demeure',
      body: 'Notification de test ✅ — tout fonctionne !',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: CHANNEL_ID,
    },
  });
}
