import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReadingControls } from '@/components/reading-controls';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { getBook, getChapterVerses, type BookRow, type VerseRow } from '@/db/bible';
import { useTheme } from '@/hooks/use-theme';
import { useFontScale, useReadingSettings } from '@/store/reading-settings';

export default function ReaderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter: string }>();
  const bookNr = Number(book);
  const chapterNr = Number(chapter);

  const [meta, setMeta] = useState<BookRow | null>(null);
  const [verses, setVerses] = useState<VerseRow[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fontScale = useFontScale();
  const fontFamily = useReadingSettings((s) => s.fontFamily);
  const fontFamilyValue = fontFamily === 'serif' ? Fonts?.serif : Fonts?.sans;

  useEffect(() => {
    getBook(bookNr).then(setMeta).catch((e) => console.error('getBook', e));
  }, [bookNr]);

  useEffect(() => {
    getChapterVerses(bookNr, chapterNr)
      .then(setVerses)
      .catch((e) => console.error('getChapterVerses', e));
  }, [bookNr, chapterNr]);

  const hasPrev = chapterNr > 1;
  const hasNext = meta ? chapterNr < meta.chapter_count : false;
  const goTo = (c: number) =>
    router.replace({ pathname: '/read/[book]/[chapter]', params: { book: bookNr, chapter: c } });

  const verseFontSize = 18 * fontScale;
  const verseLineHeight = verseFontSize * 1.7;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: meta ? `${meta.name} ${chapterNr}` : '',
          headerRight: () => (
            <Pressable onPress={() => setSettingsOpen(true)} hitSlop={10}>
              <Ionicons name="text" size={22} color={theme.tint} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.three,
          paddingBottom: insets.bottom + Spacing.six,
        }}>
        <Text style={[styles.chapterTitle, { color: theme.tint, fontFamily: Fonts?.serif }]}>
          Chapitre {chapterNr}
        </Text>
        <Text style={{ color: theme.text }}>
          {verses.map((v) => (
            <Text key={v.verse} style={{ fontSize: verseFontSize, lineHeight: verseLineHeight }}>
              <Text style={[styles.verseNum, { color: theme.tint }]}>{v.verse} </Text>
              <Text style={{ fontFamily: fontFamilyValue }}>{v.text} </Text>
            </Text>
          ))}
        </Text>
      </ScrollView>

      <View
        style={[
          styles.nav,
          { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom || Spacing.three },
        ]}>
        <Pressable
          onPress={() => hasPrev && goTo(chapterNr - 1)}
          disabled={!hasPrev}
          style={styles.navBtn}>
          <Ionicons
            name="chevron-back"
            size={22}
            color={hasPrev ? theme.tint : theme.border}
          />
          <ThemedText style={{ color: hasPrev ? theme.tint : theme.border }}>Précédent</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => hasNext && goTo(chapterNr + 1)}
          disabled={!hasNext}
          style={styles.navBtn}>
          <ThemedText style={{ color: hasNext ? theme.tint : theme.border }}>Suivant</ThemedText>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={hasNext ? theme.tint : theme.border}
          />
        </Pressable>
      </View>

      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSettingsOpen(false)} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              paddingBottom: insets.bottom + Spacing.four,
            },
          ]}>
          <View style={styles.sheetHeader}>
            <ThemedText type="smallBold">Réglages de lecture</ThemedText>
            <Pressable onPress={() => setSettingsOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ReadingControls />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  verseNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
