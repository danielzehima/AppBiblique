import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const pad = (n: number) => String(n).padStart(2, '0');
export const toISODate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Formate 'YYYY-MM-DD' en texte lisible (ex. 12 juin 2026). */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1].toLowerCase()} ${y}`;
}

type Props = {
  value: string | null;
  onSelect: (iso: string) => void;
  onClose: () => void;
};

export function CalendarModal({ value, onSelect, onClose }: Props) {
  const theme = useTheme();
  const initial = value ? value.split('-').map(Number) : null;
  const today = new Date();
  const [year, setYear] = useState(initial ? initial[0] : today.getFullYear());
  const [month, setMonth] = useState(initial ? initial[1] - 1 : today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const selISO = value;
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.wrap} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Pressable onPress={prevMonth} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={theme.tint} />
            </Pressable>
            <ThemedText type="smallBold">
              {MONTHS[month]} {year}
            </ThemedText>
            <Pressable onPress={nextMonth} hitSlop={8}>
              <Ionicons name="chevron-forward" size={22} color={theme.tint} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <ThemedText key={i} themeColor="textSecondary" type="small" style={styles.cellText}>
                {w}
              </ThemedText>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={styles.cell} />;
              const iso = toISODate(year, month, d);
              const selected = iso === selISO;
              const isToday = iso === todayISO;
              return (
                <Pressable
                  key={i}
                  onPress={() => onSelect(iso)}
                  style={[
                    styles.cell,
                    selected && { backgroundColor: theme.tint, borderRadius: 18 },
                    !selected && isToday && { borderColor: theme.tint, borderWidth: 1, borderRadius: 18 },
                  ]}>
                  <ThemedText style={{ color: selected ? '#FFFFFF' : theme.text }}>{d}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CELL = 38;
const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  wrap: { flex: 1, justifyContent: 'center', padding: Spacing.four },
  card: { borderRadius: Spacing.three, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, alignSelf: 'center', width: CELL * 7 + Spacing.three * 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three },
  weekRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  cellText: { width: CELL, textAlign: 'center' },
});
