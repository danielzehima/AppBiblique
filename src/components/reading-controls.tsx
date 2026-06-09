import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  FONT_SCALES,
  useReadingSettings,
  type FontFamilyPref,
  type ThemePref,
} from '@/store/reading-settings';

function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segmentItem,
              active && { backgroundColor: theme.tint },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: active ? '#FFFFFF' : theme.textSecondary }}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper() {
  const theme = useTheme();
  const scaleIndex = useReadingSettings((s) => s.scaleIndex);
  const increaseFont = useReadingSettings((s) => s.increaseFont);
  const decreaseFont = useReadingSettings((s) => s.decreaseFont);

  return (
    <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
      <Pressable onPress={decreaseFont} style={styles.stepBtn} disabled={scaleIndex === 0}>
        <Ionicons
          name="remove"
          size={20}
          color={scaleIndex === 0 ? theme.border : theme.text}
        />
      </Pressable>
      <ThemedText type="smallBold" style={{ minWidth: 36, textAlign: 'center' }}>
        {Math.round(FONT_SCALES[scaleIndex] * 100)}%
      </ThemedText>
      <Pressable
        onPress={increaseFont}
        style={styles.stepBtn}
        disabled={scaleIndex === FONT_SCALES.length - 1}>
        <Ionicons
          name="add"
          size={20}
          color={scaleIndex === FONT_SCALES.length - 1 ? theme.border : theme.text}
        />
      </Pressable>
    </View>
  );
}

export function ReadingControls() {
  const fontFamily = useReadingSettings((s) => s.fontFamily);
  const setFontFamily = useReadingSettings((s) => s.setFontFamily);
  const themePref = useReadingSettings((s) => s.themePref);
  const setThemePref = useReadingSettings((s) => s.setThemePref);

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <ThemedText type="smallBold">Taille du texte</ThemedText>
        <Stepper />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Police</ThemedText>
        <Segment<FontFamilyPref>
          value={fontFamily}
          onChange={setFontFamily}
          options={[
            { value: 'serif', label: 'Serif' },
            { value: 'sans', label: 'Sans' },
          ]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Thème</ThemedText>
        <Segment<ThemePref>
          value={themePref}
          onChange={setThemePref}
          options={[
            { value: 'system', label: 'Auto' },
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre' },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.half,
    alignItems: 'center',
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two - 1,
  },
  stepBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
