import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HIGHLIGHT_COLORS } from '@/constants/highlights';
import { Spacing } from '@/constants/theme';
import { useResolvedScheme } from '@/hooks/use-resolved-scheme';
import { useTheme } from '@/hooks/use-theme';

export type VerseActionsState = {
  verse: number;
  reference: string;
  color?: string;
  note: string;
  bookmarked: boolean;
};

type Props = {
  state: VerseActionsState | null;
  onClose: () => void;
  onSetHighlight: (color: string | null) => void;
  onToggleBookmark: () => void;
  onSaveNote: (content: string) => void;
};

export function VerseActionsSheet({
  state,
  onClose,
  onSetHighlight,
  onToggleBookmark,
  onSaveNote,
}: Props) {
  const theme = useTheme();
  const scheme = useResolvedScheme();
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    setNoteText(state?.note ?? '');
  }, [state]);

  const visible = state !== null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.background, borderColor: theme.border },
        ]}>
        <View style={styles.header}>
          <ThemedText type="smallBold" themeColor="tint">
            {state?.reference}
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Surlignage */}
        <ThemedText type="smallBold">Surligner</ThemedText>
        <View style={styles.colorRow}>
          {HIGHLIGHT_COLORS.map((c) => {
            const active = state?.color === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => onSetHighlight(active ? null : c.key)}
                style={[
                  styles.swatch,
                  { backgroundColor: c[scheme] },
                  active && { borderColor: theme.text, borderWidth: 2 },
                ]}>
                {active && <Ionicons name="checkmark" size={16} color={theme.text} />}
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => onSetHighlight(null)}
            style={[styles.swatch, styles.clearSwatch, { borderColor: theme.border }]}>
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Marque-page */}
        <Pressable
          onPress={onToggleBookmark}
          style={[styles.actionRow, { borderColor: theme.border }]}>
          <Ionicons
            name={state?.bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={state?.bookmarked ? theme.tint : theme.textSecondary}
          />
          <ThemedText>{state?.bookmarked ? 'Retirer le marque-page' : 'Ajouter un marque-page'}</ThemedText>
        </Pressable>

        {/* Note */}
        <ThemedText type="smallBold">Note personnelle</ThemedText>
        <TextInput
          value={noteText}
          onChangeText={setNoteText}
          placeholder="Écris ta réflexion sur ce verset…"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[
            styles.noteInput,
            { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
          ]}
        />
        <Pressable
          onPress={() => onSaveNote(noteText)}
          style={[styles.saveBtn, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.saveText}>Enregistrer</ThemedText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSwatch: {
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  noteInput: {
    minHeight: 90,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  saveBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
