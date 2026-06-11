import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  cancelDailyReminder,
  ensureNotificationPermission,
  scheduleDailyReminder,
  sendTestNotification,
} from '@/lib/notifications';
import { useNotifSettings } from '@/store/notifications';

const pad = (n: number) => String(n).padStart(2, '0');

export function NotificationControls() {
  const theme = useTheme();
  const { enabled, hour, minute, setEnabled, setTime } = useNotifSettings();

  const toggle = async (value: boolean) => {
    if (value) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(
          'Notifications désactivées',
          'Autorise les notifications pour Demeure dans les paramètres de ton téléphone.',
        );
        return;
      }
      await scheduleDailyReminder(hour, minute);
      setEnabled(true);
    } else {
      await cancelDailyReminder();
      setEnabled(false);
    }
  };

  const changeHour = (delta: number) => {
    const h = (hour + delta + 24) % 24;
    setTime(h, minute);
    if (enabled) scheduleDailyReminder(h, minute).catch(() => {});
  };
  const changeMinute = (delta: number) => {
    const m = (minute + delta + 60) % 60;
    setTime(hour, m);
    if (enabled) scheduleDailyReminder(hour, m).catch(() => {});
  };

  const test = async () => {
    const ok = await ensureNotificationPermission();
    if (!ok) {
      Alert.alert('Notifications désactivées', 'Autorise les notifications pour Demeure.');
      return;
    }
    await sendTestNotification();
    Alert.alert('Test envoyé', 'Ferme l’app : une notification doit arriver dans ~10 secondes.');
  };

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">Rappel de lecture quotidien</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Une notification chaque jour pour lire la Bible
          </ThemedText>
        </View>
        <Switch
          value={enabled}
          onValueChange={toggle}
          trackColor={{ true: theme.tint, false: theme.border }}
          thumbColor="#FFFFFF"
        />
      </View>

      {enabled && (
        <View style={[styles.timeBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <ThemedText themeColor="textSecondary" type="small">
            Chaque jour à
          </ThemedText>
          <View style={styles.timeRow}>
            <Stepper label={pad(hour)} onMinus={() => changeHour(-1)} onPlus={() => changeHour(1)} theme={theme} />
            <ThemedText style={styles.colon}>:</ThemedText>
            <Stepper label={pad(minute)} onMinus={() => changeMinute(-5)} onPlus={() => changeMinute(5)} theme={theme} />
          </View>
        </View>
      )}

      <Pressable onPress={test} style={[styles.testBtn, { borderColor: theme.tint }]}>
        <Ionicons name="notifications-outline" size={16} color={theme.tint} />
        <ThemedText themeColor="tint" type="smallBold">Tester (dans 10 s)</ThemedText>
      </Pressable>
    </View>
  );
}

function Stepper({
  label,
  onMinus,
  onPlus,
  theme,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} hitSlop={6} style={[styles.stepBtn, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="chevron-down" size={18} color={theme.text} />
      </Pressable>
      <ThemedText style={styles.timeValue}>{label}</ThemedText>
      <Pressable onPress={onPlus} hitSlop={6} style={[styles.stepBtn, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="chevron-up" size={18} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  timeBox: {
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepper: { alignItems: 'center', gap: Spacing.one },
  stepBtn: {
    width: 44,
    height: 32,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: { fontSize: 28, fontWeight: '600', minWidth: 44, textAlign: 'center' },
  colon: { fontSize: 28, fontWeight: '600' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
